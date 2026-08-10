const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer | Uint8Array) {
  let binary = "";
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function randomId(prefix = "") {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `${prefix}${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function sha256(value: string) {
  return toBase64Url(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

export async function hashPassword(password: string, salt = randomId()) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const iterations = 100000;
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2_sha256$${iterations}$${salt}$${toBase64Url(bits)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterations, salt, hash] = storedHash.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterations || !salt || !hash) return false;

  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const iterationCount = Math.min(Number(iterations), 100000);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: iterationCount, hash: "SHA-256" },
    key,
    256,
  );
  return toBase64Url(bits) === hash;
}

export function decodeBase64UrlJson<T>(value: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(fromBase64Url(value))) as T;
  } catch {
    return null;
  }
}

export function encodeBase64UrlJson(data: unknown) {
  return toBase64Url(encoder.encode(JSON.stringify(data)));
}
