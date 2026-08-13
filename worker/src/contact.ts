import { badRequest, json, readJson, serverError } from "./http";
import { randomId } from "./crypto";
import { getDb } from "./db";
import { appendContactToSheet } from "./googleSheets";
import { checkRateLimit } from "./rateLimit";
import { sendSmtpEmail } from "./smtp";
import type { Env } from "./types";

type ContactPayload = {
  name?: string;
  email?: string;
  phone?: string;
  age?: string | number;
  preferredLanguage?: string;
  availability?: string;
  patientType?: string;
  sourcePage?: string;
  serviceInterest?: string;
  pageLanguage?: string;
  timeZone?: string;
  insuranceCompany?: string;
  insuranceMemberId?: string;
  dateOfBirth?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clean(value: unknown, length: number) {
  return typeof value === "string" ? value.trim().slice(0, length) : "";
}

function internalEmailBody(input: {
  leadId: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  preferredLanguage: string;
  availability: string;
  patientType: string;
  serviceInterest: string;
  timeZone: string;
  insuranceCompany: string;
  sourcePage: string;
  adminUrl: string;
}) {
  return [
    "A new NutriAll consultation request was submitted.",
    "",
    `Lead ID: ${input.leadId}`,
    `Submitted: ${input.createdAt}`,
    `Service: ${input.serviceInterest}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone}`,
    `Age: ${input.age}`,
    `Preferred language: ${input.preferredLanguage}`,
    `Available time: ${input.availability}`,
    `Patient type: ${input.patientType === "returning" ? "Returning patient" : "New patient"}`,
    `Time zone: ${input.timeZone || "-"}`,
    `Insurance company: ${input.insuranceCompany || "-"}`,
    `Source page: ${input.sourcePage || "-"}`,
    "",
    "Member ID and date of birth are available only in the secure admin dashboard.",
    `Admin: ${input.adminUrl}`,
  ].join("\n");
}

function confirmationEmailBody(name: string, patientType: string) {
  return [
    `Hi ${name},`,
    "",
    "We received your request for a free 15-minute NutriAll consultation.",
    `Patient type: ${patientType === "returning" ? "Returning patient" : "New patient"}`,
    "Our care team will review the information you provided and contact you about insurance benefits and the next available time.",
    "",
    "Please do not reply with urgent medical concerns or additional insurance details. Call emergency services for a medical emergency.",
    "",
    "NutriAll Weight & Nutrition Care",
  ].join("\n");
}

export async function submitContact(request: Request, env: Env, ctx?: ExecutionContext) {
  const rateLimited = checkRateLimit(request, env, "contact", 5, 60);
  if (rateLimited) return rateLimited;

  const payload = await readJson<ContactPayload>(request);
  if (!payload) return badRequest(request, env, "Invalid JSON body");

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 254).toLowerCase();
  const phone = clean(payload.phone, 40);
  const age = Number(payload.age);
  const preferredLanguage = clean(payload.preferredLanguage, 40);
  const availability = clean(payload.availability, 40);
  const patientType = clean(payload.patientType, 20);
  const sourcePage = clean(payload.sourcePage, 300);
  const serviceInterest = clean(payload.serviceInterest, 100) || "General consultation";
  const pageLanguage = clean(payload.pageLanguage, 16);
  const cf = request.cf as { timezone?: string } | undefined;
  const timeZone = (clean(payload.timeZone, 80) || cf?.timezone || "").slice(0, 80);
  const insuranceCompany = clean(payload.insuranceCompany, 120);
  const insuranceMemberId = clean(payload.insuranceMemberId, 120);
  const dateOfBirth = clean(payload.dateOfBirth, 32);
  const utmSource = clean(payload.utmSource, 120);
  const utmMedium = clean(payload.utmMedium, 120);
  const utmCampaign = clean(payload.utmCampaign, 160);

  if (name.length < 2) return badRequest(request, env, "Name is required");
  if (!validEmail(email)) return badRequest(request, env, "Valid email is required");
  if (phone.length < 7) return badRequest(request, env, "Valid phone is required");
  if (!Number.isInteger(age) || age < 1 || age > 120) return badRequest(request, env, "Valid age is required");
  if (!preferredLanguage) return badRequest(request, env, "Preferred language is required");
  if (!availability) return badRequest(request, env, "Availability is required");
  if (!["new", "returning"].includes(patientType)) return badRequest(request, env, "Patient type is required");

  const now = new Date().toISOString();
  const leadId = randomId("lead_");
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const userAgent = request.headers.get("User-Agent") || "";
  const message = [
    "Booking request: free 15-minute insurance and care consultation",
    `Service: ${serviceInterest}`,
    `Phone: ${phone}`,
    `Age: ${age}`,
    `Preferred language: ${preferredLanguage}`,
    `Available time: ${availability}`,
    `Patient type: ${patientType}`,
  ].join("\n");
  const sheetRow = [now, "NutriAll", serviceInterest, name, email, phone, String(age), preferredLanguage, availability, timeZone, sourcePage, [utmSource, utmMedium, utmCampaign].filter(Boolean).join(" / "), patientType === "returning" ? "Returning patient" : "New patient"];
  let sheetStatus = env.GOOGLE_SHEETS_SPREADSHEET_ID ? "pending" : "not_configured";
  let sheetError: string | null = null;

  try {
    if (env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      try {
        await appendContactToSheet(env, sheetRow);
        sheetStatus = "synced";
      } catch (error) {
        sheetStatus = "failed";
        sheetError = error instanceof Error ? error.message.slice(0, 500) : "Google Sheets append failed";
        console.error("Google Sheets contact append failed", sheetError);
      }
    }

    const db = getDb(env);
    await db.prepare(
      `INSERT INTO contact_leads
       (id, name, email, phone, age, message, source_page, preferred_language, availability, service_interest,
        patient_type, page_language, time_zone, insurance_company, insurance_member_id, date_of_birth, utm_source, utm_medium,
        utm_campaign, ip, user_agent, sheet_status, sheet_error, email_status, confirmation_email_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)`,
    ).bind(
      leadId, name, email, phone, age, message, sourcePage, preferredLanguage, availability, serviceInterest,
      patientType, pageLanguage, timeZone, insuranceCompany, insuranceMemberId, dateOfBirth, utmSource, utmMedium,
      utmCampaign, ip, userAgent, sheetStatus, sheetError, now, now,
    ).run();

    const adminUrl = env.ADMIN_URL || `${new URL(request.url).origin}/admin/`;
    const internalNotification = sendSmtpEmail(env, {
      subject: `New NutriAll consultation request from ${name}`,
      replyTo: email,
      text: internalEmailBody({ leadId, createdAt: now, name, email, phone, age, preferredLanguage, availability, patientType, serviceInterest, timeZone, insuranceCompany, sourcePage, adminUrl }),
    }).then(async (result) => {
      const status = result.skipped ? "skipped" : "sent";
      const error = result.skipped ? `Missing SMTP config: ${(result.missing || []).join(", ")}`.slice(0, 500) : null;
      const notifiedAt = new Date().toISOString();
      await db.prepare("UPDATE contact_leads SET email_status = ?, email_error = ?, email_notified_at = ?, updated_at = ? WHERE id = ?")
        .bind(status, error, notifiedAt, notifiedAt, leadId).run();
    }).catch(async (error) => {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Booking notification email failed";
      const notifiedAt = new Date().toISOString();
      await db.prepare("UPDATE contact_leads SET email_status = 'failed', email_error = ?, email_notified_at = ?, updated_at = ? WHERE id = ?")
        .bind(message, notifiedAt, notifiedAt, leadId).run();
    });

    const patientConfirmation = sendSmtpEmail(env, {
      to: email,
      subject: "We received your NutriAll consultation request",
      replyTo: env.BOOKING_NOTIFY_TO,
      text: confirmationEmailBody(name, patientType),
    }).then(async (result) => {
      const status = result.skipped ? "skipped" : "sent";
      const error = result.skipped ? `Missing SMTP config: ${(result.missing || []).join(", ")}`.slice(0, 500) : null;
      const sentAt = new Date().toISOString();
      await db.prepare("UPDATE contact_leads SET confirmation_email_status = ?, confirmation_email_error = ?, confirmation_email_sent_at = ?, updated_at = ? WHERE id = ?")
        .bind(status, error, sentAt, sentAt, leadId).run();
    }).catch(async (error) => {
      const message = error instanceof Error ? error.message.slice(0, 500) : "Patient confirmation email failed";
      const sentAt = new Date().toISOString();
      await db.prepare("UPDATE contact_leads SET confirmation_email_status = 'failed', confirmation_email_error = ?, confirmation_email_sent_at = ?, updated_at = ? WHERE id = ?")
        .bind(message, sentAt, sentAt, leadId).run();
    });

    const notifications = Promise.all([internalNotification, patientConfirmation]);
    if (ctx) ctx.waitUntil(notifications);
    else await notifications;

    return json(request, env, { ok: true, id: leadId, sheetStatus });
  } catch (error) {
    if (sheetStatus === "synced") {
      console.error("Contact lead D1 backup failed after Google Sheets sync", error);
      return json(request, env, { ok: true, id: leadId, sheetStatus });
    }
    return serverError(request, env, error instanceof Error ? error.message : undefined);
  }
}
