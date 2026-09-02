import { getDb } from "./db";
import { randomId, sha256, verifyPassword } from "./crypto";
import { badRequest, json, readJson, responseHeaders } from "./http";
import { checkRateLimit } from "./rateLimit";
import { sendSmtpEmail, smtpConfigStatus } from "./smtp";
import type { Env } from "./types";

type LoginPayload = {
  email?: string;
  password?: string;
};

type DeleteBookingPayload = {
  id?: string;
};

type UpdateBookingPayload = {
  id?: string;
  leadStatus?: string;
  assignedTo?: string;
  followUpAt?: string;
  notes?: string;
  markContacted?: boolean;
};

type UpdateCommunityInquiryPayload = {
  id?: string;
  leadStatus?: string;
  assignedTo?: string;
  followUpAt?: string;
  notes?: string;
};

type ClassSignupFileRow = {
  id: string;
  signup_id: string;
  kind: "front" | "back";
  object_key: string;
  original_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string;
};

const adminCookieName = "nutriall_admin_session";
const adminSessionMaxAgeSeconds = 60 * 60 * 8;

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function adminCookie(token: string) {
  return `${adminCookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=${adminSessionMaxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

function clearAdminCookie() {
  return `${adminCookieName}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function adminEmail(env: Env) {
  return normalizeEmail(env.ADMIN_EMAIL || "");
}

async function validAdminPassword(env: Env, password: string) {
  if (env.ADMIN_PASSWORD_HASH) return verifyPassword(password, env.ADMIN_PASSWORD_HASH);
  return Boolean(env.ADMIN_PASSWORD && password === env.ADMIN_PASSWORD);
}

async function createAdminSession(env: Env, email: string) {
  const token = randomId("adm_");
  const sessionHash = await sha256(token);
  const expiresAt = new Date(Date.now() + adminSessionMaxAgeSeconds * 1000).toISOString();
  await getDb(env)
    .prepare("INSERT INTO admin_sessions (id, email, session_hash, expires_at) VALUES (?, ?, ?, ?)")
    .bind(randomId("ads_"), email, sessionHash, expiresAt)
    .run();
  return token;
}

async function getAdminSession(request: Request, env: Env) {
  const token = readCookie(request, adminCookieName);
  if (!token) return null;

  const sessionHash = await sha256(token);
  const row = await getDb(env)
    .prepare("SELECT email FROM admin_sessions WHERE session_hash = ? AND expires_at > datetime('now') LIMIT 1")
    .bind(sessionHash)
    .first<{ email: string }>();
  return row;
}

export async function requireAdmin(request: Request, env: Env) {
  const session = await getAdminSession(request, env);
  return session ? null : adminJson(request, env, { error: "Unauthorized" }, { status: 401 });
}

export function adminJson(request: Request, env: Env, data: unknown, init: ResponseInit = {}) {
  return json(request, env, data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });
}

function htmlResponse(request: Request, env: Env, body: string) {
  return new Response(body, {
    headers: {
      ...responseHeaders(request, env),
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' data: https://flagcdn.com; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    },
  });
}

export async function adminLogin(request: Request, env: Env) {
  const rateLimited = checkRateLimit(request, env, "admin_login", 8, 60);
  if (rateLimited) return rateLimited;

  const payload = await readJson<LoginPayload>(request);
  if (!payload) return badRequest(request, env, "Invalid JSON body");

  const configuredEmail = adminEmail(env);
  if (!configuredEmail || (!env.ADMIN_PASSWORD && !env.ADMIN_PASSWORD_HASH)) {
    return adminJson(request, env, { error: "Admin credentials are not configured" }, { status: 503 });
  }

  const email = normalizeEmail(payload.email || "");
  const password = payload.password || "";
  if (email !== configuredEmail || !(await validAdminPassword(env, password))) {
    return adminJson(request, env, { error: "Invalid email or password" }, { status: 400 });
  }

  const token = await createAdminSession(env, configuredEmail);
  return adminJson(request, env, { ok: true, admin: { email: configuredEmail } }, { headers: { "Set-Cookie": adminCookie(token) } });
}

export async function adminLogout(request: Request, env: Env) {
  const token = readCookie(request, adminCookieName);
  if (token) {
    await getDb(env).prepare("DELETE FROM admin_sessions WHERE session_hash = ?").bind(await sha256(token)).run();
  }
  return adminJson(request, env, { ok: true }, { headers: { "Set-Cookie": clearAdminCookie() } });
}

export async function adminMe(request: Request, env: Env) {
  const session = await getAdminSession(request, env);
  return adminJson(request, env, { admin: session ? { email: session.email } : null });
}

export async function adminStats(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const db = getDb(env);
  const [members, leads, failedSheets] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) AS count FROM contact_leads").first<{ count: number }>(),
    db.prepare("SELECT COUNT(*) AS count FROM contact_leads WHERE sheet_status = 'failed'").first<{ count: number }>(),
  ]);

  return adminJson(request, env, {
    members: members?.count || 0,
    contactLeads: leads?.count || 0,
    failedSheetSyncs: failedSheets?.count || 0,
  });
}

export async function adminContactLeads(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limit") || 50), 1), 100);
  const rows = await getDb(env)
    .prepare(
      `SELECT id, name, email, message, source_page, preferred_language, sheet_status, sheet_error, created_at
       FROM contact_leads
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return adminJson(request, env, { leads: rows.results || [] });
}

async function adminHandoffClicks(request: Request, env: Env, eventType: "whatsapp_booking_click" | "kalix_booking_click") {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 200);
  const now = new Date();
  const endParam = url.searchParams.get("end");
  const startParam = url.searchParams.get("start");
  const parsedEnd = endParam ? new Date(`${endParam}T23:59:59.999Z`) : now;
  const end = Number.isNaN(parsedEnd.getTime()) ? now : parsedEnd;
  const parsedStart = startParam ? new Date(`${startParam}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  const start = Number.isNaN(parsedStart.getTime()) ? new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000) : parsedStart;
  const rangeStart = start <= end ? start.toISOString() : end.toISOString();
  const rangeEnd = start <= end ? end.toISOString() : start.toISOString();
  const db = getDb(env);
  const [summary, rows] = await Promise.all([
    db.prepare(
      `SELECT COUNT(*) AS total,
              COUNT(DISTINCT visitor_id) AS unique_visitors,
              SUM(CASE WHEN NULLIF(utm_source, '') IS NOT NULL OR NULLIF(utm_campaign, '') IS NOT NULL THEN 1 ELSE 0 END) AS attributed_opens,
              MAX(created_at) AS latest
       FROM analytics_events
       WHERE event_type = ? AND created_at BETWEEN ? AND ?`,
    ).bind(eventType, rangeStart, rangeEnd).first(),
    db.prepare(
      `SELECT id, created_at, event_name, path, referrer, utm_source, utm_medium, utm_campaign, utm_content,
              country, region, city, timezone, device, browser, language, session_id, visitor_id
       FROM analytics_events
       WHERE event_type = ? AND created_at BETWEEN ? AND ?
       ORDER BY created_at DESC
       LIMIT ?`,
    ).bind(eventType, rangeStart, rangeEnd, limit).all(),
  ]);

  return adminJson(request, env, {
    range: { start: rangeStart, end: rangeEnd },
    summary: {
      total: Number(summary?.total || 0),
      uniqueVisitors: Number(summary?.unique_visitors || 0),
      attributedOpens: Number(summary?.attributed_opens || 0),
      latest: summary?.latest || null,
    },
    clicks: rows.results || [],
  });
}

export async function adminWhatsappClicks(request: Request, env: Env) {
  return adminHandoffClicks(request, env, "whatsapp_booking_click");
}

export async function adminKalixClicks(request: Request, env: Env) {
  return adminHandoffClicks(request, env, "kalix_booking_click");
}

