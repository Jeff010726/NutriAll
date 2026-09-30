import assert from "node:assert/strict";
import { test, after } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { generateKeyPairSync } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { build } = require(require.resolve("esbuild", { paths: [path.dirname(require.resolve("wrangler/package.json"))] }));
const root = path.resolve(import.meta.dirname, "../..");
const temp = await mkdtemp(path.join(tmpdir(), "nutriall-sheets-test-"));
await build({
  stdin: { contents: 'export * from "./worker/src/contact.ts"; export * from "./worker/src/bookingSheets.ts"; export * from "./worker/src/googleSheets.ts";', resolveDir: root },
  bundle: true, platform: "node", format: "esm", outfile: path.join(temp, "worker.mjs"),
  plugins: [{ name: "no-email-network", setup(builder) {
    builder.onResolve({ filter: /^cloudflare:sockets$/ }, () => ({ path: "sockets", namespace: "test" }));
    builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({ contents: 'export function connect() { throw new Error("Unexpected email network access"); }' }));
  } }],
});
const { submitContact, syncBookingToSheet, prepareBookingSheet, bookingSheetHeaders } = await import(pathToFileURL(path.join(temp, "worker.mjs")));
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const originalFetch = globalThis.fetch;
after(async () => { globalThis.fetch = originalFetch; await rm(temp, { recursive: true }); });

async function database() {
  const sqlite = new DatabaseSync(":memory:");
  const dir = path.join(root, "worker/migrations");
  for (const file of (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort()) sqlite.exec(await readFile(path.join(dir, file), "utf8"));
  const DB = { prepare(sql) {
    const statement = sqlite.prepare(sql);
    let values = [];
    return {
      bind(...params) { values = params; return this; },
      async first() { return statement.get(...values) || null; },
      async all() { return { results: statement.all(...values) }; },
      async run() { return { meta: statement.run(...values) }; },
    };
  } };
  return { sqlite, env: { DB, APP_ENV: "test", GOOGLE_SHEETS_SPREADSHEET_ID: "test-sheet", GOOGLE_SHEETS_CLIENT_EMAIL: "test@example.iam.gserviceaccount.com", GOOGLE_SHEETS_PRIVATE_KEY: privateKey } };
}

function google({ failure = false, ids = [], loseResponse = false, checkSaved } = {}) {
  const appended = [];
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    checkSaved?.();
    const endpoint = decodeURIComponent(String(url));
    calls.push({ endpoint, init });
    if (endpoint.includes("oauth2.googleapis.com")) return Response.json({ access_token: "local-test-token" });
    if (failure) return new Response("failure", { status: 503 });
    if (endpoint.includes(":append")) {
      const row = JSON.parse(init.body).values[0];
      appended.push(row); ids.push(row[13]);
      if (loseResponse) throw new Error("Response lost");
      return Response.json({ updates: { updatedRows: 1 } });
    }
    return Response.json({ values: [[bookingSheetHeaders[13]], ...ids.map((id) => [id])] });
  };
  return { appended, calls };
}

async function submit(env, overrides = {}) {
  const jobs = [];
  const request = new Request("https://example.com/api/contact", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": crypto.randomUUID() }, body: JSON.stringify({
    name: "Test Client", email: "test@example.com", phone: "+1 0123456789", age: "45", preferredLanguage: "English", availability: "10AM - 12PM", patientType: "new", sourcePage: "/book", ...overrides,
  }) });
  const response = await submitContact(request, env, { waitUntil(job) { jobs.push(job); } });
  const data = await response.json();
  await Promise.all(jobs);
  return { response, data };
}

test("saved booking survives Google failure; retry copies once and preserves manual edits", async () => {
  const { sqlite, env } = await database();
  google({ failure: true, checkSaved() { assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM contact_leads").get().n, 1); } });
  const { response, data } = await submit(env);
  assert.equal(response.status, 200);
  assert.equal(sqlite.prepare("SELECT sheet_status FROM contact_leads WHERE id = ?").get(data.id).sheet_status, "failed");
  const good = google();
  assert.equal(await syncBookingToSheet(env, data.id), "synced");
  good.appended[0][18] = "Manually edited follow-up note";
  assert.equal(await syncBookingToSheet(env, data.id), "skipped");
  assert.equal(good.appended.length, 1);
  assert.equal(good.appended[0][18], "Manually edited follow-up note");
  sqlite.close();
});

test("RAW input retains plus/zero phone numbers and prevents formula execution", async () => {
  const { sqlite, env } = await database();
  const fake = google();
  await submit(env, { name: '=HYPERLINK("https://example.com")', insuranceMemberId: "PRIVATE-MEMBER-ID", dateOfBirth: "1980-01-01" });
  assert.match(fake.calls.find((call) => call.endpoint.includes(":append")).endpoint, /valueInputOption=RAW/);
  assert.equal(fake.appended[0][5], "+1 0123456789");
  assert.equal(fake.appended[0][3], '=HYPERLINK("https://example.com")');
  assert.equal(fake.appended[0].length, 19);
  assert.ok(!fake.appended[0].includes("PRIVATE-MEMBER-ID"));
  assert.ok(!fake.appended[0].includes("1980-01-01"));
  sqlite.close();
});

test("lost Google append response is reconciled by booking ID without duplicating", async () => {
  const { sqlite, env } = await database();
  const ids = [];
  const first = google({ ids, loseResponse: true });
  const { data } = await submit(env);
  assert.equal(first.appended.length, 1);
  const retry = google({ ids });
  assert.equal(await syncBookingToSheet(env, data.id), "synced");
  assert.equal(retry.appended.length, 0);
  sqlite.close();
});

test("concurrent retries cannot append the same booking twice", async () => {
  const { sqlite, env } = await database();
  google({ failure: true });
  const { data } = await submit(env);
  const retry = google();
  const results = await Promise.all([syncBookingToSheet(env, data.id), syncBookingToSheet(env, data.id)]);
  assert.deepEqual(results.sort(), ["skipped", "synced"]);
  assert.equal(retry.appended.length, 1);
  sqlite.close();
});

test("unconfigured Google cannot prevent successful booking", async () => {
  const { sqlite, env } = await database();
  delete env.GOOGLE_SHEETS_PRIVATE_KEY;
  globalThis.fetch = () => { throw new Error("Google must not be called"); };
  const { response, data } = await submit(env);
  assert.equal(response.status, 200);
  assert.equal(sqlite.prepare("SELECT sheet_status FROM contact_leads WHERE id = ?").get(data.id).sheet_status, "not_configured");
  sqlite.close();
});

test("preparing a pre-existing tab never replaces other headers", async () => {
  const { sqlite, env } = await database();
  let writes = 0;
  globalThis.fetch = async (url, init = {}) => {
    if (init.method === "PUT" || init.method === "POST") writes++;
    if (String(url).includes("?fields=")) return Response.json({ sheets: [{ properties: { sheetId: 0, title: "NutriAll Bookings" } }] });
    return Response.json({ values: [["Owner's existing data"]] });
  };
  await assert.rejects(prepareBookingSheet(env), /different headers/);
  assert.equal(writes, 0);
  sqlite.close();
});
