import { encodeBase64UrlJson } from "./crypto";
import type { Env } from "./types";

const scope = "https://www.googleapis.com/auth/spreadsheets";
let cachedToken: { token: string; expiresAt: number } | null = null;

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
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.token;

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
  cachedToken = { token: data.access_token, expiresAt: now + 3600 };
  return data.access_token;
}

export async function appendContactToSheet(env: Env, values: string[]) {
  if (!env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not configured");
  }

  const accessToken = await getAccessToken(env);
  const range = encodeURIComponent("'Contact Leads'!A:M");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${env.GOOGLE_SHEETS_SPREADSHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Google Sheets append failed: ${response.status}${body ? ` ${body.slice(0, 240)}` : ""}`);
  }
}
