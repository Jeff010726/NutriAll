import { getDb } from "./db";
import { json } from "./http";
import type { Env } from "./types";

type BookingActivityRow = {
  id: string;
  name: string;
  service_interest: string | null;
  created_at: string;
};

function maskName(value: string) {
  const name = value.trim();
  if (!name) return "Guest";
  if (/^[\p{Script=Han}]/u.test(name)) return `${Array.from(name)[0]}**`;
  const initial = Array.from(name)[0]?.toLocaleUpperCase() || "G";
  return `${initial}***`;
}

function publicKind(value: string | null) {
  const service = (value || "").toLocaleLowerCase();
  if (service.includes("community") || service.includes("class") || service.includes("church")) return "community-program";
  if (service.includes("general") || service.includes("insurance") || service.includes("free")) return "free-call";
  return "nutrition-consultation";
}

function avatarIndex(id: string, poolSize = 6) {
  let hash = 2166136261;
  for (const character of id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % poolSize;
}

export async function publicBookingActivity(request: Request, env: Env) {
  const db = getDb(env);
  const rows = await db.prepare(
    `SELECT id, name, service_interest, created_at
     FROM contact_leads
     WHERE COALESCE(lead_status, 'new') != 'spam'
     ORDER BY created_at DESC
     LIMIT 8`,
  ).all<BookingActivityRow>();

  const activities = (rows.results || []).map((row) => ({
    name: maskName(row.name),
    kind: publicKind(row.service_interest),
    createdAt: row.created_at,
    avatarIndex: avatarIndex(row.id),
  }));

  return json(request, env, { activities }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
