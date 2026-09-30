import { encodeBase64UrlJson } from "./crypto";
import type { Env } from "./types";

const scope = "https://www.googleapis.com/auth/spreadsheets";
let cachedToken: { token: string; expiresAt: number; email: string } | null = null;

export const bookingSheetHeaders = [
  "Submitted at (UTC)", "Brand", "Service", "Name", "Email", "Phone", "Age", "Preferred language",
  "Best time to call", "Client time zone", "Source page", "Patient type",
  "Booking ID (do not edit)", "Insurance company", "Follow-up status (editable)", "Assigned to (editable)",
  "Next contact (editable)", "Notes (editable)",
];

export function sheetConfig(env: Env) {
  const missing = (["GOOGLE_SHEETS_SPREADSHEET_ID", "GOOGLE_SHEETS_CLIENT_EMAIL", "GOOGLE_SHEETS_PRIVATE_KEY"] as const).filter((key) => !env[key]);
  const tabName = env.GOOGLE_SHEETS_TAB_NAME || "NutriAll Bookings";
  return {
    configured: missing.length === 0, missing, tabName,
    spreadsheetUrl: env.GOOGLE_SHEETS_SPREADSHEET_ID ? `https://docs.google.com/spreadsheets/d/${encodeURIComponent(env.GOOGLE_SHEETS_SPREADSHEET_ID)}/edit` : "",
    target: `${env.GOOGLE_SHEETS_SPREADSHEET_ID || ""}:${tabName}`,
  };
}

function tabRange(env: Env, cells: string) {
  return encodeURIComponent(`'${sheetConfig(env).tabName.replace(/'/g, "''")}'!${cells}`);
}

function normalizePrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

async function signJwt(privateKeyPem: string, unsignedToken: string) {
  const pem = normalizePrivateKey(privateKeyPem)
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(pem);
  const keyData = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedToken));
  let signatureBinary = "";
  for (const byte of new Uint8Array(signature)) signatureBinary += String.fromCharCode(byte);
  return btoa(signatureBinary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getAccessToken(env: Env) {
  if (!env.GOOGLE_SHEETS_CLIENT_EMAIL || !env.GOOGLE_SHEETS_PRIVATE_KEY) {
    throw new Error("Google Sheets service account secrets are not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.email === env.GOOGLE_SHEETS_CLIENT_EMAIL && cachedToken.expiresAt - 60 > now) return cachedToken.token;

  const header = encodeBase64UrlJson({ alg: "RS256", typ: "JWT" });
  const claim = encodeBase64UrlJson({
    iss: env.GOOGLE_SHEETS_CLIENT_EMAIL,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  });
  const unsignedToken = `${header}.${claim}`;
  const signature = await signJwt(env.GOOGLE_SHEETS_PRIVATE_KEY, unsignedToken);
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    signal: AbortSignal.timeout(7000),
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google auth failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Google auth response did not include access_token");
  cachedToken = { token: data.access_token, expiresAt: now + 3600, email: env.GOOGLE_SHEETS_CLIENT_EMAIL };
  return data.access_token;
}

async function sheetsRequest(env: Env, path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken(env);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(env.GOOGLE_SHEETS_SPREADSHEET_ID || "")}${path}`;
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(7000),
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
  });
  if (!response.ok) {
    if (response.status === 401) cachedToken = null;
    // Google error bodies can contain submitted personal data. Do not persist them.
    throw new Error(`Google Sheets request failed (${response.status}). Check sharing permissions, tab headers, and API access.`);
  }
  return response.json() as Promise<{ values?: string[][]; sheets?: { properties: { sheetId: number; title: string } }[] }>;
}

// Only an administrator calls setup. Automatic delivery never changes formatting or headers.
export async function prepareBookingSheet(env: Env) {
  if (!sheetConfig(env).configured) throw new Error("Google Sheets is not configured");
  const { tabName } = sheetConfig(env);
  const workbook = await sheetsRequest(env, "?fields=sheets.properties");
  if (!workbook.sheets?.some((sheet) => sheet.properties.title === tabName)) {
    await sheetsRequest(env, ":batchUpdate", { method: "POST", body: JSON.stringify({ requests: [{ addSheet: { properties: { title: tabName, gridProperties: { frozenRowCount: 1, columnCount: 18 } } } }] }) });
  }
  const range = tabRange(env, "A1:R1");
  const existing = await sheetsRequest(env, `/values/${range}`);
  const headers = existing.values?.[0] || [];
  if (headers.length && headers.some((header, i) => header !== bookingSheetHeaders[i])) throw new Error("This tab already contains different headers. Choose an empty tab; existing data has not been changed.");
  if (!headers.length) {
    const occupied = await sheetsRequest(env, `/values/${tabRange(env, "A:R")}?majorDimension=ROWS`);
    if (occupied.values?.length) throw new Error("The tab contains data below an empty header. Choose an empty tab.");
    await sheetsRequest(env, `/values/${range}?valueInputOption=RAW`, { method: "PUT", body: JSON.stringify({ values: [bookingSheetHeaders] }) });
  }
}

export async function appendContactToSheet(env: Env, values: string[]) {
  if (!sheetConfig(env).configured) throw new Error("Google Sheets is not configured");
  if (values.length !== 18 || !values[12]) throw new Error("A booking ID and all sheet columns are required");
  const existing = await sheetsRequest(env, `/values/${tabRange(env, "M:M")}`);
  if (existing.values?.[0]?.[0] !== bookingSheetHeaders[12]) throw new Error("Prepare the booking tab in the admin dashboard before syncing");
  // Recover safely when Google accepted an earlier request but its response was lost.
  if (existing.values.some((row) => row[0] === values[12])) return;
  await sheetsRequest(env, `/values/${tabRange(env, "A:R")}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: "POST", body: JSON.stringify({ values: [values] }),
  });
}
