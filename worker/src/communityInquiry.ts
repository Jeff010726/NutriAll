import { randomId } from "./crypto";
import { getDb } from "./db";
import { badRequest, json, readJson, serverError } from "./http";
import { checkRateLimit } from "./rateLimit";
import { sendSmtpEmail } from "./smtp";
import type { Env } from "./types";

type CommunityInquiryPayload = {
  organization?: string;
  organizationType?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  audienceSize?: string;
  audienceAge?: string;
  language?: string;
  topic?: string;
  format?: string;
  delivery?: string;
  preferredDate?: string;
  location?: string;
  budget?: string;
  notes?: string;
  consent?: boolean;
  pageLanguage?: string;
  timeZone?: string;
  sourcePage?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
};

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitCommunityInquiry(request: Request, env: Env, ctx?: ExecutionContext) {
  const rateLimited = checkRateLimit(request, env, "community_inquiry", 4, 60);
  if (rateLimited) return rateLimited;
  const payload = await readJson<CommunityInquiryPayload>(request);
  if (!payload) return badRequest(request, env, "Invalid JSON body");

  const organization = clean(payload.organization, 160);
  const organizationType = clean(payload.organizationType, 100);
  const contactName = clean(payload.contactName, 120);
  const email = clean(payload.email, 254).toLowerCase();
  const phone = clean(payload.phone, 40);
  const audienceSize = clean(payload.audienceSize, 80);
  const audienceAge = clean(payload.audienceAge, 100);
  const language = clean(payload.language, 100);
  const topic = clean(payload.topic, 1000);
  const format = clean(payload.format, 100);
  const delivery = clean(payload.delivery, 60);
  const preferredDate = clean(payload.preferredDate, 160);
  const location = clean(payload.location, 240);
  const budget = clean(payload.budget, 120);
  const notes = clean(payload.notes, 2000);
  if (!organization || !organizationType || !contactName || !validEmail(email) || phone.length < 7 || !audienceSize || !audienceAge || !language || !topic || !format || !delivery || !preferredDate || !payload.consent) {
    return badRequest(request, env, "Please complete all required fields");
  }

  const now = new Date().toISOString();
  const id = randomId("org_");
  const pageLanguage = clean(payload.pageLanguage, 16);
  const timeZone = clean(payload.timeZone, 80);
  const sourcePage = clean(payload.sourcePage, 300);
  const utmSource = clean(payload.utmSource, 120);
  const utmMedium = clean(payload.utmMedium, 120);
  const utmCampaign = clean(payload.utmCampaign, 160);
  const utmContent = clean(payload.utmContent, 160);
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const userAgent = request.headers.get("User-Agent") || "";

  try {
    const db = getDb(env);
    await db.prepare(
      `INSERT INTO community_inquiries
       (id, organization, organization_type, contact_name, email, phone, audience_size, audience_age,
        preferred_language, topic, program_format, delivery, preferred_date, location, budget, notes,
        consent_accepted, page_language, time_zone, source_page, utm_source, utm_medium, utm_campaign,
        utm_content, ip, user_agent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, organization, organizationType, contactName, email, phone, audienceSize, audienceAge, language, topic, format, delivery, preferredDate, location, budget, notes, pageLanguage, timeZone, sourcePage, utmSource, utmMedium, utmCampaign, utmContent, ip, userAgent, now, now).run();

    const details = [
      "A new NutriAll community program request was submitted.", "", `Organization: ${organization}`, `Organization type: ${organizationType}`,
      `Contact: ${contactName}`, `Email: ${email}`, `Phone: ${phone}`, `Estimated attendance: ${audienceSize}`, `Audience: ${audienceAge}`,
      `Language: ${language}`, `Format: ${format}`, `Delivery: ${delivery}`, `Preferred date: ${preferredDate}`, `Location: ${location || "-"}`,
      `Budget: ${budget || "-"}`, `Topics: ${topic}`, `Notes: ${notes || "-"}`, "", `Admin: ${env.ADMIN_URL || "https://admin.nutriallwellness.org"}`,
    ].join("\n");
    const internal = sendSmtpEmail(env, { subject: `Community program request from ${organization}`, replyTo: email, text: details })
      .then(async (result) => db.prepare("UPDATE community_inquiries SET email_status = ?, email_error = ?, updated_at = ? WHERE id = ?").bind(result.skipped ? "skipped" : "sent", result.skipped ? `Missing SMTP config: ${(result.missing || []).join(", ")}`.slice(0, 500) : null, new Date().toISOString(), id).run())
      .catch(async (error) => db.prepare("UPDATE community_inquiries SET email_status = 'failed', email_error = ?, updated_at = ? WHERE id = ?").bind(error instanceof Error ? error.message.slice(0, 500) : "Email failed", new Date().toISOString(), id).run());
    const confirmation = sendSmtpEmail(env, { to: email, subject: "We received your NutriAll community program request", replyTo: env.BOOKING_NOTIFY_TO, text: `Hi ${contactName},\n\nWe received the program request for ${organization}. Our team will review the audience, format, language, timing, and other details, then contact you about availability and next steps.\n\nNutriAll Wellness` })
      .then(async (result) => db.prepare("UPDATE community_inquiries SET confirmation_email_status = ?, confirmation_email_error = ?, updated_at = ? WHERE id = ?").bind(result.skipped ? "skipped" : "sent", result.skipped ? `Missing SMTP config: ${(result.missing || []).join(", ")}`.slice(0, 500) : null, new Date().toISOString(), id).run())
      .catch(async (error) => db.prepare("UPDATE community_inquiries SET confirmation_email_status = 'failed', confirmation_email_error = ?, updated_at = ? WHERE id = ?").bind(error instanceof Error ? error.message.slice(0, 500) : "Confirmation failed", new Date().toISOString(), id).run());
    const notifications = Promise.all([internal, confirmation]);
    if (ctx) ctx.waitUntil(notifications); else await notifications;
    return json(request, env, { ok: true, id });
  } catch (error) {
    return serverError(request, env, error instanceof Error ? error.message : undefined);
  }
}
