// Run with an explicitly supplied service-account key path. Never log key material or rows.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { createSign } from "node:crypto";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const wrangler = path.join(path.dirname(require.resolve("wrangler/package.json")), "bin/wrangler.js");
const { build } = require(require.resolve("esbuild", { paths: [path.dirname(require.resolve("wrangler/package.json"))] }));
const [mode, keyPath] = process.argv.slice(2);
if (!["inspect", "prepare", "configure", "backfill", "verify", "remove-ad-column"].includes(mode) || !keyPath) {
  throw new Error("Usage: node scripts/connect-booking-sheet.mjs inspect|prepare|configure|backfill|verify|remove-ad-column <key-file-path>");
}

const configText = await readFile(path.join(root, "wrangler.toml"), "utf8");
const spreadsheetId = configText.match(/^GOOGLE_SHEETS_SPREADSHEET_ID = "([^"]+)"/m)?.[1];
const tabName = configText.match(/^GOOGLE_SHEETS_TAB_NAME = "([^"]+)"/m)?.[1];
if (!spreadsheetId || !tabName) throw new Error("Configure the destination spreadsheet and tab first");
const key = JSON.parse(await readFile(path.resolve(keyPath), "utf8"));
if (key.type !== "service_account" || !key.client_email || !key.private_key) throw new Error("Not a Google service-account JSON key");
const env = { GOOGLE_SHEETS_SPREADSHEET_ID: spreadsheetId, GOOGLE_SHEETS_TAB_NAME: tabName,
  GOOGLE_SHEETS_CLIENT_EMAIL: key.client_email, GOOGLE_SHEETS_PRIVATE_KEY: key.private_key };
const encoded = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const now = Math.floor(Date.now() / 1000);
const unsigned = encoded({ alg: "RS256", typ: "JWT" }) + "." + encoded({
  iss: key.client_email, scope: "https://www.googleapis.com/auth/spreadsheets",
  aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
});
const signature = createSign("RSA-SHA256").update(unsigned).sign(key.private_key, "base64url");
const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST", signal: AbortSignal.timeout(15000),
  body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: unsigned + "." + signature }),
});
if (!tokenResponse.ok) throw new Error(`Google authorization failed (${tokenResponse.status})`);
const tokenData = await tokenResponse.json();
if (!tokenData.access_token) throw new Error("Google did not return a token");
async function google(suffix, init = {}) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${suffix}`, {
    ...init, signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${tokenData.access_token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const reasons = (error.error?.details || []).map((detail) => detail.reason).filter(Boolean);
    throw new Error(`Google Sheets access failed (${response.status}${reasons.length ? ": " + reasons.join(", ") : ""}). Check API enablement and share the target sheet with ${key.client_email} as Editor.`);
  }
  return response.json();
}
const workbook = await google("?fields=spreadsheetId,properties.title,sheets.properties");
console.log(JSON.stringify({ sheetTitle: workbook.properties.title, account: key.client_email, tabExists: workbook.sheets.some((sheet) => sheet.properties.title === tabName) }));
if (mode === "inspect") process.exit(0);

function cli(args, stdin = "") {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, ...args], { cwd: root, shell: false, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    let errorOutput = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { errorOutput += chunk; });
    child.on("error", () => reject(new Error("Could not start Cloudflare CLI")));
    child.on("close", (code) => {
      // Never relay arbitrary CLI output: commands may handle credentials or client records.
      if (code !== 0) reject(new Error(`Cloudflare ${args.slice(0, 2).join(" ")} failed (exit ${code}); output withheld to protect credentials and client data.`));
      else resolve(output);
      errorOutput = "";
    });
    child.stdin.on("error", () => {});
    child.stdin.end(stdin);
  });
}
async function sql(statement) {
  const output = await cli(["d1", "execute", "nutriall-db", "--remote", "--command", statement, "--json"]);
  const result = JSON.parse(output)[0];
  if (!result?.success) throw new Error("Cloudflare database query failed");
  return result;
}
const quote = (value) => value == null ? "NULL" : typeof value === "number" ? String(value) : "'" + String(value).replaceAll("'", "''") + "'";
env.DB = { prepare(statement) {
  let values = [];
  async function execute() {
    let index = 0;
    const bound = statement.replace(/\?/g, () => quote(values[index++]));
    if (index !== values.length) throw new Error("Invalid parameter count");
    return sql(bound);
  }
  return { bind(...params) { values = params; return this; }, async run() { return execute(); }, async first() { return (await execute()).results[0] || null; }, async all() { return execute(); } };
} };
const compiled = await build({ stdin: { contents: 'export * from "./worker/src/googleSheets.ts"; export * from "./worker/src/bookingSheets.ts";', resolveDir: root }, bundle: true, platform: "node", format: "esm", write: false });
const integration = await import("data:text/javascript;base64," + Buffer.from(compiled.outputFiles[0].text).toString("base64"));
const target = integration.sheetConfig(env).target;
const range = (cells) => encodeURIComponent(`'${tabName.replaceAll("'", "''")}'!${cells}`);