export async function adminBookings(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limit") || 50), 1), 100);
  const rows = await getDb(env)
    .prepare(
      `SELECT id, name, email, phone, age, message, source_page, preferred_language, availability, service_interest,
              patient_type, page_language, time_zone, insurance_company, insurance_member_id, date_of_birth, utm_source, utm_medium,
              utm_campaign, lead_status, assigned_to, follow_up_at, notes, last_contacted_at, sheet_status, sheet_error,
              email_status, email_error, email_notified_at, confirmation_email_status, confirmation_email_error,
              confirmation_email_sent_at, created_at
       FROM contact_leads
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return adminJson(request, env, { bookings: rows.results || [] });
}

export async function adminCommunityInquiries(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limit") || 100), 1), 200);
  const rows = await getDb(env).prepare(
    `SELECT id, organization, organization_type, contact_name, email, phone, audience_size, audience_age,
            preferred_language, topic, program_format, delivery, preferred_date, location, budget, notes,
            lead_status, assigned_to, follow_up_at, internal_notes, page_language, time_zone, source_page,
            utm_source, utm_medium, utm_campaign, utm_content, email_status, confirmation_email_status, created_at
     FROM community_inquiries ORDER BY created_at DESC LIMIT ?`,
  ).bind(limit).all();
  return adminJson(request, env, { inquiries: rows.results || [] });
}

export async function adminUpdateCommunityInquiry(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const payload = await readJson<UpdateCommunityInquiryPayload>(request);
  const id = payload?.id?.trim() || "";
  if (!id) return badRequest(request, env, "Inquiry id is required");
  const allowedStatuses = ["new", "contacted", "planning", "proposal_sent", "confirmed", "closed"];
  const status = payload?.leadStatus?.trim() || "new";
  if (!allowedStatuses.includes(status)) return badRequest(request, env, "Invalid inquiry status");
  const result = await getDb(env).prepare(
    `UPDATE community_inquiries SET lead_status = ?, assigned_to = ?, follow_up_at = ?, internal_notes = ?, updated_at = ? WHERE id = ?`,
  ).bind(status, payload?.assignedTo?.trim().slice(0, 120) || "", payload?.followUpAt?.trim().slice(0, 40) || "", payload?.notes?.trim().slice(0, 4000) || "", new Date().toISOString(), id).run();
  if (!result.meta.changes) return adminJson(request, env, { error: "Inquiry not found" }, { status: 404 });
  return adminJson(request, env, { ok: true });
}

export async function adminUpdateBooking(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const payload = await readJson<UpdateBookingPayload>(request);
  const id = payload?.id?.trim() || "";
  if (!id) return badRequest(request, env, "Booking id is required");

  const allowedStatuses = ["new", "contacted", "benefits_check", "scheduled", "converted", "closed"];
  const leadStatus = payload?.leadStatus?.trim() || "new";
  if (!allowedStatuses.includes(leadStatus)) return badRequest(request, env, "Invalid lead status");

  const assignedTo = payload?.assignedTo?.trim().slice(0, 120) || "";
  const followUpAt = payload?.followUpAt?.trim().slice(0, 40) || "";
  const notes = payload?.notes?.trim().slice(0, 4000) || "";
  const now = new Date().toISOString();
  const contactedAt = payload?.markContacted ? now : null;
  const result = await getDb(env).prepare(
    `UPDATE contact_leads
     SET lead_status = ?, assigned_to = ?, follow_up_at = ?, notes = ?,
         last_contacted_at = COALESCE(?, last_contacted_at), updated_at = ?
     WHERE id = ?`,
  ).bind(leadStatus, assignedTo, followUpAt, notes, contactedAt, now, id).run();

  if (!result.meta.changes) return adminJson(request, env, { error: "Booking not found" }, { status: 404 });
  return adminJson(request, env, { ok: true });
}

export async function adminClassSignups(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limit") || 50), 1), 100);
  const db = getDb(env);
  const rows = await db
    .prepare(
      `SELECT id, age_range, gender, gender_other, race_ethnicity,
              primary_language, primary_language_other, state_residence, education_level, has_us_health_insurance,
              diagnosed_conditions, blood_sugar_monitoring, diabetes_medications, agreement_accepted,
              agreement_version, agreement_accepted_at, email_status, email_error, created_at
       FROM class_signups
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<{ id: string; [key: string]: unknown }>();

  const signups = rows.results || [];
  const signupIds = signups.map((signup) => signup.id).filter(Boolean);
  const filesBySignup = new Map<string, ClassSignupFileRow[]>();
  if (signupIds.length) {
    const files = await db
      .prepare(
        `SELECT id, signup_id, kind, object_key, original_name, content_type, size_bytes, created_at
         FROM class_signup_files
         WHERE signup_id IN (${signupIds.map(() => "?").join(", ")})
         ORDER BY created_at ASC`,
      )
      .bind(...signupIds)
      .all<ClassSignupFileRow>();
    for (const file of files.results || []) {
      const current = filesBySignup.get(file.signup_id) || [];
      current.push(file);
      filesBySignup.set(file.signup_id, current);
    }
  }

  return adminJson(request, env, {
    signups: signups.map((signup) => ({ ...signup, files: filesBySignup.get(signup.id) || [] })),
  });
}

function safeDownloadFilename(value: string) {
  return value.replace(/[\\/:*?"<>|\r\n]+/g, "_").slice(0, 180) || "insurance-card";
}

export async function adminDownloadClassSignupFile(request: Request, env: Env, signupId: string, fileId: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  if (!env.INSURANCE_CARDS) return adminJson(request, env, { error: "Insurance card storage is not configured" }, { status: 503 });

  const file = await getDb(env)
    .prepare(
      `SELECT id, signup_id, kind, object_key, original_name, content_type, size_bytes, created_at
       FROM class_signup_files
       WHERE id = ? AND signup_id = ?
       LIMIT 1`,
    )
    .bind(fileId, signupId)
    .first<ClassSignupFileRow>();
  if (!file) return adminJson(request, env, { error: "Insurance card file not found" }, { status: 404 });

  const object = await env.INSURANCE_CARDS.get(file.object_key);
  if (!object || !object.body) return adminJson(request, env, { error: "Insurance card object not found" }, { status: 404 });

  return new Response(object.body, {
    headers: {
      ...responseHeaders(request, env),
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${safeDownloadFilename(file.original_name)}"`,
      "Content-Length": String(object.size),
      "Content-Type": object.httpMetadata?.contentType || file.content_type || "application/octet-stream",
    },
  });
}

export async function adminDeleteBooking(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const payload = await readJson<DeleteBookingPayload>(request);
  const id = payload?.id?.trim() || "";
  if (!id) return badRequest(request, env, "Booking id is required");

  const row = await getDb(env)
    .prepare(
      `SELECT id FROM contact_leads
       WHERE id = ? AND (source_page LIKE '%/booking%' OR message LIKE 'Booking request:%')
       LIMIT 1`,
    )
    .bind(id)
    .first<{ id: string }>();
  if (!row) return adminJson(request, env, { error: "Booking not found" }, { status: 404 });

  await getDb(env).prepare("DELETE FROM contact_leads WHERE id = ?").bind(id).run();
  return adminJson(request, env, { ok: true, id });
}

export async function adminDeleteClassSignup(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const payload = await readJson<DeleteBookingPayload>(request);
  const id = payload?.id?.trim() || "";
  if (!id) return badRequest(request, env, "Class signup id is required");

  const db = getDb(env);
  const row = await db.prepare("SELECT id FROM class_signups WHERE id = ? LIMIT 1").bind(id).first<{ id: string }>();
  if (!row) return adminJson(request, env, { error: "Class signup not found" }, { status: 404 });

  const files = await db
    .prepare("SELECT id, signup_id, kind, object_key, original_name, content_type, size_bytes, created_at FROM class_signup_files WHERE signup_id = ?")
    .bind(id)
    .all<ClassSignupFileRow>();
  if ((files.results || []).length && !env.INSURANCE_CARDS) {
    return adminJson(request, env, { error: "Insurance card storage is not configured" }, { status: 503 });
  }
  try {
    const insuranceCards = env.INSURANCE_CARDS;
    if (insuranceCards) {
      await Promise.all((files.results || []).map((file) => insuranceCards.delete(file.object_key)));
    }
    await db.batch([
      db.prepare("DELETE FROM class_signup_files WHERE signup_id = ?").bind(id),
      db.prepare("DELETE FROM class_signups WHERE id = ?").bind(id),
    ]);
  } catch (error) {
    return adminJson(request, env, { error: "Unable to delete class signup files" }, { status: 500 });
  }
  return adminJson(request, env, { ok: true, id });
}

export async function adminSmtpStatus(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  return adminJson(request, env, smtpConfigStatus(env));
}

export async function adminSmtpTest(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const status = smtpConfigStatus(env);
  if (!status.configured) {
    return adminJson(request, env, { ok: false, skipped: true, missing: status.missing }, { status: 503 });
  }

  try {
    const result = await sendSmtpEmail(env, {
      subject: "NutriAll booking email test",
      text: [
        "This is a test email from NutriAll Admin.",
        "",
        `Sent at: ${new Date().toISOString()}`,
        "If this email arrived, booking notification SMTP is working.",
      ].join("\n"),
    });
    return adminJson(request, env, { ok: !result.skipped, ...result });
  } catch (error) {
    return adminJson(
      request,
      env,
      { ok: false, error: error instanceof Error ? error.message : "SMTP test failed" },
      { status: 500 },
    );
  }
}

export async function adminMembers(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const limit = Math.min(Math.max(Number(new URL(request.url).searchParams.get("limit") || 50), 1), 100);
  const rows = await getDb(env)
    .prepare(
      `SELECT id, email, phone, first_name, last_name, preferred_language, marketing_opt_in, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all();

  return adminJson(request, env, { members: rows.results || [] });
}

export function adminPage(request: Request, env: Env) {
  return htmlResponse(
    request,
    env,
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>NutriAll Admin</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f3f4f6; color: #111827; }
    button, input, select { font: inherit; }
    .shell { min-height: 100vh; }
    .side { position: fixed; inset: 0 auto 0 0; width: 248px; height: 100vh; overflow-y: auto; background: #111827; color: white; padding: 22px 18px; display: flex; flex-direction: column; gap: 22px; }
    .brand { font-size: 18px; font-weight: 800; letter-spacing: 0; padding: 2px 10px; }
    .nav { display: grid; gap: 8px; }
    .nav button, .logout { border: 0; border-radius: 8px; padding: 10px 12px; color: inherit; background: transparent; text-align: left; cursor: pointer; font-weight: 700; }
    .nav button.active, .nav button:hover, .logout:hover { background: rgba(255,255,255,.12); }
    .logout { margin-top: auto; }
    .main { margin-left: 248px; padding: 24px 28px 32px; min-width: 0; }
    .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
    h1 { margin: 0; font-size: 26px; line-height: 1.2; }
    .muted { color: #667085; }
    .caption { font-size: 12px; color: #667085; margin-top: 4px; }
    .controls { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: end; gap: 10px; }
    .controls label { margin: 0; font-size: 12px; color: #475467; font-weight: 700; }
    .controls input { min-width: 145px; background: white; }
    .quick { border: 1px solid #d0d5dd; border-radius: 8px; padding: 10px 12px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    .quick:hover { background: #f9fafb; }
    .primary { border: 0; border-radius: 8px; padding: 11px 14px; background: #2563eb; color: white; font-weight: 800; cursor: pointer; }
    .primary:disabled { opacity: .65; cursor: not-allowed; }
    .insights { display: grid; gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 16px; }
    .insight { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; min-height: 82px; box-shadow: 0 12px 28px -26px rgba(17,24,39,.45); }
    .insight strong { display: block; font-size: 12px; color: #475467; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 7px; }
    .metric-grid { display: grid; gap: 14px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 16px; }
    .metric-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 12px 28px -26px rgba(17,24,39,.45); min-height: 150px; display: grid; gap: 8px; }
    .metric-head { display: flex; align-items: start; justify-content: space-between; gap: 10px; color: #475467; font-weight: 800; font-size: 13px; }
    .metric-value { font-size: 30px; line-height: 1; font-weight: 850; letter-spacing: 0; }
    .change { display: inline-flex; align-items: center; border-radius: 999px; padding: 3px 7px; font-size: 12px; font-weight: 850; background: #f2f4f7; color: #475467; white-space: nowrap; }
    .change.up { color: #067647; background: #ecfdf3; }
    .change.down { color: #b42318; background: #fef3f2; }
    .spark { width: 100%; height: 36px; }
    .chart-grid { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: start; }
    .panel { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; box-shadow: 0 12px 28px -26px rgba(17,24,39,.45); min-width: 0; }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin: 0; font-size: 16px; }
    .panel-sub { margin-top: 4px; font-size: 13px; color: #667085; }
    .chart-wrap { position: relative; margin-top: 14px; }
    .chart { display: block; width: 100%; height: 340px; }
    .chart-point { filter: drop-shadow(0 1px 2px rgba(17,24,39,.18)); }
    .axis-label { fill: #667085; font-size: 11px; font-weight: 700; }
    .axis-value { fill: #667085; font-size: 11px; }
    .hover-line { opacity: 0; pointer-events: none; }
    .hover-points circle { opacity: 0; pointer-events: none; }
    .chart-tooltip { position: absolute; min-width: 180px; padding: 10px 12px; border: 1px solid #d0d5dd; border-radius: 8px; background: white; box-shadow: 0 12px 28px -18px rgba(17,24,39,.45); font-size: 12px; color: #344054; pointer-events: none; opacity: 0; transform: translate(-50%, -100%); z-index: 5; }
    .chart-tooltip strong { display: block; color: #111827; margin-bottom: 7px; }
    .chart-tooltip div { display: flex; justify-content: space-between; gap: 18px; margin-top: 4px; }
    .chart-hit { fill: transparent; cursor: crosshair; }
    .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; color: #475467; font-size: 12px; font-weight: 700; }
    .dot { display: inline-block; width: 9px; height: 9px; border-radius: 999px; margin-right: 5px; }
    .bar-list { display: grid; gap: 12px; margin-top: 14px; }
    .bar-row { display: grid; gap: 6px; }
    .bar-meta { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; }
    .bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #111827; }
    .bar-value { color: #475467; font-weight: 800; white-space: nowrap; }
    .bar-track { height: 9px; background: #eef2f7; border-radius: 999px; overflow: hidden; }
    .bar-fill { height: 100%; background: #2563eb; border-radius: inherit; }
    .funnel { display: grid; gap: 12px; margin-top: 14px; }
    .funnel-step { display: grid; grid-template-columns: 120px 1fr 72px; gap: 12px; align-items: center; font-size: 13px; }
    .funnel-track { height: 28px; background: #eef2f7; border-radius: 8px; overflow: hidden; }
    .funnel-fill { height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: white; font-size: 12px; font-weight: 850; background: #0f766e; min-width: 2px; }
    .status-panel { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .status-panel strong { display: block; margin-bottom: 4px; }
    .status-panel .primary { white-space: nowrap; }
    .tablewrap { overflow: auto; background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; min-width: 1280px; }
    th, td { padding: 12px 14px; border-bottom: 1px solid #eef0f4; text-align: left; font-size: 14px; vertical-align: top; }
    th { background: #f9fafb; color: #475467; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    td.message { max-width: 360px; white-space: pre-wrap; }
    .badge { display: inline-flex; border-radius: 999px; padding: 3px 8px; font-size: 12px; font-weight: 700; background: #eef2ff; color: #4338ca; }
    .badge.failed { background: #fff1f2; color: #be123c; }
    .file-links { display: grid; gap: 6px; min-width: 92px; }
    .file-link { color: #4338ca; font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; }
    .mobile-brand, .mobile-nav, .mobile-list, .mobile-filter-bar, .mobile-analytics-tabs, .mobile-sheet, .mobile-toast { display: none; }
    .login { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    .login .card { width: min(420px, 100%); background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; }
    label { display: grid; gap: 6px; margin-top: 14px; font-weight: 700; font-size: 14px; }
    input { width: 100%; border: 1px solid #d0d5dd; border-radius: 8px; padding: 11px 12px; }
    .login .primary { width: 100%; margin-top: 18px; }
    .error { margin-top: 12px; color: #b42318; font-weight: 700; font-size: 14px; }
    .empty { color: #667085; padding: 16px 0; }
    .hidden { display: none; }
    @media (max-width: 1180px) { .metric-grid, .insights { grid-template-columns: repeat(2, minmax(0, 1fr)); } .chart-grid { grid-template-columns: 1fr; } }
    @media (max-width: 840px) {
      :root { --mobile-green: #17352e; --mobile-muted: #64716d; --mobile-line: #dce5e0; --mobile-coral: #ef604f; }
      body { background: #f5f7f5; -webkit-tap-highlight-color: transparent; }
      button, a, input, select, textarea { touch-action: manipulation; }
      .side { display: none; }
      .main { margin-left: 0; padding: 0 14px calc(88px + env(safe-area-inset-bottom)); }
      .top { position: sticky; top: 0; z-index: 20; margin: 0 -14px 14px; padding: calc(10px + env(safe-area-inset-top)) 16px 12px; display: flex; align-items: end; background: rgba(255,255,255,.96); border-bottom: 1px solid var(--mobile-line); backdrop-filter: blur(14px); }
      .top > div:first-child { min-width: 0; }
      .mobile-brand { display: block; margin-bottom: 2px; color: #43816f; font-size: 11px; line-height: 1.2; font-weight: 850; text-transform: uppercase; }
      h1 { color: var(--mobile-green); font-size: 23px; }
      #admin-email { display: none; }
      #range-caption { max-width: 250px; overflow: hidden; color: var(--mobile-muted); font-size: 11px; white-space: nowrap; text-overflow: ellipsis; }
      .controls { margin-left: auto; flex-wrap: nowrap; justify-content: flex-end; align-items: center; gap: 7px; }
      body:not(.analytics-view) .controls label, body:not(.analytics-view) .controls .quick { display: none; }
      body:not(.analytics-view) #refresh { width: 44px; min-width: 44px; height: 44px; padding: 0; overflow: hidden; color: white; font-size: 24px; line-height: 1; }
      body.analytics-view .top { display: grid; grid-template-columns: 1fr auto; }
      body.analytics-view .controls { grid-column: 1 / -1; width: 100%; margin: 10px 0 0; padding-bottom: 2px; overflow-x: auto; justify-content: flex-start; }
      body.analytics-view .controls label { min-width: 132px; margin: 0; }
      body.analytics-view .controls label input { padding: 9px; }
      body.analytics-view .quick, body.analytics-view #refresh { flex: 0 0 auto; min-height: 42px; padding: 9px 11px; }
      .insights { grid-template-columns: 1fr; gap: 8px; }
      .insight { min-height: 0; padding: 13px; box-shadow: none; }
      .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .metric-card { min-height: 126px; padding: 13px; box-shadow: none; }
      .metric-value { font-size: 27px; }
      .metric-head { display: grid; }
      .chart-grid { grid-template-columns: 1fr; gap: 12px; }
      .panel { padding: 14px; box-shadow: none; }
      .chart { height: 220px; }
      .chart-hit { touch-action: pan-y; }
      .funnel-step { grid-template-columns: 88px 1fr 48px; gap: 8px; }
      .status-panel { display: grid; }
      .status-panel .primary { width: 100%; min-height: 44px; }
      .tablewrap { display: none; }
      .mobile-nav { position: fixed; z-index: 40; inset: auto 0 0; padding: 7px 8px calc(7px + env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 2px; background: rgba(255,255,255,.97); border-top: 1px solid var(--mobile-line); backdrop-filter: blur(16px); }
      .mobile-nav button { min-width: 0; min-height: 50px; padding: 6px 3px; border: 0; border-radius: 6px; background: transparent; color: #66736f; font-size: 11px; font-weight: 800; cursor: pointer; }
      .mobile-nav button::before { content: ""; width: 18px; height: 3px; display: block; margin: 0 auto 6px; border-radius: 999px; background: transparent; }
      .mobile-nav button.active { color: var(--mobile-green); background: #edf3ef; }
      .mobile-nav button.active::before { background: var(--mobile-coral); }
      .mobile-filter-bar { margin-bottom: 12px; display: flex; gap: 7px; overflow-x: auto; scrollbar-width: none; }
      .mobile-filter-bar::-webkit-scrollbar, .mobile-analytics-tabs::-webkit-scrollbar { display: none; }
      .mobile-filter-bar button, .mobile-analytics-tabs button { flex: 0 0 auto; min-height: 40px; padding: 8px 12px; border: 1px solid var(--mobile-line); border-radius: 6px; background: white; color: #53615d; font-size: 13px; font-weight: 800; }
      .mobile-filter-bar button.active, .mobile-analytics-tabs button.active { border-color: var(--mobile-green); background: var(--mobile-green); color: white; }
      .mobile-search { width: 100%; min-height: 46px; margin-bottom: 12px; padding: 11px 13px; border: 1px solid var(--mobile-line); background: white; }
      .mobile-list { display: grid; gap: 10px; }
      .mobile-card { padding: 14px; border: 1px solid var(--mobile-line); border-radius: 8px; background: white; }
      .mobile-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
      .mobile-card h2 { margin: 0; color: var(--mobile-green); font-size: 18px; line-height: 1.3; }
      .mobile-card-meta { margin-top: 3px; color: var(--mobile-muted); font-size: 12px; line-height: 1.45; }
      .mobile-card-summary { margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
      .mobile-card-summary div { min-width: 0; }
      .mobile-card-summary span, .mobile-detail-grid dt { display: block; color: var(--mobile-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; }
      .mobile-card-summary strong { display: block; margin-top: 2px; overflow: hidden; color: #263b35; font-size: 14px; font-weight: 750; white-space: nowrap; text-overflow: ellipsis; }
      .mobile-card-actions { margin-top: 13px; padding-top: 12px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; border-top: 1px solid #edf1ef; }
      .mobile-card-actions a, .mobile-card-actions button { min-height: 42px; display: grid; place-items: center; padding: 8px; border: 1px solid #b9c9c1; border-radius: 6px; background: white; color: var(--mobile-green); font-size: 13px; font-weight: 850; text-decoration: none; }
      .mobile-card-actions .mobile-detail-button { border-color: var(--mobile-green); background: var(--mobile-green); color: white; }
      .mobile-status { max-width: 132px; min-height: 38px; padding: 7px 9px; border: 1px solid #b9c9c1; border-radius: 6px; background: #edf3ef; color: var(--mobile-green); font-size: 12px; font-weight: 850; }
      .mobile-empty { padding: 42px 20px; border: 1px dashed #c9d5cf; border-radius: 8px; background: white; color: var(--mobile-muted); text-align: center; }
      .mobile-action-grid { margin-bottom: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
      .mobile-action-stat { min-height: 104px; padding: 14px; border: 1px solid var(--mobile-line); border-radius: 8px; background: white; text-align: left; }
      button.mobile-action-stat { cursor: pointer; }
      .mobile-action-stat span { display: block; color: var(--mobile-muted); font-size: 12px; font-weight: 800; }
      .mobile-action-stat strong { display: block; margin-top: 12px; color: var(--mobile-green); font-size: 29px; }
      .mobile-section-heading { margin: 22px 2px 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .mobile-section-heading h2 { margin: 0; color: var(--mobile-green); font-size: 17px; }
      .mobile-section-heading button { border: 0; background: transparent; color: #357565; font-size: 13px; font-weight: 850; }
      .mobile-analytics-tabs { margin-bottom: 12px; display: flex; gap: 7px; overflow-x: auto; scrollbar-width: none; }
      .mobile-data-list { display: grid; gap: 8px; }
      .mobile-data-row { padding: 12px; border: 1px solid var(--mobile-line); border-radius: 7px; background: white; }
      .mobile-data-row strong { color: var(--mobile-green); }
      .mobile-data-row dl { margin: 10px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .mobile-data-row dt { color: var(--mobile-muted); font-size: 10px; font-weight: 800; text-transform: uppercase; }
      .mobile-data-row dd { margin: 2px 0 0; overflow-wrap: anywhere; font-size: 13px; }
      .mobile-sheet { position: fixed; z-index: 70; inset: 0; display: grid; align-items: end; }
      .mobile-sheet.hidden { display: none; }
      .mobile-sheet-backdrop { position: absolute; inset: 0; border: 0; background: rgba(8,25,20,.46); }
      .mobile-sheet-panel { position: relative; max-height: 88vh; padding: 0 16px calc(18px + env(safe-area-inset-bottom)); overflow-y: auto; border-radius: 8px 8px 0 0; background: white; }
      .mobile-sheet-handle { width: 42px; height: 4px; margin: 9px auto 11px; border-radius: 999px; background: #cbd5d0; }
      .mobile-sheet-header { position: sticky; top: 0; z-index: 1; padding: 8px 0 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: white; border-bottom: 1px solid var(--mobile-line); }
      .mobile-sheet-header h2 { margin: 0; color: var(--mobile-green); font-size: 20px; }
      .mobile-sheet-close { width: 44px; height: 44px; border: 0; border-radius: 50%; background: #edf3ef; color: var(--mobile-green); font-size: 22px; }
      .mobile-sheet-body { padding-top: 14px; }
      .mobile-detail-grid { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .mobile-detail-grid > div.wide { grid-column: 1 / -1; }
      .mobile-detail-grid dd { margin: 4px 0 0; color: #263b35; font-size: 15px; line-height: 1.5; overflow-wrap: anywhere; }
      .mobile-sheet-form { display: grid; gap: 12px; }
      .mobile-sheet-form label { margin: 0; color: #344b44; }
      .mobile-sheet-form select, .mobile-sheet-form textarea { width: 100%; min-height: 46px; padding: 11px 12px; border: 1px solid #c5d1cb; border-radius: 6px; background: white; font: inherit; }
      .mobile-sheet-form textarea { min-height: 116px; resize: vertical; }
      .mobile-sheet-form .primary { min-height: 48px; margin-top: 5px; background: var(--mobile-green); }
      .mobile-file-actions { margin-top: 16px; display: grid; gap: 8px; }
      .mobile-file-actions a { min-height: 44px; display: grid; place-items: center; border: 1px solid #b9c9c1; border-radius: 6px; color: var(--mobile-green); font-weight: 850; text-decoration: none; }
      .mobile-toast { position: fixed; z-index: 90; left: 16px; right: 16px; bottom: calc(76px + env(safe-area-inset-bottom)); min-height: 48px; padding: 12px 15px; display: block; border-radius: 7px; background: var(--mobile-green); color: white; font-size: 14px; font-weight: 800; }
      .mobile-toast.hidden { display: none; }
      #app.hidden + .mobile-nav { display: none; }
      .mobile-menu { display: grid; gap: 8px; }
      .mobile-menu button { min-height: 52px; padding: 12px 14px; border: 1px solid var(--mobile-line); border-radius: 7px; background: white; color: var(--mobile-green); text-align: left; font-size: 16px; font-weight: 800; }
      .mobile-menu button.danger { color: #b42318; }
      .mobile-detail-note { margin: 14px 0 0; padding: 12px; border-radius: 7px; background: #f4f7f5; color: #344b44; font-size: 14px; line-height: 1.55; white-space: pre-wrap; }
      .mobile-inline-actions { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .mobile-inline-actions button, .mobile-inline-actions a { min-height: 46px; display: grid; place-items: center; padding: 10px; border: 1px solid #b9c9c1; border-radius: 6px; background: white; color: var(--mobile-green); font-weight: 850; text-decoration: none; }
      .mobile-inline-actions .primary { border-color: var(--mobile-green); background: var(--mobile-green); color: white; }
    }
  </style>
</head>
<body>
  <div id="login" class="login hidden">
    <form class="card" id="login-form">
      <h1>Admin Login</h1>
      <p class="muted">NutriAll care operations dashboard</p>
      <label>Email<input id="email" type="email" autocomplete="username" required></label>
      <label>Password<input id="password" type="password" autocomplete="current-password" required></label>
      <button class="primary" id="login-button" type="submit">Sign in</button>
      <div class="error" id="login-error"></div>
    </form>
  </div>

  <div id="app" class="shell hidden">
    <aside class="side">
      <div class="brand">NutriAll Admin</div>
      <nav class="nav">
        <button type="button" data-view="dashboard" class="active">Dashboard</button>
        <button type="button" data-view="traffic">Traffic</button>
        <button type="button" data-view="sources">Sources</button>
        <button type="button" data-view="ads">Ads</button>
        <button type="button" data-view="locations">Locations</button>
        <button type="button" data-view="conversions">Conversions</button>
        <button type="button" data-view="bookings">Bookings</button>
        <button type="button" data-view="whatsapp">WhatsApp Opens</button>
        <button type="button" data-view="kalix">Kalix Opens</button>
        <button type="button" data-view="communityInquiries">Community Inquiries</button>
        <button type="button" data-view="classSignups">Class Signups</button>
        <button type="button" data-view="leads">Contact Leads</button>
        <button type="button" data-view="members">Members</button>
      </nav>
      <button type="button" class="logout" id="logout">Sign out</button>
    </aside>
    <main class="main">
      <div class="top">
        <div>
          <div class="mobile-brand">NutriAll Admin</div>
          <h1 id="title">Dashboard</h1>
          <div class="muted" id="admin-email"></div>
          <div class="caption" id="range-caption"></div>
        </div>
        <div class="controls">
          <label>Start<input id="start-date" type="date"></label>
          <label>End<input id="end-date" type="date"></label>
          <button type="button" class="quick" id="today">Today</button>
          <button type="button" class="quick" id="last-7">7 days</button>
          <button type="button" class="quick" id="last-30">30 days</button>
          <button type="button" class="primary" id="refresh">Refresh</button>
        </div>
      </div>
      <section id="content"></section>
    </main>
  </div>

  <nav class="mobile-nav" aria-label="Mobile admin navigation">
    <button type="button" data-mobile-view="overview">Overview</button>
    <button type="button" data-mobile-view="bookings">Bookings</button>
    <button type="button" data-mobile-view="classSignups">Classes</button>
    <button type="button" data-mobile-view="dashboard">Data</button>
    <button type="button" id="mobile-more">More</button>
  </nav>

  <div class="mobile-sheet hidden" id="mobile-sheet" role="dialog" aria-modal="true" aria-labelledby="mobile-sheet-title">
    <button type="button" class="mobile-sheet-backdrop" id="mobile-sheet-backdrop" aria-label="Close panel"></button>
    <section class="mobile-sheet-panel">
      <div class="mobile-sheet-handle" aria-hidden="true"></div>
      <header class="mobile-sheet-header"><h2 id="mobile-sheet-title">Details</h2><button type="button" class="mobile-sheet-close" id="mobile-sheet-close" aria-label="Close">×</button></header>
      <div class="mobile-sheet-body" id="mobile-sheet-body"></div>
    </section>
  </div>
  <div class="mobile-toast hidden" id="mobile-toast" role="status"></div>

  <script>
    const state = { view: "dashboard", admin: null, analytics: null };
    const $ = (id) => document.getElementById(id);
    const text = (value) => value == null || value === "" ? "-" : String(value);
    const num = (value) => Number(value || 0).toLocaleString();
    const date = (value) => value ? new Date(value).toLocaleString() : "-";
    async function api(path, options = {}) {
      const res = await fetch(path, { credentials: "include", headers: options.body ? { "Content-Type": "application/json" } : undefined, ...options });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    }
    function isMobileAdmin() { return window.matchMedia("(max-width: 840px)").matches; }
    function showLogin() { $("login").classList.remove("hidden"); $("app").classList.add("hidden"); closeMobileSheet(); }
    function showApp() {
      $("login").classList.add("hidden");
      $("app").classList.remove("hidden");
      $("admin-email").textContent = state.admin?.email || "";
      if (isMobileAdmin() && state.view === "dashboard") state.view = "overview";
      syncChrome();
    }
    function isoDate(date) { return date.toISOString().slice(0, 10); }
    function escapeHtml(value) {
      return text(value).replace(/[&<>"']/g, function (char) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
      });
    }
    const analyticsViews = ["dashboard", "traffic", "sources", "ads", "locations", "conversions"];
    const statusLabels = { new: "New", contacted: "Contacted", benefits_check: "Insurance check", scheduled: "Scheduled", converted: "Converted", closed: "Closed" };
    function statusLabel(value) { return statusLabels[value] || text(value); }
    function phoneHref(value) { return "tel:" + String(value || "").replace(/[^+\d]/g, ""); }
    function mobileDateValue(value) {
      if (!value) return "";
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 16);
      const local = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    }
    function mobileDetailGrid(fields) {
      return '<dl class="mobile-detail-grid">' + fields.map(function (field) {
        return '<div' + (field.wide ? ' class="wide"' : '') + '><dt>' + escapeHtml(field.label) + '</dt><dd>' + escapeHtml(field.value) + '</dd></div>';
      }).join("") + '</dl>';
    }
    function openMobileSheet(title, body) {
      $("mobile-sheet-title").textContent = title;
      $("mobile-sheet-body").innerHTML = body;
      $("mobile-sheet").classList.remove("hidden");
      document.body.style.overflow = "hidden";
    }
    function closeMobileSheet() {
      if (!$("mobile-sheet")) return;
      $("mobile-sheet").classList.add("hidden");
      document.body.style.overflow = "";
    }
    let toastTimer;
    function showToast(message) {
      clearTimeout(toastTimer);
      $("mobile-toast").textContent = message;
      $("mobile-toast").classList.remove("hidden");
      toastTimer = setTimeout(function () { $("mobile-toast").classList.add("hidden"); }, 2600);
    }
    async function openMobileEmailSystem() {
      openMobileSheet("Email system", '<div class="mobile-empty">Checking email notification status...</div>');
      try {
        const status = await api("/admin/api/smtp-status");
        const configured = status && status.configured;
        const missing = status && status.missing && status.missing.length ? status.missing.join(", ") : "";
        $("mobile-sheet-body").innerHTML = mobileDetailGrid([
          { label: "Status", value: configured ? "Ready" : "Needs setup" },
          { label: "Server", value: status.host || "-" },
          { label: "Recipient", value: status.to || "-", wide: true },
          { label: "Missing settings", value: missing || "None", wide: true }
        ]) + '<div class="mobile-inline-actions"><button type="button" class="primary" id="mobile-smtp-test"' + (configured ? '' : ' disabled') + ' style="grid-column:1/-1">Send test email</button></div>';
        if (configured) $("mobile-smtp-test").addEventListener("click", async function () {
          const button = $("mobile-smtp-test");
          button.disabled = true;
          try { await api("/admin/api/smtp-test", { method: "POST" }); showToast("Test email sent"); }
          catch (error) { showToast(error.message); }
          finally { button.disabled = false; }
        });
      } catch (error) {
        $("mobile-sheet-body").innerHTML = '<div class="mobile-empty">' + escapeHtml(error.message) + '</div>';
      }
    }
    function mobileAnalyticsTabs() {
      const labels = { dashboard: "Overview", traffic: "Traffic", sources: "Sources", ads: "Ads", locations: "Locations", conversions: "Conversions" };
      return '<nav class="mobile-analytics-tabs" aria-label="Analytics sections">' + analyticsViews.map(function (view) {
        return '<button type="button" data-analytics-view="' + view + '" class="' + (state.view === view ? 'active' : '') + '">' + labels[view] + '</button>';
      }).join("") + '</nav>';
    }
    function bindAnalyticsTabs() {
      document.querySelectorAll("[data-analytics-view]").forEach(function (button) {
        button.addEventListener("click", function () { setView(button.dataset.analyticsView); });
      });
    }
    function syncChrome() {
      document.body.classList.toggle("analytics-view", analyticsViews.includes(state.view));
      $("refresh").textContent = isMobileAdmin() && !analyticsViews.includes(state.view) ? "↻" : "Refresh";
      document.querySelectorAll("[data-view]").forEach(function (item) { item.classList.toggle("active", item.dataset.view === state.view); });
      const mobilePrimary = state.view === "overview" ? "overview" : state.view === "bookings" ? "bookings" : state.view === "classSignups" ? "classSignups" : analyticsViews.includes(state.view) ? "dashboard" : "more";
      document.querySelectorAll("[data-mobile-view]").forEach(function (item) { item.classList.toggle("active", item.dataset.mobileView === mobilePrimary); });
      $("mobile-more").classList.toggle("active", mobilePrimary === "more");
    }
    async function setView(view) {
      state.view = view;
      closeMobileSheet();
      syncChrome();
      window.scrollTo({ top: 0, behavior: "smooth" });
      await load();
    }
    function parseBookingMessage(message) {
      const fields = {};
      String(message || "").split("\\n").forEach(function (line) {
        const index = line.indexOf(":");
        if (index < 0) return;
        const key = line.slice(0, index).trim().toLowerCase();
        const value = line.slice(index + 1).trim();
        if (key) fields[key] = value;
      });
      return {
        phone: fields.phone || "",
        age: fields.age || "",
        preferredLanguage: fields["preferred language"] || "",
        availability: fields["available time"] || "",
        timeZone: fields["time zone"] || "",
        insuranceCompany: fields["insurance company"] || "",
        insuranceMemberId: fields["insurance member id"] || "",
        dateOfBirth: fields["date of birth"] || "",
        pageLanguage: fields["page language"] || "",
      };
    }
    function formatRangeLabel(data) {
      if (!data || !data.range) return "";
      const start = data.range.start.slice(0, 10);
      const end = data.range.end.slice(0, 10);
      const prevStart = data.range.previousStart.slice(0, 10);
      const prevEnd = data.range.previousEnd.slice(0, 10);
      return start + " to " + end + " compared with " + prevStart + " to " + prevEnd;
    }
    function setRange(days) {
      const end = new Date();
      const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
      $("start-date").value = isoDate(start);
      $("end-date").value = isoDate(end);
    }
    function rangeQuery() {
      const params = new URLSearchParams();
      if ($("start-date").value) params.set("start", $("start-date").value);
      if ($("end-date").value) params.set("end", $("end-date").value);
      return params.toString() ? "?" + params.toString() : "";
    }
    function whatsappQuery(limit) {
      const params = new URLSearchParams();
      if ($("start-date").value) params.set("start", $("start-date").value);
      if ($("end-date").value) params.set("end", $("end-date").value);
      params.set("limit", String(limit || 100));
      return "?" + params.toString();
    }
    async function getAnalytics() {
      state.analytics = await api("/admin/api/analytics/dashboard" + rangeQuery());
      $("range-caption").textContent = formatRangeLabel(state.analytics);
      return state.analytics;
    }
    async function getAdsAnalytics() {
      const data = await api("/admin/api/analytics/ads" + rangeQuery());
      $("range-caption").textContent = formatRangeLabel(data);
      return data;
    }
    function metricValue(metric, suffix) {
      return suffix ? Number(metric.value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 }) + suffix : num(metric.value);
    }
    function changePill(metric) {
      const change = Number(metric.change || 0);
      const cls = change > 0 ? " up" : change < 0 ? " down" : "";
      const sign = change > 0 ? "+" : "";
      return '<span class="change' + cls + '">' + sign + change + '%</span>';
    }
    function sparkline(points) {
      const values = (points || []).map(function (point) { return Number(point.value || 0); });
      if (!values.length) return '<svg class="spark" viewBox="0 0 120 36" aria-hidden="true"></svg>';
      const max = Math.max.apply(null, values.concat([1]));
      const min = Math.min.apply(null, values);
      const span = Math.max(max - min, 1);
      const path = values.map(function (value, index) {
        const x = values.length === 1 ? 60 : (index / (values.length - 1)) * 116 + 2;
        const y = 32 - ((value - min) / span) * 26;
        return (index ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
      }).join(" ");
      return '<svg class="spark" viewBox="0 0 120 36" aria-hidden="true"><path d="' + path + '" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    function metricCard(title, metric, spark, suffix) {
      return '<article class="metric-card"><div class="metric-head"><span>' + escapeHtml(title) + '</span>' + changePill(metric) + '</div><div class="metric-value">' + metricValue(metric, suffix) + '</div><div class="caption">Previous: ' + metricValue({ value: metric.previous }, suffix) + '</div>' + sparkline(spark) + '</article>';
    }
    function panel(title, subtitle, body, wide) {
      return '<article class="panel' + (wide ? ' wide' : '') + '"><h2>' + escapeHtml(title) + '</h2><div class="panel-sub">' + escapeHtml(subtitle || "") + '</div>' + body + '</article>';
    }
    function barList(items, valueKey) {
      const rows = items || [];
      if (!rows.length) return '<div class="empty">No data yet.</div>';
      const max = Math.max.apply(null, rows.map(function (row) { return Number(row[valueKey] || row.count || 0); }).concat([1]));
      return '<div class="bar-list">' + rows.map(function (row) {
        const value = Number(row[valueKey] || row.count || 0);
        const width = Math.max(2, Math.round((value / max) * 100));
        return '<div class="bar-row"><div class="bar-meta"><span class="bar-label">' + escapeHtml(row.label) + '</span><span class="bar-value">' + num(value) + '</span></div><div class="bar-track"><div class="bar-fill" style="width:' + width + '%"></div></div></div>';
      }).join("") + '</div>';
    }
    function lineChart(rows) {
      const data = rows || [];
      const series = [
        { key: "pageViews", label: "Page views", color: "#2563eb" },
        { key: "visitors", label: "Visitors", color: "#0f766e" },
        { key: "sessions", label: "Sessions", color: "#9333ea" }
      ];
      if (!data.length) return '<div class="empty">No traffic data yet.</div>';
      const hasValues = data.some(function (row) { return series.some(function (item) { return Number(row[item.key] || 0) > 0; }); });
      if (!hasValues) return '<div class="empty">No traffic activity in this date range.</div>';
      const width = 1180;
      const height = 340;
      const left = 54;
      const right = 22;
      const top = 22;
      const bottom = 44;
      const plotWidth = width - left - right;
      const plotHeight = height - top - bottom;
      const rawMax = Math.max.apply(null, data.flatMap(function (row) { return series.map(function (item) { return Number(row[item.key] || 0); }); }).concat([1]));
      const max = Math.max(1, Math.ceil(rawMax));
      const yTicks = [0, 0.25, 0.5, 0.75, 1].map(function (ratio) { return Math.round(max * ratio); });
      const xAt = function (index) { return data.length === 1 ? left + plotWidth / 2 : left + (index / (data.length - 1)) * plotWidth; };
      const yAt = function (value) { return top + plotHeight - (Number(value || 0) / max) * plotHeight; };
      const grid = yTicks.map(function (tick) {
        const y = yAt(tick);
        return '<line x1="' + left + '" y1="' + y.toFixed(1) + '" x2="' + (width - right) + '" y2="' + y.toFixed(1) + '" stroke="#eef2f7"/><text class="axis-value" x="' + (left - 10) + '" y="' + (y + 4).toFixed(1) + '" text-anchor="end">' + num(tick) + '</text>';
      }).join("");
      const paths = series.map(function (item) {
        const coords = data.map(function (row, index) {
          const x = xAt(index);
          const y = yAt(row[item.key]);
          return { x: x, y: y, value: Number(row[item.key] || 0) };
        });
        const points = coords.map(function (point, index) { return (index ? "L" : "M") + point.x.toFixed(1) + " " + point.y.toFixed(1); }).join(" ");
        const circles = coords.filter(function (point) { return point.value > 0 || data.length === 1; }).map(function (point) {
          return '<circle class="chart-point" cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="4" fill="white" stroke="' + item.color + '" stroke-width="2.5"/>';
        }).join("");
        return '<path d="' + points + '" fill="none" stroke="' + item.color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + circles;
      }).join("");
      const labels = series.map(function (item) { return '<span><i class="dot" style="background:' + item.color + '"></i>' + item.label + '</span>'; }).join("");
      const tickIndexes = Array.from(new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]));
      const xLabels = tickIndexes.map(function (index) {
        const label = String(data[index].date || "").slice(0, 13).replace("T", " ");
        return '<text class="axis-label" x="' + xAt(index).toFixed(1) + '" y="' + (height - 12) + '" text-anchor="middle">' + escapeHtml(label) + '</text>';
      }).join("");
      const payload = encodeURIComponent(JSON.stringify({ data: data, series: series, width: width, height: height, left: left, right: right, top: top, bottom: bottom, max: max }));
      return '<div class="chart-wrap" data-chart="' + payload + '"><svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Traffic over time">' + grid + '<line x1="' + left + '" y1="' + (height - bottom) + '" x2="' + (width - right) + '" y2="' + (height - bottom) + '" stroke="#d0d5dd"/><line x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + (height - bottom) + '" stroke="#d0d5dd"/>' + xLabels + paths + '<line class="hover-line" x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + (height - bottom) + '" stroke="#98a2b3" stroke-width="1.5" stroke-dasharray="4 4"/><g class="hover-points"></g><rect class="chart-hit" x="' + left + '" y="' + top + '" width="' + plotWidth + '" height="' + plotHeight + '"/></svg><div class="chart-tooltip"></div></div><div class="legend">' + labels + '</div>';
    }
    function funnelChart(items) {
      const rows = items || [];
      const max = Math.max.apply(null, rows.map(function (row) { return Number(row.value || 0); }).concat([1]));
      return '<div class="funnel">' + rows.map(function (row) {
        const value = Number(row.value || 0);
        const width = Math.max(2, Math.round((value / max) * 100));
        return '<div class="funnel-step"><strong>' + escapeHtml(row.label) + '</strong><div class="funnel-track"><div class="funnel-fill" style="width:' + width + '%">' + width + '%</div></div><span class="bar-value">' + num(value) + '</span></div>';
      }).join("") + '</div>';
    }
    function bindCharts() {
      document.querySelectorAll("[data-chart]").forEach(function (wrap) {
        const payload = JSON.parse(decodeURIComponent(wrap.dataset.chart || "{}"));
        const svg = wrap.querySelector("svg");
        const hit = wrap.querySelector(".chart-hit");
        const line = wrap.querySelector(".hover-line");
        const points = wrap.querySelector(".hover-points");
        const tooltip = wrap.querySelector(".chart-tooltip");
        if (!svg || !hit || !line || !points || !tooltip || !payload.data) return;
        const plotWidth = payload.width - payload.left - payload.right;
        const plotHeight = payload.height - payload.top - payload.bottom;
        const xAt = function (index) { return payload.data.length === 1 ? payload.left + plotWidth / 2 : payload.left + (index / (payload.data.length - 1)) * plotWidth; };
        const yAt = function (value) { return payload.top + plotHeight - (Number(value || 0) / payload.max) * plotHeight; };
        const clear = function () {
          line.style.opacity = "0";
          points.innerHTML = "";
          tooltip.style.opacity = "0";
        };
        const move = function (event) {
          const point = svg.createSVGPoint();
          point.x = event.clientX;
          point.y = event.clientY;
          const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
          const x = svgPoint.x;
          const ratio = Math.min(1, Math.max(0, (x - payload.left) / plotWidth));
          const index = Math.min(payload.data.length - 1, Math.max(0, Math.round(ratio * (payload.data.length - 1))));
          const row = payload.data[index];
          const lineX = xAt(index);
          line.setAttribute("x1", lineX);
          line.setAttribute("x2", lineX);
          line.style.opacity = "1";
          points.innerHTML = payload.series.map(function (item) {
            return '<circle cx="' + lineX.toFixed(1) + '" cy="' + yAt(row[item.key]).toFixed(1) + '" r="5" fill="white" stroke="' + item.color + '" stroke-width="3"/>';
          }).join("");
          const label = String(row.date || "").replace("T", " ");
          tooltip.innerHTML = '<strong>' + escapeHtml(label) + '</strong>' + payload.series.map(function (item) {
            return '<div><span><i class="dot" style="background:' + item.color + '"></i>' + escapeHtml(item.label) + '</span><b>' + num(row[item.key]) + '</b></div>';
          }).join("");
          const wrapRect = wrap.getBoundingClientRect();
          tooltip.style.left = Math.min(Math.max(lineX / payload.width * wrapRect.width, 105), wrapRect.width - 105) + "px";
          tooltip.style.top = Math.max(64, yAt(Math.max.apply(null, payload.series.map(function (item) { return Number(row[item.key] || 0); }))) / payload.height * wrapRect.height - 12) + "px";
          tooltip.style.opacity = "1";
        };
        hit.addEventListener("pointermove", move);
        hit.addEventListener("pointerleave", clear);
        hit.addEventListener("pointerdown", move);
      });
    }
    function smtpPanelHtml(status) {
      const configured = status && status.configured;
      const missing = status && status.missing && status.missing.length ? status.missing.join(", ") : "";
      const details = configured
        ? "Ready. SMTP " + escapeHtml(status.host || "-") + ":" + escapeHtml(status.port || "-") + " -> " + escapeHtml(status.to || "-")
        : "Not ready" + (missing ? ". Missing: " + escapeHtml(missing) : ".");
      return '<section class="panel status-panel"><div><strong>Email notification</strong><div class="muted">' + details + '</div><div class="caption" id="smtp-test-result">Booking form submissions are stored here even if email delivery fails.</div></div><button type="button" class="primary" id="smtp-test" ' + (configured ? "" : "disabled") + '>Send test email</button></section>';
    }
    function bindSmtpTestButton() {
      const button = $("smtp-test");
      const result = $("smtp-test-result");
      if (!button || !result) return;
      button.addEventListener("click", async () => {
        button.disabled = true;
        result.textContent = "Sending test email...";
        try {
          await api("/admin/api/smtp-test", { method: "POST" });
          result.textContent = "Test email sent. Check the Gmail inbox and spam folder.";
        } catch (error) {
          result.textContent = "Test failed: " + error.message;
        } finally {
          button.disabled = false;
        }
      });
    }
    function renderRows(headers, rows, prefixHtml = "") {
      $("content").innerHTML = prefixHtml + '<section class="tablewrap"><table><thead id="thead"></thead><tbody id="tbody"></tbody></table></section>';
      $("thead").innerHTML = "<tr>" + headers.map(function (h) { return "<th>" + escapeHtml(h) + "</th>"; }).join("") + "</tr>";
      $("tbody").replaceChildren.apply($("tbody"), rows);
    }
    function metricsHtml(data) {
      return '<section class="metric-grid">'
        + metricCard("Visitors", data.metrics.visitors, data.sparklines.visitors)
        + metricCard("Sessions", data.metrics.sessions, data.sparklines.sessions)
        + metricCard("Page views", data.metrics.pageViews, data.sparklines.pageViews)
        + metricCard("Booking clicks", data.metrics.bookingClicks, data.sparklines.bookingClicks)
        + metricCard("Contact leads", data.metrics.leads, data.sparklines.leads)
        + metricCard("Registrations", data.metrics.registrations, data.sparklines.registrations)
        + metricCard("Booking CTR", data.metrics.bookingRate, data.sparklines.bookingClicks, "%")
        + metricCard("Lead conversion", data.metrics.leadRate, data.sparklines.leads, "%")
        + '</section>';
    }
    function adsMetricsHtml(data) {
      return '<section class="metric-grid">'
        + metricCard("Ad sessions", data.metrics.sessions, data.sparklines.sessions)
        + metricCard("Ad visitors", data.metrics.visitors, data.sparklines.visitors)
        + metricCard("Page views", data.metrics.pageViews, data.sparklines.pageViews)
        + metricCard("All conversions", data.metrics.conversions, data.sparklines.conversions)
        + metricCard("Contact submits", data.metrics.contactSubmits, data.sparklines.contactSubmits)
        + metricCard("Member signups", data.metrics.memberSignups, data.sparklines.memberSignups)
        + metricCard("External clicks", data.metrics.externalClicks, data.sparklines.externalClicks)
        + metricCard("WhatsApp opens", data.metrics.whatsappOpens, data.sparklines.whatsappOpens)
        + metricCard("Kalix opens", data.metrics.kalixOpens, data.sparklines.kalixOpens)
        + metricCard("Community inquiries", data.metrics.communityInquiries, data.sparklines.communityInquiries)
        + metricCard("XT Diabetes referrals", data.metrics.xtReferrals, data.sparklines.xtReferrals)
        + metricCard("Booking page clicks", data.metrics.bookingClicks, data.sparklines.bookingClicks)
        + metricCard("Contact rate", data.metrics.contactRate, data.sparklines.contactSubmits, "%")
        + '</section>';
    }
    function insightsHtml(data) {
      return '<section class="insights">' + (data.insights || []).slice(0, 4).map(function (item, index) {
        return '<article class="insight"><strong>Insight ' + (index + 1) + '</strong><div>' + escapeHtml(item) + '</div></article>';
      }).join("") + '</section>';
    }
    function renderDashboard(data) {
      $("title").textContent = "Dashboard";
      $("content").innerHTML = (isMobileAdmin() ? mobileAnalyticsTabs() : "") + insightsHtml(data) + metricsHtml(data) + '<section class="chart-grid">'
        + panel("Traffic over time", "Page views, visitors, and sessions", lineChart(data.timeline), true)
        + panel("Conversion funnel", "Sessions through registration", funnelChart(data.funnel), false)
        + panel("Top pages", "Pages ranked by views", barList(data.topPages, "pageViews"), false)
        + panel("Traffic sources", "Grouped acquisition channels", barList(data.sourceChannels, "count"), false)
        + panel("Locations", "Top countries by activity", barList(data.topCountries, "count"), false)
        + panel("Devices", "Desktop, mobile, and tablet split", barList(data.topDevices, "count"), false)
        + '</section>';
      bindCharts();
      bindAnalyticsTabs();
    }
    function campaignTable(rows) {
      const data = rows || [];
      if (!data.length) return '<div class="empty">No UTM-tagged ad traffic yet.</div>';
      if (isMobileAdmin()) return '<div class="mobile-data-list">' + data.map(function (row) { return '<article class="mobile-data-row"><strong>' + escapeHtml(row.label) + '</strong><dl><div><dt>Source</dt><dd>' + escapeHtml(row.source) + '</dd></div><div><dt>Sessions</dt><dd>' + num(row.sessions) + '</dd></div><div><dt>Booking page</dt><dd>' + num(row.bookingClicks) + '</dd></div><div><dt>WhatsApp</dt><dd>' + num(row.whatsappOpens) + '</dd></div><div><dt>Kalix</dt><dd>' + num(row.kalixOpens) + '</dd></div><div><dt>External</dt><dd>' + num(row.externalClicks) + '</dd></div><div><dt>Submits</dt><dd>' + num(row.contactSubmits) + '</dd></div><div><dt>Community</dt><dd>' + num(row.communityInquiries) + '</dd></div><div><dt>XT referrals</dt><dd>' + num(row.xtReferrals) + '</dd></div><div><dt>Signups</dt><dd>' + num(row.memberSignups) + '</dd></div></dl></article>'; }).join("") + '</div>';
      return '<section class="tablewrap"><table><thead><tr><th>Campaign</th><th>Source</th><th>Medium</th><th>Sessions</th><th>Visitors</th><th>Page views</th><th>Booking page clicks</th><th>WhatsApp opens</th><th>Kalix opens</th><th>External clicks</th><th>Successful submits</th><th>Community inquiries</th><th>XT referrals</th><th>Signups</th></tr></thead><tbody>'
        + data.map(function (row) {
          return '<tr><td>' + escapeHtml(row.label) + '</td><td>' + escapeHtml(row.source) + '</td><td>' + escapeHtml(row.medium) + '</td><td>' + num(row.sessions) + '</td><td>' + num(row.visitors) + '</td><td>' + num(row.pageViews) + '</td><td>' + num(row.bookingClicks) + '</td><td>' + num(row.whatsappOpens) + '</td><td>' + num(row.kalixOpens) + '</td><td>' + num(row.externalClicks) + '</td><td>' + num(row.contactSubmits) + '</td><td>' + num(row.communityInquiries) + '</td><td>' + num(row.xtReferrals) + '</td><td>' + num(row.memberSignups) + '</td></tr>';
        }).join("") + '</tbody></table></section>';
    }
    function contentTable(rows) {
      const data = rows || [];
      if (!data.length) return '<div class="empty">No ad content data yet. Add utm_content to ad URLs.</div>';
      if (isMobileAdmin()) return '<div class="mobile-data-list">' + data.map(function (row) { return '<article class="mobile-data-row"><strong>' + escapeHtml(row.label) + '</strong><dl><div><dt>Campaign</dt><dd>' + escapeHtml(row.campaign) + '</dd></div><div><dt>Sessions</dt><dd>' + num(row.sessions) + '</dd></div><div><dt>Booking page</dt><dd>' + num(row.bookingClicks) + '</dd></div><div><dt>WhatsApp</dt><dd>' + num(row.whatsappOpens) + '</dd></div><div><dt>Kalix</dt><dd>' + num(row.kalixOpens) + '</dd></div><div><dt>External</dt><dd>' + num(row.externalClicks) + '</dd></div><div><dt>Submits</dt><dd>' + num(row.contactSubmits) + '</dd></div><div><dt>Community</dt><dd>' + num(row.communityInquiries) + '</dd></div><div><dt>XT referrals</dt><dd>' + num(row.xtReferrals) + '</dd></div><div><dt>Signups</dt><dd>' + num(row.memberSignups) + '</dd></div></dl></article>'; }).join("") + '</div>';
      return '<section class="tablewrap"><table><thead><tr><th>Content</th><th>Campaign</th><th>Sessions</th><th>Visitors</th><th>Page views</th><th>Booking page clicks</th><th>WhatsApp opens</th><th>Kalix opens</th><th>External clicks</th><th>Successful submits</th><th>Community inquiries</th><th>XT referrals</th><th>Signups</th></tr></thead><tbody>'
        + data.map(function (row) {
          return '<tr><td>' + escapeHtml(row.label) + '</td><td>' + escapeHtml(row.campaign) + '</td><td>' + num(row.sessions) + '</td><td>' + num(row.visitors) + '</td><td>' + num(row.pageViews) + '</td><td>' + num(row.bookingClicks) + '</td><td>' + num(row.whatsappOpens) + '</td><td>' + num(row.kalixOpens) + '</td><td>' + num(row.externalClicks) + '</td><td>' + num(row.contactSubmits) + '</td><td>' + num(row.communityInquiries) + '</td><td>' + num(row.xtReferrals) + '</td><td>' + num(row.memberSignups) + '</td></tr>';
        }).join("") + '</tbody></table></section>';
    }
    function recentAdEventsTable(rows) {
      const data = rows || [];
      if (!data.length) return '<div class="empty">No recent ad events in this range.</div>';
      if (isMobileAdmin()) return '<div class="mobile-data-list">' + data.map(function (row) { return '<article class="mobile-data-row"><strong>' + escapeHtml(row.event_type) + '</strong><dl><div><dt>Time</dt><dd>' + escapeHtml(date(row.created_at)) + '</dd></div><div><dt>Campaign</dt><dd>' + escapeHtml(row.utm_campaign) + '</dd></div><div><dt>Page</dt><dd>' + escapeHtml(row.path) + '</dd></div><div><dt>Source</dt><dd>' + escapeHtml(row.utm_source) + '</dd></div></dl></article>'; }).join("") + '</div>';
      return '<section class="tablewrap"><table><thead><tr><th>Time</th><th>Event</th><th>Page</th><th>Source</th><th>Medium</th><th>Campaign</th><th>Content</th></tr></thead><tbody>'
        + data.map(function (row) {
          return '<tr><td>' + escapeHtml(date(row.created_at)) + '</td><td>' + escapeHtml(row.event_type) + '</td><td>' + escapeHtml(row.path) + '</td><td>' + escapeHtml(row.utm_source) + '</td><td>' + escapeHtml(row.utm_medium) + '</td><td>' + escapeHtml(row.utm_campaign) + '</td><td>' + escapeHtml(row.utm_content) + '</td></tr>';
        }).join("") + '</tbody></table></section>';
    }
    async function renderAds() {
      $("title").textContent = "Ads";
      const data = await getAdsAnalytics();
      $("content").innerHTML = (isMobileAdmin() ? mobileAnalyticsTabs() : "") + adsMetricsHtml(data) + '<section class="chart-grid">'
        + panel("Ad traffic over time", "UTM-tagged sessions, visitors, and page views", lineChart(data.timeline), true)
        + panel("Ad actions", "Each action is counted separately", barList(data.actions, "value"), false)
        + panel("Landing pages", "Ad traffic by destination page", barList(data.landingPages, "sessions"), false)
        + panel("Campaigns", "UTM campaign performance", campaignTable(data.campaigns), true)
        + panel("Ad content", "UTM content performance by creative or copy", contentTable(data.contents), true)
        + panel("Recent ad events", "Latest UTM-tagged activity", recentAdEventsTable(data.recentEvents), true)
        + '</section>';
      bindCharts();
      bindAnalyticsTabs();
    }
    function renderTraffic(data) {
      $("title").textContent = "Traffic";
      $("content").innerHTML = (isMobileAdmin() ? mobileAnalyticsTabs() : "") + metricsHtml(data) + '<section class="chart-grid">'
        + panel("Traffic over time", "Page views, visitors, and sessions", lineChart(data.timeline), true)
        + panel("Top pages", "Highest-viewed pages", barList(data.topPages, "pageViews"), false)
        + panel("Landing pages", "Entry pages by session count", barList(data.landingPages, "sessions"), false)
        + panel("Browsers", "Browser breakdown", barList(data.topBrowsers, "count"), false)
        + panel("Devices", "Device breakdown", barList(data.topDevices, "count"), false)
        + '</section>';
      bindCharts();
      bindAnalyticsTabs();
    }
    function renderSources(data) {
      $("title").textContent = "Sources";
      $("content").innerHTML = (isMobileAdmin() ? mobileAnalyticsTabs() : "") + metricsHtml(data) + '<section class="chart-grid">'
        + panel("Source channels", "Direct, search, social, referral, and campaigns", barList(data.sourceChannels, "count"), false)
        + panel("Referrers", "Top referring URLs", barList(data.topReferrers, "count"), false)
        + panel("Traffic over time", "Traffic trend for selected range", lineChart(data.timeline), true)
        + '</section>';
      bindCharts();
      bindAnalyticsTabs();
    }
    function renderLocations(data) {
      $("title").textContent = "Locations";
      $("content").innerHTML = (isMobileAdmin() ? mobileAnalyticsTabs() : "") + metricsHtml(data) + '<section class="chart-grid">'
        + panel("Countries", "Country-level traffic", barList(data.topCountries, "count"), false)
        + panel("Regions", "State or region activity", barList(data.topRegions, "count"), false)
        + panel("Cities", "City-level activity", barList(data.topCities, "count"), false)
        + panel("Traffic over time", "Location-filterable reports can be added later", lineChart(data.timeline), false)
        + '</section>';
      bindCharts();
      bindAnalyticsTabs();
    }
    function renderConversions(data) {
      $("title").textContent = "Conversions";
      $("content").innerHTML = (isMobileAdmin() ? mobileAnalyticsTabs() : "") + metricsHtml(data) + '<section class="chart-grid">'
        + panel("Conversion funnel", "Sessions to booking, lead, and account creation", funnelChart(data.funnel), true)
        + panel("Booking clicks", "Booking intent over time", barList(data.timeline.map(function (row) { return { label: row.date, count: row.bookingClicks }; }), "count"), false)
        + panel("Contact submits", "Tracked contact form submits", barList(data.timeline.map(function (row) { return { label: row.date, count: row.contactSubmits }; }), "count"), false)
        + '</section>';
      bindAnalyticsTabs();
    }
    async function loadAnalyticsView() {
      const data = await getAnalytics();
      if (state.view === "traffic") return renderTraffic(data);
      if (state.view === "sources") return renderSources(data);
      if (state.view === "locations") return renderLocations(data);
      if (state.view === "conversions") return renderConversions(data);
      return renderDashboard(data);
    }
    async function saveBooking(booking, changes) {
      const body = {
        id: booking.id,
        leadStatus: booking.lead_status || "new",
        assignedTo: booking.assigned_to || "",
        followUpAt: booking.follow_up_at || "",
        notes: booking.notes || "",
        ...changes,
      };
      await api("/admin/api/bookings/update", { method: "POST", body: JSON.stringify(body) });
      Object.assign(booking, {
        lead_status: body.leadStatus,
        assigned_to: body.assignedTo,
        follow_up_at: body.followUpAt,
        notes: body.notes,
      });
    }
    function mobileBookingCard(booking, compact) {
      const parsed = parseBookingMessage(booking.message);
      const phone = booking.phone || parsed.phone;
      const service = booking.service_interest || "Free consultation";
      return '<article class="mobile-card" data-booking-card data-search="' + escapeHtml([booking.name, booking.email, phone, service].join(" ").toLowerCase()) + '" data-status="' + escapeHtml(booking.lead_status || "new") + '">'
        + '<div class="mobile-card-head"><div><h2>' + escapeHtml(booking.name) + '</h2><div class="mobile-card-meta">' + escapeHtml(date(booking.created_at)) + ' · ' + escapeHtml(service) + '</div></div>'
        + (compact ? '<span class="badge">' + escapeHtml(statusLabel(booking.lead_status || "new")) + '</span>' : '<select class="mobile-status" data-booking-status="' + escapeHtml(booking.id) + '" aria-label="Booking status">' + Object.keys(statusLabels).map(function (status) { return '<option value="' + status + '"' + (status === (booking.lead_status || "new") ? ' selected' : '') + '>' + statusLabels[status] + '</option>'; }).join("") + '</select>') + '</div>'
        + '<div class="mobile-card-summary"><div><span>Phone</span><strong>' + escapeHtml(phone) + '</strong></div><div><span>Follow-up</span><strong>' + escapeHtml(booking.follow_up_at ? date(booking.follow_up_at) : "Not set") + '</strong></div><div><span>Insurance</span><strong>' + escapeHtml(booking.insurance_company || parsed.insuranceCompany) + '</strong></div><div><span>Owner</span><strong>' + escapeHtml(booking.assigned_to || "Unassigned") + '</strong></div></div>'
        + '<div class="mobile-card-actions">' + (phone ? '<a href="' + phoneHref(phone) + '">Call</a>' : '<button type="button" disabled>Call</button>') + '<a href="mailto:' + escapeHtml(booking.email) + '">Email</a><button type="button" class="mobile-detail-button" data-booking-detail="' + escapeHtml(booking.id) + '">Details</button></div></article>';
    }
    function bookingDetails(booking) {
      const parsed = parseBookingMessage(booking.message);
      const phone = booking.phone || parsed.phone;
      openMobileSheet(booking.name || "Booking details", mobileDetailGrid([
        { label: "Status", value: statusLabel(booking.lead_status || "new") },
        { label: "Service", value: booking.service_interest },
        { label: "Patient", value: booking.patient_type === "returning" ? "Returning patient" : booking.patient_type === "new" ? "New patient" : booking.patient_type },
        { label: "Created", value: date(booking.created_at) },
        { label: "Email", value: booking.email, wide: true },
        { label: "Phone", value: phone },
        { label: "Language", value: booking.preferred_language || parsed.preferredLanguage },
        { label: "Available", value: booking.availability || parsed.availability, wide: true },
        { label: "Insurance", value: booking.insurance_company || parsed.insuranceCompany },
        { label: "Member ID", value: booking.insurance_member_id || parsed.insuranceMemberId },
        { label: "Date of birth", value: booking.date_of_birth || parsed.dateOfBirth },
        { label: "Assigned", value: booking.assigned_to || "Unassigned" },
        { label: "Follow-up", value: booking.follow_up_at ? date(booking.follow_up_at) : "Not set", wide: true }
      ]) + (booking.notes || booking.message ? '<div class="mobile-detail-note">' + escapeHtml(booking.notes || booking.message) + '</div>' : '')
        + '<div class="mobile-inline-actions">' + (phone ? '<a href="' + phoneHref(phone) + '">Call</a>' : '<span></span>') + '<button type="button" class="primary" id="mobile-edit-booking">Edit follow-up</button></div>');
      $("mobile-edit-booking").addEventListener("click", function () { bookingEditForm(booking); });
    }
    function bookingEditForm(booking) {
      openMobileSheet("Update follow-up", '<form class="mobile-sheet-form" id="mobile-booking-form">'
        + '<label>Status<select id="mobile-booking-status">' + Object.keys(statusLabels).map(function (status) { return '<option value="' + status + '"' + (status === (booking.lead_status || "new") ? ' selected' : '') + '>' + statusLabels[status] + '</option>'; }).join("") + '</select></label>'
        + '<label>Assigned to<input id="mobile-booking-owner" value="' + escapeHtml(booking.assigned_to || "") + '" autocomplete="off"></label>'
        + '<label>Next follow-up<input id="mobile-booking-followup" type="datetime-local" value="' + escapeHtml(mobileDateValue(booking.follow_up_at)) + '"></label>'
        + '<label>Internal notes<textarea id="mobile-booking-notes">' + escapeHtml(booking.notes || "") + '</textarea></label>'
        + '<button class="primary" type="submit">Save changes</button></form>');
      $("mobile-booking-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button[type=submit]");
        button.disabled = true;
        try {
          const status = $("mobile-booking-status").value;
          await saveBooking(booking, { leadStatus: status, assignedTo: $("mobile-booking-owner").value.trim(), followUpAt: $("mobile-booking-followup").value, notes: $("mobile-booking-notes").value.trim(), markContacted: status === "contacted" });
          closeMobileSheet();
          showToast("Booking updated");
          await loadBookings();
        } catch (error) {
          showToast(error.message);
          button.disabled = false;
        }
      });
    }
    function bindMobileBookingCards(bookings) {
      const byId = Object.fromEntries(bookings.map(function (booking) { return [String(booking.id), booking]; }));
      document.querySelectorAll("[data-booking-detail]").forEach(function (button) { button.addEventListener("click", function () { bookingDetails(byId[String(button.dataset.bookingDetail)]); }); });
      document.querySelectorAll("[data-booking-status]").forEach(function (select) {
        select.addEventListener("change", async function () {
          const booking = byId[String(select.dataset.bookingStatus)];
          select.disabled = true;
          try { await saveBooking(booking, { leadStatus: select.value, markContacted: select.value === "contacted" }); showToast("Status updated"); }
          catch (error) { select.value = booking.lead_status || "new"; showToast(error.message); }
          finally { select.disabled = false; }
        });
      });
    }
    function renderMobileBookings(bookings, compact) {
      const list = bookings || [];
      $("content").innerHTML = (compact ? "" : '<input class="mobile-search" id="mobile-booking-search" type="search" placeholder="Search name, phone, email, or service"><div class="mobile-filter-bar" id="mobile-booking-filters"><button type="button" data-filter="all" class="active">All</button>' + Object.keys(statusLabels).map(function (status) { return '<button type="button" data-filter="' + status + '">' + statusLabels[status] + '</button>'; }).join("") + '</div>')
        + '<div class="mobile-list">' + (list.length ? list.map(function (booking) { return mobileBookingCard(booking, compact); }).join("") : '<div class="mobile-empty">No booking requests yet.</div>') + '</div>';
      bindMobileBookingCards(list);
      if (!compact && $("mobile-booking-search")) {
        let activeFilter = "all";
        const applyFilter = function () {
          const query = $("mobile-booking-search").value.trim().toLowerCase();
          document.querySelectorAll("[data-booking-card]").forEach(function (card) { card.hidden = !card.dataset.search.includes(query) || (activeFilter !== "all" && card.dataset.status !== activeFilter); });
        };
        $("mobile-booking-search").addEventListener("input", applyFilter);
        $("mobile-booking-filters").querySelectorAll("button").forEach(function (button) { button.addEventListener("click", function () { activeFilter = button.dataset.filter; $("mobile-booking-filters").querySelectorAll("button").forEach(function (item) { item.classList.toggle("active", item === button); }); applyFilter(); }); });
      }
    }
    function handoffVisitor(click) {
      const value = String(click.visitor_id || click.session_id || "");
      return value ? "Visitor ..." + value.slice(-8) : "Anonymous visitor";
    }
    function handoffLocation(click) {
      return [click.city, click.region, click.country].filter(Boolean).join(", ") || "Unknown";
    }
    function handoffSource(click) {
      return click.utm_source || click.utm_campaign ? [click.utm_source || "Campaign", click.utm_campaign].filter(Boolean).join(" / ") : "Direct or unknown";
    }
    function handoffConfig(kind) {
      return kind === "kalix"
        ? { title: "Kalix Opens", item: "Kalix open", endpoint: "/admin/api/kalix-clicks", empty: "No Kalix opens in this date range.", note: "An open means the visitor reached the Kalix booking calendar. It is not a confirmed appointment." }
        : { title: "WhatsApp Opens", item: "WhatsApp open", endpoint: "/admin/api/whatsapp-clicks", empty: "No WhatsApp opens in this date range.", note: "An open means the visitor reached the WhatsApp handoff. It does not confirm that they sent a message or booked an appointment." };
    }
    function handoffService(click, kind) {
      if (kind !== "kalix") return "WhatsApp";
      return { glpCare: "GLP-1 care", medical: "Medical weight loss", insurance: "Insurance" }[click.event_name] || click.event_name || "Kalix booking";
    }
    function handoffSummary(data) {
      const summary = data.summary || {};
      return '<section class="mobile-action-grid"><article class="mobile-action-stat"><span>Total opens</span><strong>' + num(summary.total) + '</strong></article><article class="mobile-action-stat"><span>Unique visitors</span><strong>' + num(summary.uniqueVisitors) + '</strong></article><article class="mobile-action-stat"><span>From campaigns</span><strong>' + num(summary.attributedOpens) + '</strong></article><article class="mobile-action-stat"><span>Most recent</span><strong style="font-size:15px;line-height:1.35">' + escapeHtml(summary.latest ? date(summary.latest) : "No opens") + '</strong></article></section>';
    }
    function handoffDetails(click, kind) {
      const config = handoffConfig(kind);
      openMobileSheet(config.item, mobileDetailGrid([
        { label: "Opened", value: date(click.created_at), wide: true },
        { label: "Visitor", value: handoffVisitor(click), wide: true },
        { label: "Service", value: handoffService(click, kind), wide: true },
        { label: "Source", value: click.utm_source || "Direct or unknown" },
        { label: "Medium", value: click.utm_medium },
        { label: "Campaign", value: click.utm_campaign, wide: true },
        { label: "Ad content", value: click.utm_content, wide: true },
        { label: "Device", value: click.device },
        { label: "Browser", value: click.browser },
        { label: "Language", value: click.language },
        { label: "Location", value: handoffLocation(click), wide: true },
        { label: "Time zone", value: click.timezone, wide: true },
        { label: "Entry path", value: click.path, wide: true },
        { label: "Referrer", value: click.referrer, wide: true }
      ]) + '<div class="mobile-detail-note">' + config.note + '</div>');
    }
    function renderMobileHandoff(data, kind) {
      const config = handoffConfig(kind);
      const clicks = data.clicks || [];
      $("content").innerHTML = '<div class="mobile-filter-bar"><button type="button" data-handoff-range="1">Today</button><button type="button" data-handoff-range="7">7 days</button><button type="button" data-handoff-range="30">30 days</button></div>' + handoffSummary(data) + '<div class="mobile-detail-note" style="margin:0 0 14px">' + config.note + '</div><div class="mobile-list">'
        + (clicks.length ? clicks.map(function (click, index) { return '<article class="mobile-card"><div class="mobile-card-head"><div><h2>' + config.item + '</h2><div class="mobile-card-meta">' + escapeHtml(date(click.created_at)) + '</div></div><span class="badge">' + escapeHtml(click.utm_source ? "Campaign" : "Direct") + '</span></div><div class="mobile-card-summary"><div><span>Visitor</span><strong>' + escapeHtml(handoffVisitor(click)) + '</strong></div><div><span>Service</span><strong>' + escapeHtml(handoffService(click, kind)) + '</strong></div><div><span>Source</span><strong>' + escapeHtml(handoffSource(click)) + '</strong></div><div><span>Device</span><strong>' + escapeHtml(click.device) + '</strong></div><div><span>Location</span><strong>' + escapeHtml(handoffLocation(click)) + '</strong></div></div><div class="mobile-card-actions"><button type="button" class="mobile-detail-button" data-handoff-detail="' + index + '" style="grid-column:1/-1">View details</button></div></article>'; }).join("") : '<div class="mobile-empty">' + config.empty + '</div>') + '</div>';
      document.querySelectorAll("[data-handoff-detail]").forEach(function (button) { button.addEventListener("click", function () { handoffDetails(clicks[Number(button.dataset.handoffDetail)], kind); }); });
      document.querySelectorAll("[data-handoff-range]").forEach(function (button) { button.addEventListener("click", function () { setRange(Number(button.dataset.handoffRange)); loadHandoffClicks(kind); }); });
    }
    async function loadHandoffClicks(kind) {
      const config = handoffConfig(kind);
      $("title").textContent = config.title;
      $("range-caption").textContent = "Intent signals only, not confirmed appointments.";
      const data = await api(config.endpoint + whatsappQuery(100));
      if (isMobileAdmin()) { renderMobileHandoff(data, kind); return; }
      const rows = (data.clicks || []).map(function (click) {
        const tr = document.createElement("tr");
        [date(click.created_at), handoffVisitor(click), handoffService(click, kind), handoffSource(click), click.utm_content, click.device, handoffLocation(click), click.language, click.path].forEach(function (cell) { const td = document.createElement("td"); td.textContent = text(cell); tr.appendChild(td); });
        return tr;
      });
      const summary = data.summary || {};
      const prefix = '<section class="panel status-panel"><div><strong>' + config.title + '</strong><div class="muted">' + config.note + '</div></div></section><section class="metric-grid"><article class="metric-card"><div class="metric-head"><span>Total opens</span></div><div class="metric-value">' + num(summary.total) + '</div><div class="caption">Selected range</div></article><article class="metric-card"><div class="metric-head"><span>Unique visitors</span></div><div class="metric-value">' + num(summary.uniqueVisitors) + '</div><div class="caption">Anonymous browser IDs</div></article><article class="metric-card"><div class="metric-head"><span>From campaigns</span></div><div class="metric-value">' + num(summary.attributedOpens) + '</div><div class="caption">Has UTM attribution</div></article><article class="metric-card"><div class="metric-head"><span>Most recent</span></div><div style="font-size:18px;font-weight:850;line-height:1.4">' + escapeHtml(summary.latest ? date(summary.latest) : "No opens") + '</div></article></section>';
      renderRows(["Opened", "Visitor", "Service", "Source / Campaign", "Ad Content", "Device", "Location", "Language", "Path"], rows, prefix);
    }
    async function loadWhatsappClicks() { return loadHandoffClicks("whatsapp"); }
    async function loadKalixClicks() { return loadHandoffClicks("kalix"); }
    async function loadMobileOverview() {
      $("title").textContent = "Overview";
      $("range-caption").textContent = "What needs attention now";
      const results = await Promise.all([
        api("/admin/api/bookings?limit=100"),
        api("/admin/api/class-signups?limit=100").catch(function () { return { signups: [] }; }),
        getAnalytics().catch(function () { return null; }),
        api("/admin/api/whatsapp-clicks" + whatsappQuery(4)).catch(function () { return { summary: { total: 0 }, clicks: [] }; }),
        api("/admin/api/kalix-clicks" + whatsappQuery(4)).catch(function () { return { summary: { total: 0 }, clicks: [] }; }),
        api("/admin/api/community-inquiries?limit=100").catch(function () { return { inquiries: [] }; })
      ]);
      $("range-caption").textContent = "What needs attention now";
      const bookings = results[0].bookings || [];
      const signups = results[1].signups || [];
      const whatsappOpens = results[3].summary?.total || 0;
      const kalixOpens = results[4].summary?.total || 0;
      const communityCount = (results[5].inquiries || []).filter(function (item) { return (item.lead_status || "new") !== "closed"; }).length;
      const now = Date.now();
      const newCount = bookings.filter(function (item) { return (item.lead_status || "new") === "new"; }).length;
      const dueCount = bookings.filter(function (item) { return item.follow_up_at && new Date(item.follow_up_at).getTime() <= now && !["converted", "closed"].includes(item.lead_status); }).length;
      const insuranceCount = bookings.filter(function (item) { return item.lead_status === "benefits_check"; }).length;
      $("content").innerHTML = '<section class="mobile-action-grid"><article class="mobile-action-stat"><span>New bookings</span><strong>' + num(newCount) + '</strong></article><article class="mobile-action-stat"><span>Follow-ups due</span><strong>' + num(dueCount) + '</strong></article><article class="mobile-action-stat"><span>Insurance checks</span><strong>' + num(insuranceCount) + '</strong></article><article class="mobile-action-stat"><span>Class signups</span><strong>' + num(signups.length) + '</strong></article><button type="button" class="mobile-action-stat" id="mobile-whatsapp-stat"><span>WhatsApp opens</span><strong>' + num(whatsappOpens) + '</strong></button><button type="button" class="mobile-action-stat" id="mobile-kalix-stat"><span>Kalix opens</span><strong>' + num(kalixOpens) + '</strong></button><button type="button" class="mobile-action-stat" id="mobile-community-stat"><span>Community inquiries</span><strong>' + num(communityCount) + '</strong></button></section>'
        + '<div class="mobile-section-heading"><h2>Recent bookings</h2><button type="button" id="mobile-view-all-bookings">View all</button></div><div id="mobile-recent-bookings"></div>';
      const recentContainer = $("mobile-recent-bookings");
      recentContainer.innerHTML = '<div class="mobile-list">' + (bookings.length ? bookings.slice(0, 4).map(function (booking) { return mobileBookingCard(booking, true); }).join("") : '<div class="mobile-empty">No recent bookings.</div>') + '</div>';
      bindMobileBookingCards(bookings.slice(0, 4));
      $("mobile-view-all-bookings").addEventListener("click", function () { setView("bookings"); });
      $("mobile-whatsapp-stat").addEventListener("click", function () { setView("whatsapp"); });
      $("mobile-kalix-stat").addEventListener("click", function () { setView("kalix"); });
      $("mobile-community-stat").addEventListener("click", function () { setView("communityInquiries"); });
    }
    const communityStatusLabels = { new: "New", contacted: "Contacted", planning: "Planning", proposal_sent: "Proposal sent", confirmed: "Confirmed", closed: "Closed" };
    async function saveCommunityInquiry(inquiry, changes) {
      const body = { id: inquiry.id, leadStatus: inquiry.lead_status || "new", assignedTo: inquiry.assigned_to || "", followUpAt: inquiry.follow_up_at || "", notes: inquiry.internal_notes || "", ...changes };
      await api("/admin/api/community-inquiries/update", { method: "POST", body: JSON.stringify(body) });
      Object.assign(inquiry, { lead_status: body.leadStatus, assigned_to: body.assignedTo, follow_up_at: body.followUpAt, internal_notes: body.notes });
    }
    function communityInquiryForm(inquiry) {
      openMobileSheet("Update community inquiry", '<form class="mobile-sheet-form" id="mobile-community-form"><label>Status<select id="mobile-community-status">' + Object.keys(communityStatusLabels).map(function (status) { return '<option value="' + status + '"' + (status === (inquiry.lead_status || "new") ? ' selected' : '') + '>' + communityStatusLabels[status] + '</option>'; }).join("") + '</select></label><label>Assigned to<input id="mobile-community-owner" value="' + escapeHtml(inquiry.assigned_to || "") + '"></label><label>Next follow-up<input id="mobile-community-followup" type="datetime-local" value="' + escapeHtml(mobileDateValue(inquiry.follow_up_at)) + '"></label><label>Internal notes<textarea id="mobile-community-notes">' + escapeHtml(inquiry.internal_notes || "") + '</textarea></label><button class="primary" type="submit">Save changes</button></form>');
      $("mobile-community-form").addEventListener("submit", async function (event) {
        event.preventDefault();
        const button = event.currentTarget.querySelector("button[type=submit]");
        button.disabled = true;
        try { await saveCommunityInquiry(inquiry, { leadStatus: $("mobile-community-status").value, assignedTo: $("mobile-community-owner").value.trim(), followUpAt: $("mobile-community-followup").value, notes: $("mobile-community-notes").value.trim() }); closeMobileSheet(); showToast("Community inquiry updated"); await loadCommunityInquiries(); }
        catch (error) { showToast(error.message); button.disabled = false; }
      });
    }
    function communityInquiryDetails(inquiry) {
      openMobileSheet(inquiry.organization || "Community inquiry", mobileDetailGrid([
        { label: "Status", value: communityStatusLabels[inquiry.lead_status || "new"] }, { label: "Submitted", value: date(inquiry.created_at) },
        { label: "Contact", value: inquiry.contact_name }, { label: "Phone", value: inquiry.phone }, { label: "Email", value: inquiry.email, wide: true },
        { label: "Organization type", value: inquiry.organization_type }, { label: "Audience size", value: inquiry.audience_size }, { label: "Audience age", value: inquiry.audience_age },
        { label: "Language", value: inquiry.preferred_language }, { label: "Format", value: inquiry.program_format }, { label: "Delivery", value: inquiry.delivery },
        { label: "Preferred date", value: inquiry.preferred_date, wide: true }, { label: "Location", value: inquiry.location, wide: true }, { label: "Budget", value: inquiry.budget, wide: true },
        { label: "Topics", value: inquiry.topic, wide: true }, { label: "Request notes", value: inquiry.notes, wide: true }, { label: "Assigned", value: inquiry.assigned_to || "Unassigned" },
        { label: "Follow-up", value: inquiry.follow_up_at ? date(inquiry.follow_up_at) : "Not set", wide: true }
      ]) + (inquiry.internal_notes ? '<div class="mobile-detail-note">' + escapeHtml(inquiry.internal_notes) + '</div>' : '') + '<div class="mobile-inline-actions"><a href="mailto:' + escapeHtml(inquiry.email) + '">Email</a><button type="button" class="primary" id="mobile-edit-community">Edit follow-up</button></div>');
      $("mobile-edit-community").addEventListener("click", function () { communityInquiryForm(inquiry); });
    }
    async function loadCommunityInquiries() {
      $("title").textContent = "Community Inquiries";
      $("range-caption").textContent = "Requests from churches, community groups, employers, and event organizers.";
      const data = await api("/admin/api/community-inquiries?limit=100");
      const inquiries = data.inquiries || [];
      if (isMobileAdmin()) {
        $("content").innerHTML = '<div class="mobile-list">' + (inquiries.length ? inquiries.map(function (inquiry, index) { return '<article class="mobile-card"><div class="mobile-card-head"><div><h2>' + escapeHtml(inquiry.organization) + '</h2><div class="mobile-card-meta">' + escapeHtml(date(inquiry.created_at)) + ' · ' + escapeHtml(inquiry.organization_type) + '</div></div><span class="badge">' + escapeHtml(communityStatusLabels[inquiry.lead_status || "new"]) + '</span></div><div class="mobile-card-summary"><div><span>Contact</span><strong>' + escapeHtml(inquiry.contact_name) + '</strong></div><div><span>Audience</span><strong>' + escapeHtml(inquiry.audience_size) + '</strong></div><div><span>Format</span><strong>' + escapeHtml(inquiry.program_format) + '</strong></div><div><span>Date</span><strong>' + escapeHtml(inquiry.preferred_date) + '</strong></div></div><div class="mobile-card-actions"><a href="tel:' + escapeHtml(inquiry.phone) + '">Call</a><a href="mailto:' + escapeHtml(inquiry.email) + '">Email</a><button type="button" class="mobile-detail-button" data-community-detail="' + index + '">Details</button></div></article>'; }).join("") : '<div class="mobile-empty">No community inquiries yet.</div>') + '</div>';
        document.querySelectorAll("[data-community-detail]").forEach(function (button) { button.addEventListener("click", function () { communityInquiryDetails(inquiries[Number(button.dataset.communityDetail)]); }); });
        return;
      }
      const rows = inquiries.map(function (inquiry) {
        const tr = document.createElement("tr");
        const select = document.createElement("select");
        Object.keys(communityStatusLabels).forEach(function (status) { const option = document.createElement("option"); option.value = status; option.textContent = communityStatusLabels[status]; option.selected = status === (inquiry.lead_status || "new"); select.appendChild(option); });
        select.addEventListener("change", async function () { select.disabled = true; try { await saveCommunityInquiry(inquiry, { leadStatus: select.value }); } catch (error) { alert(error.message); } finally { select.disabled = false; } });
        const statusTd = document.createElement("td"); statusTd.appendChild(select); tr.appendChild(statusTd);
        [date(inquiry.created_at), inquiry.organization, inquiry.organization_type, inquiry.contact_name, inquiry.email, inquiry.phone, inquiry.audience_size, inquiry.audience_age, inquiry.preferred_language, inquiry.topic, inquiry.program_format, inquiry.delivery, inquiry.preferred_date, inquiry.location, inquiry.budget, inquiry.assigned_to, inquiry.follow_up_at ? date(inquiry.follow_up_at) : "", inquiry.internal_notes].forEach(function (cell) { const td = document.createElement("td"); td.textContent = text(cell); tr.appendChild(td); });
        const actionTd = document.createElement("td"); const button = document.createElement("button"); button.type = "button"; button.textContent = "Edit follow-up"; button.addEventListener("click", async function () { const assignedTo = prompt("Assigned to", inquiry.assigned_to || ""); if (assignedTo === null) return; const followUpAt = prompt("Follow-up date/time", inquiry.follow_up_at || ""); if (followUpAt === null) return; const notes = prompt("Internal notes", inquiry.internal_notes || ""); if (notes === null) return; await saveCommunityInquiry(inquiry, { assignedTo, followUpAt, notes }); await loadCommunityInquiries(); }); actionTd.appendChild(button); tr.appendChild(actionTd);
        return tr;
      });
      renderRows(["Status", "Submitted", "Organization", "Type", "Contact", "Email", "Phone", "Audience", "Age group", "Language", "Topics", "Format", "Delivery", "Preferred date", "Location", "Budget", "Assigned", "Follow-up", "Internal notes", "Actions"], rows);
    }
    async function loadLeads() {
      $("title").textContent = "Contact Leads";
      $("range-caption").textContent = "";
      const data = await api("/admin/api/contact-leads?limit=100");
      if (isMobileAdmin()) {
        const leads = data.leads || [];
        $("content").innerHTML = '<div class="mobile-list">' + (leads.length ? leads.map(function (lead, index) { return '<article class="mobile-card"><div class="mobile-card-head"><div><h2>' + escapeHtml(lead.name) + '</h2><div class="mobile-card-meta">' + escapeHtml(date(lead.created_at)) + '</div></div><span class="badge">' + escapeHtml(lead.sheet_status || "pending") + '</span></div><div class="mobile-card-summary"><div><span>Email</span><strong>' + escapeHtml(lead.email) + '</strong></div><div><span>Language</span><strong>' + escapeHtml(lead.preferred_language) + '</strong></div></div><div class="mobile-card-actions"><a href="mailto:' + escapeHtml(lead.email) + '">Email</a><button type="button" data-lead-detail="' + index + '" class="mobile-detail-button" style="grid-column:span 2">Details</button></div></article>'; }).join("") : '<div class="mobile-empty">No contact leads yet.</div>') + '</div>';
        document.querySelectorAll("[data-lead-detail]").forEach(function (button) { button.addEventListener("click", function () { const lead = leads[Number(button.dataset.leadDetail)]; openMobileSheet(lead.name || "Contact lead", mobileDetailGrid([{ label: "Created", value: date(lead.created_at) }, { label: "Language", value: lead.preferred_language }, { label: "Email", value: lead.email, wide: true }, { label: "Source", value: lead.source_page, wide: true }]) + '<div class="mobile-detail-note">' + escapeHtml(lead.message) + '</div>'); }); });
        return;
      }
      const rows = data.leads.map((lead) => {
        const tr = document.createElement("tr");
        const cells = [date(lead.created_at), lead.name, lead.email, lead.message, lead.source_page, lead.preferred_language, lead.sheet_status, lead.sheet_error];
        cells.forEach((cell, index) => {
          const td = document.createElement("td");
          if (index === 3) td.className = "message";
          if (index === 6) {
            const span = document.createElement("span");
            span.className = "badge " + (cell === "failed" ? "failed" : "");
            span.textContent = text(cell);
            td.appendChild(span);
          } else {
            td.textContent = text(cell);
          }
          tr.appendChild(td);
        });
        return tr;
      });
      renderRows(["Created", "Name", "Email", "Message", "Source", "Lang", "Sheet", "Sheet Error"], rows);
    }
    async function loadBookings() {
      $("title").textContent = "Bookings";
      $("range-caption").textContent = "Consultation requests, insurance checks, ownership, and follow-up.";
      const [data, smtp] = await Promise.all([
        api("/admin/api/bookings?limit=100"),
        api("/admin/api/smtp-status").catch((error) => ({ configured: false, missing: ["status check failed"], error: error.message })),
      ]);
      if (isMobileAdmin()) {
        renderMobileBookings(data.bookings || [], false);
        return;
      }
      const rows = data.bookings.map((booking) => {
        const parsed = parseBookingMessage(booking.message);
        const tr = document.createElement("tr");
        const cells = [
          date(booking.created_at),
          booking.service_interest,
          booking.patient_type === "returning" ? "Returning patient" : booking.patient_type === "new" ? "New patient" : "",
          booking.name,
          booking.email,
          booking.phone || parsed.phone,
          booking.age || parsed.age,
          booking.date_of_birth || parsed.dateOfBirth,
          parsed.preferredLanguage || booking.preferred_language,
          booking.availability || parsed.availability,
          booking.time_zone || parsed.timeZone,
          booking.insurance_company || parsed.insuranceCompany,
          booking.insurance_member_id || parsed.insuranceMemberId,
          booking.assigned_to,
          booking.follow_up_at ? date(booking.follow_up_at) : "",
          booking.notes,
          booking.source_page,
          booking.sheet_status,
          booking.email_status,
          booking.confirmation_email_status,
        ];
        const statusTd = document.createElement("td");
        const statusSelect = document.createElement("select");
        ["new", "contacted", "benefits_check", "scheduled", "converted", "closed"].forEach(function (status) {
          const option = document.createElement("option");
          option.value = status;
          option.textContent = status.replace("_", " ");
          option.selected = status === (booking.lead_status || "new");
          statusSelect.appendChild(option);
        });
        statusSelect.addEventListener("change", async function () {
          statusSelect.disabled = true;
          try {
            await saveBooking(booking, { leadStatus: statusSelect.value, markContacted: statusSelect.value === "contacted" });
          } catch (error) {
            alert(error.message);
          } finally {
            statusSelect.disabled = false;
          }
        });
        statusTd.appendChild(statusSelect);
        tr.appendChild(statusTd);
        cells.forEach((cell, index) => {
          const td = document.createElement("td");
          if (index === 17 || index === 18 || index === 19) {
            const span = document.createElement("span");
            span.className = "badge " + (cell === "failed" ? "failed" : "");
            span.textContent = text(cell || "unknown");
            td.appendChild(span);
          } else {
            td.textContent = text(cell);
          }
          tr.appendChild(td);
        });
        const actionTd = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit follow-up";
        editButton.style.whiteSpace = "nowrap";
        editButton.addEventListener("click", async function () {
          const assignedTo = prompt("Assigned to", booking.assigned_to || "");
          if (assignedTo === null) return;
          const followUpAt = prompt("Follow-up date/time (ISO or YYYY-MM-DD)", booking.follow_up_at || "");
          if (followUpAt === null) return;
          const notes = prompt("Internal notes", booking.notes || "");
          if (notes === null) return;
          editButton.disabled = true;
          try {
            await saveBooking(booking, { assignedTo, followUpAt, notes });
            await loadBookings();
          } catch (error) {
            alert(error.message);
          } finally {
            editButton.disabled = false;
          }
        });
        actionTd.appendChild(editButton);
        tr.appendChild(actionTd);
        return tr;
      });
      renderRows(["Status", "Created", "Service", "Patient Type", "Name", "Email", "Phone", "Age", "Date of Birth", "Preferred Language", "Available Time", "Time Zone", "Insurance Company", "Insurance ID", "Assigned", "Follow-up", "Notes", "Source", "Sheet", "Internal Email", "Confirmation Email", "Actions"], rows, smtpPanelHtml(smtp));
      bindSmtpTestButton();
    }
    async function loadClassSignups() {
      $("title").textContent = "Class Signups";
      $("range-caption").textContent = "DSMES class enrollment forms and confidentiality agreement acceptance.";
      const data = await api("/admin/api/class-signups?limit=100");
      function listValue(value) {
        if (!value) return "";
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed.join(", ");
        } catch (error) {
          return value;
        }
        return value;
      }
      if (isMobileAdmin()) {
        const signups = data.signups || [];
        $("content").innerHTML = '<div class="mobile-list">' + (signups.length ? signups.map(function (signup, index) {
          return '<article class="mobile-card"><div class="mobile-card-head"><div><h2>' + escapeHtml(signup.primary_language || "Class signup") + '</h2><div class="mobile-card-meta">' + escapeHtml(date(signup.created_at)) + '</div></div><span class="badge ' + (signup.agreement_accepted ? '' : 'failed') + '">' + (signup.agreement_accepted ? 'Accepted' : 'Agreement missing') + '</span></div><div class="mobile-card-summary"><div><span>Age</span><strong>' + escapeHtml(signup.age_range) + '</strong></div><div><span>State</span><strong>' + escapeHtml(signup.state_residence) + '</strong></div><div><span>Insurance</span><strong>' + escapeHtml(signup.has_us_health_insurance) + '</strong></div><div><span>Email status</span><strong>' + escapeHtml(signup.email_status) + '</strong></div></div><div class="mobile-card-actions"><button type="button" class="mobile-detail-button" data-signup-detail="' + index + '" style="grid-column:1/-1">View enrollment</button></div></article>';
        }).join("") : '<div class="mobile-empty">No class signups yet.</div>') + '</div>';
        document.querySelectorAll("[data-signup-detail]").forEach(function (button) {
          button.addEventListener("click", function () {
            const signup = signups[Number(button.dataset.signupDetail)];
            const files = Array.isArray(signup.files) ? signup.files : [];
            const fileLinks = files.length ? '<div class="mobile-file-actions">' + files.map(function (file) { return '<a href="/admin/api/class-signups/' + encodeURIComponent(signup.id) + '/files/' + encodeURIComponent(file.id) + '/download">Download insurance card ' + (file.kind === "back" ? "back" : "front") + '</a>'; }).join("") + '</div>' : '';
            openMobileSheet("Enrollment details", mobileDetailGrid([
              { label: "Submitted", value: date(signup.created_at), wide: true },
              { label: "Age", value: signup.age_range },
              { label: "Gender", value: signup.gender_other || signup.gender },
              { label: "Race / ethnicity", value: listValue(signup.race_ethnicity), wide: true },
              { label: "Language", value: signup.primary_language_other || signup.primary_language },
              { label: "State", value: signup.state_residence },
              { label: "Education", value: signup.education_level, wide: true },
              { label: "Insurance", value: signup.has_us_health_insurance },
              { label: "Agreement", value: signup.agreement_accepted ? "Accepted" : "Missing" },
              { label: "Conditions", value: listValue(signup.diagnosed_conditions), wide: true },
              { label: "Blood sugar monitoring", value: signup.blood_sugar_monitoring, wide: true },
              { label: "Diabetes medications", value: listValue(signup.diabetes_medications), wide: true }
            ]) + fileLinks);
          });
        });
        return;
      }
      const rows = data.signups.map((signup) => {
        const tr = document.createElement("tr");
        const agreement = signup.agreement_accepted ? "Accepted" : "Missing";
        const files = Array.isArray(signup.files) ? signup.files : [];
        const cells = [
          date(signup.created_at),
          signup.age_range,
          signup.gender,
          signup.gender_other,
          listValue(signup.race_ethnicity),
          signup.primary_language,
          signup.primary_language_other,
          signup.state_residence,
          signup.education_level,
          signup.has_us_health_insurance,
          listValue(signup.diagnosed_conditions),
          signup.blood_sugar_monitoring,
          listValue(signup.diabetes_medications),
          files,
          agreement,
          signup.agreement_version,
          date(signup.agreement_accepted_at),
          signup.email_status,
          signup.email_error,
        ];
        cells.forEach((cell, index) => {
          const td = document.createElement("td");
          if ([4, 10, 12, 18].includes(index)) td.className = "message";
          if (index === 13) {
            if (!cell.length) {
              td.textContent = "Not uploaded";
            } else {
              const links = document.createElement("div");
              links.className = "file-links";
              cell.forEach(function (file) {
                const link = document.createElement("a");
                link.className = "file-link";
                link.href = "/admin/api/class-signups/" + encodeURIComponent(signup.id) + "/files/" + encodeURIComponent(file.id) + "/download";
                link.textContent = file.kind === "back" ? "Download back" : "Download front";
                links.appendChild(link);
              });
              td.appendChild(links);
            }
          } else if (index === 14 || index === 17) {
            const span = document.createElement("span");
            span.className = "badge " + (cell === "failed" || cell === "Missing" ? "failed" : "");
            span.textContent = text(cell);
            td.appendChild(span);
          } else {
            td.textContent = text(cell);
          }
          tr.appendChild(td);
        });
        return tr;
      });
      renderRows(["Created", "Age", "Gender", "Gender Other", "Race/Ethnicity", "Language", "Language Other", "State", "Education", "Insurance", "Conditions", "Blood Sugar Monitoring", "Diabetes Medications", "Insurance Card", "Agreement", "Agreement Version", "Accepted At", "Email", "Email Error"], rows);
    }
    async function loadMembers() {
      $("title").textContent = "Members";
      $("range-caption").textContent = "";
      const data = await api("/admin/api/members?limit=100");
      if (isMobileAdmin()) {
        const members = data.members || [];
        $("content").innerHTML = '<div class="mobile-list">' + (members.length ? members.map(function (member) { const name = [member.first_name, member.last_name].filter(Boolean).join(" ") || member.email; return '<article class="mobile-card"><div class="mobile-card-head"><div><h2>' + escapeHtml(name) + '</h2><div class="mobile-card-meta">Joined ' + escapeHtml(date(member.created_at)) + '</div></div></div><div class="mobile-card-summary"><div><span>Email</span><strong>' + escapeHtml(member.email) + '</strong></div><div><span>Phone</span><strong>' + escapeHtml(member.phone) + '</strong></div><div><span>Language</span><strong>' + escapeHtml(member.preferred_language) + '</strong></div><div><span>Marketing</span><strong>' + (member.marketing_opt_in ? 'Yes' : 'No') + '</strong></div></div><div class="mobile-card-actions">' + (member.phone ? '<a href="' + phoneHref(member.phone) + '">Call</a>' : '<button disabled>Call</button>') + '<a href="mailto:' + escapeHtml(member.email) + '" style="grid-column:span 2">Email</a></div></article>'; }).join("") : '<div class="mobile-empty">No members yet.</div>') + '</div>';
        return;
      }
      const rows = data.members.map((member) => {
        const tr = document.createElement("tr");
        [date(member.created_at), member.email, member.phone, [member.first_name, member.last_name].filter(Boolean).join(" "), member.preferred_language, member.marketing_opt_in ? "Yes" : "No"].forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = text(cell);
          tr.appendChild(td);
        });
        return tr;
      });
      renderRows(["Created", "Email", "Phone", "Name", "Lang", "Marketing"], rows);
    }
    async function load() {
      if (isMobileAdmin() && state.view === "overview") return loadMobileOverview();
      if (state.view === "members") return loadMembers();
      if (state.view === "leads") return loadLeads();
      if (state.view === "bookings") return loadBookings();
      if (state.view === "whatsapp") return loadWhatsappClicks();
      if (state.view === "kalix") return loadKalixClicks();
      if (state.view === "communityInquiries") return loadCommunityInquiries();
      if (state.view === "classSignups") return loadClassSignups();
      if (state.view === "ads") return renderAds();
      return loadAnalyticsView();
    }
    $("login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      $("login-error").textContent = "";
      $("login-button").disabled = true;
      try {
        const data = await api("/admin/api/login", { method: "POST", body: JSON.stringify({ email: $("email").value, password: $("password").value }) });
        state.admin = data.admin;
        showApp();
        await load();
      } catch (error) {
        $("login-error").textContent = error.message;
      } finally {
        $("login-button").disabled = false;
      }
    });
    document.querySelectorAll("[data-view]").forEach(function (button) { button.addEventListener("click", function () { setView(button.dataset.view); }); });
    document.querySelectorAll("[data-mobile-view]").forEach(function (button) { button.addEventListener("click", function () { setView(button.dataset.mobileView); }); });
    $("mobile-more").addEventListener("click", function () {
      openMobileSheet("More", '<div class="mobile-menu"><button type="button" data-more-view="communityInquiries">Community inquiries</button><button type="button" data-more-view="whatsapp">WhatsApp opens</button><button type="button" data-more-view="kalix">Kalix opens</button><button type="button" data-more-view="leads">Contact leads</button><button type="button" data-more-view="members">Members</button><button type="button" id="mobile-email-system">Email system</button><button type="button" class="danger" id="mobile-sign-out">Sign out</button></div><div class="mobile-detail-note">Signed in as ' + escapeHtml(state.admin?.email || "") + '</div>');
      document.querySelectorAll("[data-more-view]").forEach(function (button) { button.addEventListener("click", function () { setView(button.dataset.moreView); }); });
      $("mobile-email-system").addEventListener("click", openMobileEmailSystem);
      $("mobile-sign-out").addEventListener("click", function () { $("logout").click(); });
    });
    $("mobile-sheet-close").addEventListener("click", closeMobileSheet);
    $("mobile-sheet-backdrop").addEventListener("click", closeMobileSheet);
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeMobileSheet(); });
    $("today").addEventListener("click", async () => { setRange(1); await load(); });
    $("last-7").addEventListener("click", async () => { setRange(7); await load(); });
    $("last-30").addEventListener("click", async () => { setRange(30); await load(); });
    $("start-date").addEventListener("change", load);
    $("end-date").addEventListener("change", load);
    $("refresh").addEventListener("click", load);
    $("logout").addEventListener("click", async () => { await api("/admin/api/logout", { method: "POST" }).catch(() => {}); state.admin = null; showLogin(); });
    window.addEventListener("resize", function () {
      if (!isMobileAdmin() && state.view === "overview") { state.view = "dashboard"; syncChrome(); load(); return; }
      syncChrome();
    });
    setRange(30);
    api("/admin/api/me").then(async (data) => { state.admin = data.admin; if (state.admin) { showApp(); await load(); } else showLogin(); }).catch(showLogin);
  </script>
</body>
</html>`,
  );
}
