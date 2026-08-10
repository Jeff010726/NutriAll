import { badRequest, json, readJson, serverError } from "./http";
import { getDb } from "./db";
import { hashPassword, randomId, sha256, verifyPassword } from "./crypto";
import { checkRateLimit } from "./rateLimit";
import type { Env } from "./types";

type RegisterPayload = {
  email?: string;
  password?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  preferredLanguage?: string;
  marketingOptIn?: boolean;
};

type LoginPayload = {
  email?: string;
  password?: string;
};

const sessionCookieName = "xt_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function trimToMax(value: string | undefined, max: number) {
  const trimmed = value?.trim() || "";
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function userResponse(row: Record<string, unknown>) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredLanguage: row.preferred_language,
    marketingOptIn: Boolean(row.marketing_opt_in),
  };
}

function newUserResponse(input: {
  id: string;
  email: string;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredLanguage: string;
  marketingOptIn: boolean;
}) {
  return {
    id: input.id,
    email: input.email,
    phone: input.phone,
    firstName: input.firstName,
    lastName: input.lastName,
    preferredLanguage: input.preferredLanguage,
    marketingOptIn: input.marketingOptIn,
  };
}

function sessionCookie(token: string) {
  return `${sessionCookieName}=${token}; Path=/; Max-Age=${sessionMaxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

function clearSessionCookie() {
  return `${sessionCookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

async function createSession(env: Env, userId: string) {
  const db = getDb(env);
  const token = randomId("sess_");
  const sessionHash = await sha256(token);
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString();
  await db
    .prepare("INSERT INTO sessions (id, user_id, session_hash, expires_at) VALUES (?, ?, ?, ?)")
    .bind(randomId("ses_"), userId, sessionHash, expiresAt)
    .run();
  return token;
}

export async function getCurrentUser(request: Request, env: Env) {
  const token = readCookie(request, sessionCookieName);
  if (!token) return null;

  const db = getDb(env);
  const sessionHash = await sha256(token);
  const row = await db
    .prepare(
      `SELECT users.*
       FROM sessions
       JOIN users ON users.id = sessions.user_id
       WHERE sessions.session_hash = ? AND sessions.expires_at > datetime('now')
       LIMIT 1`,
    )
    .bind(sessionHash)
    .first<Record<string, unknown>>();

  return row ? userResponse(row) : null;
}

export async function register(request: Request, env: Env) {
  const rateLimited = checkRateLimit(request, env, "auth_register", 8, 60);
  if (rateLimited) return rateLimited;

  const payload = await readJson<RegisterPayload>(request);
  if (!payload) return badRequest(request, env, "Invalid JSON body");

  const email = normalizeEmail(payload.email || "");
  const password = payload.password || "";
  const phone = trimToMax(payload.phone, 40);
  const firstName = trimToMax(payload.firstName, 80);
  const lastName = trimToMax(payload.lastName, 80);
  const preferredLanguage = trimToMax(payload.preferredLanguage, 16) || "en";

  if (!validEmail(email)) return badRequest(request, env, "Valid email is required");
  if (email.length > 254) return badRequest(request, env, "Email is too long");
  if (password.length < 8) return badRequest(request, env, "Password must be at least 8 characters");
  if (password.length > 256) return badRequest(request, env, "Password is too long");

  const db = getDb(env);
  const existing = await db.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").bind(email).first();
  if (existing) return badRequest(request, env, "An account with this email already exists");

  const userId = randomId("usr_");
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO users (id, email, phone, first_name, last_name, preferred_language, marketing_opt_in, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      userId,
      email,
      phone || null,
      firstName || null,
      lastName || null,
      preferredLanguage,
      payload.marketingOptIn ? 1 : 0,
      now,
      now,
    )
    .run();

  await db
    .prepare("INSERT INTO auth_identities (id, user_id, provider, password_hash, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(randomId("aid_"), userId, "password", passwordHash, now)
    .run();

  await db
    .prepare("INSERT INTO member_events (id, user_id, type, metadata_json, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(randomId("evt_"), userId, "registered", JSON.stringify({ source: "member_page" }), now)
    .run();

  const token = await createSession(env, userId);
  const user = newUserResponse({
    id: userId,
    email,
    phone: phone || null,
    firstName: firstName || null,
    lastName: lastName || null,
    preferredLanguage,
    marketingOptIn: Boolean(payload.marketingOptIn),
  });

  return json(request, env, { user }, { status: 201, headers: { "Set-Cookie": sessionCookie(token) } });
}

export async function login(request: Request, env: Env) {
  const rateLimited = checkRateLimit(request, env, "auth_login", 12, 60);
  if (rateLimited) return rateLimited;

  const payload = await readJson<LoginPayload>(request);
  if (!payload) return badRequest(request, env, "Invalid JSON body");

  const email = normalizeEmail(payload.email || "");
  const password = payload.password || "";
  if (!validEmail(email) || !password) return badRequest(request, env, "Email and password are required");
  if (email.length > 254 || password.length > 256) return badRequest(request, env, "Invalid email or password");

  const db = getDb(env);
  const row = await db
    .prepare(
      `SELECT users.*, auth_identities.password_hash
       FROM users
       JOIN auth_identities ON auth_identities.user_id = users.id
       WHERE users.email = ? AND auth_identities.provider = 'password'
       LIMIT 1`,
    )
    .bind(email)
    .first<Record<string, unknown>>();

  if (!row || typeof row.password_hash !== "string" || !(await verifyPassword(password, row.password_hash))) {
    return badRequest(request, env, "Invalid email or password");
  }

  const token = await createSession(env, String(row.id));
  return json(request, env, { user: userResponse(row) }, { headers: { "Set-Cookie": sessionCookie(token) } });
}

export async function me(request: Request, env: Env) {
  try {
    const user = await getCurrentUser(request, env);
    return json(request, env, { user });
  } catch (error) {
    return serverError(request, env, error instanceof Error ? error.message : undefined);
  }
}

export async function logout(request: Request, env: Env) {
  const token = readCookie(request, sessionCookieName);
  if (token && env.DB) {
    await env.DB.prepare("DELETE FROM sessions WHERE session_hash = ?").bind(await sha256(token)).run();
  }
  return json(request, env, { ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