if (mode === "prepare") {
  await integration.prepareBookingSheet(env);
  const after = await google("?fields=sheets.properties");
  const tab = after.sheets.find((sheet) => sheet.properties.title === tabName).properties;
  // Set only header presentation and column widths on the dedicated booking tab.
  await google(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [
    { updateSheetProperties: { properties: { sheetId: tab.sheetId, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } },
    { repeatCell: { range: { sheetId: tab.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 18 }, cell: { userEnteredFormat: { backgroundColor: { red: .09, green: .21, blue: .18 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } }, wrapStrategy: "WRAP" } }, fields: "userEnteredFormat" } },
    { updateDimensionProperties: { range: { sheetId: tab.sheetId, dimension: "ROWS", startIndex: 0, endIndex: 1 }, properties: { pixelSize: 48 }, fields: "pixelSize" } },
    { updateDimensionProperties: { range: { sheetId: tab.sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 18 }, properties: { pixelSize: 190 }, fields: "pixelSize" } },
    { updateDimensionProperties: { range: { sheetId: tab.sheetId, dimension: "COLUMNS", startIndex: 17, endIndex: 18 }, properties: { pixelSize: 320 }, fields: "pixelSize" } },
  ] }) });
  console.log(JSON.stringify({ prepared: true, columns: integration.bookingSheetHeaders.length, url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=${tab.sheetId}` }));
} else if (mode === "configure") {
  const values = await google(`/values/${range("A1:R1")}`);
  if (JSON.stringify(values.values?.[0]) !== JSON.stringify(integration.bookingSheetHeaders)) throw new Error("Prepare the sheet before configuring automatic delivery");
  await cli(["secret", "bulk"], JSON.stringify({ GOOGLE_SHEETS_CLIENT_EMAIL: key.client_email, GOOGLE_SHEETS_PRIVATE_KEY: key.private_key }));
  console.log(JSON.stringify({ configured: true, secretsWritten: 2 }));
} else if (mode === "backfill") {
  const pending = await sql(`SELECT id FROM contact_leads WHERE sheet_status != 'synced' OR COALESCE(sheet_sync_target, '') != ${quote(target)} ORDER BY created_at ASC`);
  console.log(JSON.stringify({ pending: pending.results.length }));
  let synced = 0;
  let skipped = 0;
  for (const row of pending.results) {
    const result = await integration.syncBookingToSheet(env, row.id);
    if (result === "failed") throw new Error(`Backfill stopped after ${synced} successful records. No client data was logged; retry the same command after checking permissions.`);
    if (result === "synced") synced++; else skipped++;
    console.log(JSON.stringify({ synced, skipped, total: pending.results.length }));
  }
} else if (mode === "verify") {
  const records = await sql("SELECT id, sheet_status, sheet_sync_target FROM contact_leads");
  const sheet = await google(`/values/${range("M2:M")}`);
  const ids = (sheet.values || []).map((row) => row[0]).filter(Boolean);
  const missing = records.results.filter((row) => !ids.includes(row.id)).length;
  const pending = records.results.filter((row) => row.sheet_status !== "synced" || row.sheet_sync_target !== target).length;
  const duplicateIds = ids.length - new Set(ids).size;
  console.log(JSON.stringify({ databaseBookings: records.results.length, sheetBookings: ids.length, missing, pending, duplicateIds }));
  if (missing || pending || duplicateIds) process.exitCode = 1;
} else if (mode === "remove-ad-column") {
  const tab = workbook.sheets.find((sheet) => sheet.properties.title === tabName)?.properties;
  if (!tab) throw new Error("Booking tab not found");
  const before = await google(`/values/${range("A:S")}?valueRenderOption=FORMULA`);
  const oldHeaders = [...integration.bookingSheetHeaders];
  oldHeaders.splice(11, 0, "Ad source / medium / campaign");
  const headers = before.values?.[0] || [];
  if (JSON.stringify(headers) === JSON.stringify(integration.bookingSheetHeaders)) {
    console.log(JSON.stringify({ alreadyRemoved: true }));
    process.exit(0);
  }
  if (JSON.stringify(headers) !== JSON.stringify(oldHeaders)) throw new Error("Unexpected sheet layout; no columns were changed");
  const expected = before.values.map((row) => {
    const remaining = [...row]; remaining.splice(11, 1);
    while (remaining.at(-1) === "") remaining.pop();
    return remaining;
  });
  await google(":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [
    { deleteDimension: { range: { sheetId: tab.sheetId, dimension: "COLUMNS", startIndex: 11, endIndex: 12 } } },
  ] }) });
  const after = await google(`/values/${range("A:R")}?valueRenderOption=FORMULA`);
  if (JSON.stringify(after.values) !== JSON.stringify(expected)) throw new Error("Column removed but content verification changed; review concurrent sheet edits before proceeding");
  console.log(JSON.stringify({ removed: "Ad source / medium / campaign", retainedRows: after.values.length - 1, otherCellsPreserved: true }));
}
