import { getDb } from "./db";
import { appendContactToSheet, sheetConfig } from "./googleSheets";
import type { Env } from "./types";

type BookingSheetRow = Record<string, string | number | null> & { id: string };

export function bookingSheetValues(row: BookingSheetRow): string[] {
  // A:M preserves the original export layout. N is the permanent identity key.
  // Follow-up fields are seeded once; sheet edits are never overwritten or imported.
  return [row.created_at, "NutriAll", row.service_interest, row.name, row.email, row.phone, row.age,
    row.preferred_language, row.availability, row.time_zone, row.source_page,
    [row.utm_source, row.utm_medium, row.utm_campaign].filter(Boolean).join(" / "),
    row.patient_type === "returning" ? "Returning patient" : row.patient_type === "new" ? "New patient" : "",
    row.id, row.insurance_company, row.lead_status || "new", row.assigned_to, row.follow_up_at, row.notes,
  ].map((value) => value == null ? "" : String(value));
}

export async function syncBookingToSheet(env: Env, id: string): Promise<"synced" | "failed" | "skipped"> {
  const config = sheetConfig(env);
  if (!config.configured) return "skipped";
  const db = getDb(env);
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const staleBefore = new Date(Date.now() - 5 * 60_000).toISOString();
  const claim = await db.prepare(
    `UPDATE contact_leads SET sheet_status = 'syncing', sheet_sync_token = ?, sheet_sync_started_at = ?
     WHERE id = ? AND (sheet_status != 'synced' OR COALESCE(sheet_sync_target, '') != ?)
       AND (sheet_status != 'syncing' OR sheet_sync_started_at IS NULL OR sheet_sync_started_at < ?)`,
  ).bind(token, now, id, config.target, staleBefore).run();
  if (!claim.meta.changes) return "skipped";
  try {
    const row = await db.prepare("SELECT * FROM contact_leads WHERE id = ?").bind(id).first<BookingSheetRow>();
    if (!row) return "skipped";
    await appendContactToSheet(env, bookingSheetValues(row));
    await db.prepare("UPDATE contact_leads SET sheet_status = 'synced', sheet_error = NULL, sheet_sync_target = ?, sheet_sync_token = NULL WHERE id = ? AND sheet_sync_token = ?")
      .bind(config.target, id, token).run();
    return "synced";
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Google Sheets sync failed";
    await db.prepare("UPDATE contact_leads SET sheet_status = 'failed', sheet_error = ?, sheet_sync_token = NULL WHERE id = ? AND sheet_sync_token = ?")
      .bind(message, id, token).run();
    return "failed";
  }
}
