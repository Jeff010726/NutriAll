import { randomId } from "./crypto";
import { getCurrentUser } from "./auth";
import { adminJson, requireAdmin } from "./admin";
import { getDb } from "./db";
import { badRequest, json, readJson } from "./http";
import { checkRateLimit } from "./rateLimit";
import type { Env, JsonValue } from "./types";

type AnalyticsPayload = {
  eventType?: string;
  eventName?: string;
  path?: string;
  pageTitle?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  device?: string;
  browser?: string;
  language?: string;
  sessionId?: string;
  visitorId?: string;
  metadata?: Record<string, JsonValue>;
};

function trim(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "{}";
  return JSON.stringify(metadata).slice(0, 2000);
}

function dateRange(url: URL) {
  const now = new Date();
  const endParam = url.searchParams.get("end");
  const startParam = url.searchParams.get("start");
  const end = endParam ? new Date(`${endParam}T23:59:59.999Z`) : now;
  const start = startParam ? new Date(`${startParam}T00:00:00.000Z`) : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  const safeEnd = Number.isNaN(end.getTime()) ? now : end;
  const safeStart = Number.isNaN(start.getTime()) ? new Date(safeEnd.getTime() - 29 * 24 * 60 * 60 * 1000) : start;
  const orderedStart = safeStart > safeEnd ? safeEnd : safeStart;
  const orderedEnd = safeStart > safeEnd ? safeStart : safeEnd;
  const duration = orderedEnd.getTime() - orderedStart.getTime();
  const previousEnd = new Date(orderedStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return {
    start: orderedStart.toISOString(),
    end: orderedEnd.toISOString(),
    previousStart: previousStart.toISOString(),
    previousEnd: previousEnd.toISOString(),
    granularity: orderedStart.toISOString().slice(0, 10) === orderedEnd.toISOString().slice(0, 10) ? "hour" : "day",
  };
}

type TimelineRow = {
  date?: string;
  pageViews?: number;
  visitors?: number;
  sessions?: number;
  bookingClicks?: number;
  externalClicks?: number;
  whatsappOpens?: number;
  kalixOpens?: number;
  communityInquiries?: number;
  xtReferrals?: number;
  contactSubmits?: number;
  registrations?: number;
};

async function count(db: D1Database, sql: string, start: string, end: string) {
  const row = await db.prepare(sql).bind(start, end).first<{ count: number }>();
  return row?.count || 0;
}

function pctChange(value: number, previous: number) {
  if (!previous && !value) return 0;
  if (!previous) return 100;
  return Number((((value - previous) / previous) * 100).toFixed(1));
}

function metric(value: number, previous: number) {
  return { value, previous, change: pctChange(value, previous) };
}

function percent(numerator: number, denominator: number) {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}

function sourceChannelCase() {
  return `CASE
    WHEN NULLIF(utm_source, '') IS NOT NULL OR NULLIF(utm_medium, '') IS NOT NULL OR NULLIF(utm_campaign, '') IS NOT NULL THEN 'Campaign'
    WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
    WHEN lower(referrer) LIKE '%google.%' OR lower(referrer) LIKE '%bing.%' OR lower(referrer) LIKE '%yahoo.%' OR lower(referrer) LIKE '%duckduckgo.%' THEN 'Search'
    WHEN lower(referrer) LIKE '%facebook.%' OR lower(referrer) LIKE '%instagram.%' OR lower(referrer) LIKE '%linkedin.%' OR lower(referrer) LIKE '%x.com%' OR lower(referrer) LIKE '%twitter.%' OR lower(referrer) LIKE '%tiktok.%' THEN 'Social'
    ELSE 'Referral'
  END`;
}

function leadInsight(label: string, current: number, previous: number) {
  const change = pctChange(current, previous);
  if (current === 0 && previous === 0) return `${label} has no activity in this period.`;
  if (change > 0) return `${label} is up ${change}% vs previous period.`;
  if (change < 0) return `${label} is down ${Math.abs(change)}% vs previous period.`;
  return `${label} is flat vs previous period.`;
}

function fillTimeline(rows: TimelineRow[], start: string, end: string, granularity: string) {
  const byDate = new Map(rows.map((row) => [String(row.date), row]));
  const output: Required<TimelineRow>[] = [];
  const cursor = new Date(start);
  const stop = new Date(end);

  if (granularity === "hour") {
    cursor.setUTCMinutes(0, 0, 0);
    stop.setUTCMinutes(0, 0, 0);
  } else {
    cursor.setUTCHours(0, 0, 0, 0);
    stop.setUTCHours(0, 0, 0, 0);
  }

  while (cursor <= stop) {
    const key =
      granularity === "hour"
        ? `${cursor.toISOString().slice(0, 13)}:00`
        : cursor.toISOString().slice(0, 10);
    const row = byDate.get(key);
    output.push({
      date: key,
      pageViews: Number(row?.pageViews || 0),
      visitors: Number(row?.visitors || 0),
      sessions: Number(row?.sessions || 0),
      bookingClicks: Number(row?.bookingClicks || 0),
      externalClicks: Number(row?.externalClicks || 0),
      whatsappOpens: Number(row?.whatsappOpens || 0),
      kalixOpens: Number(row?.kalixOpens || 0),
      communityInquiries: Number(row?.communityInquiries || 0),
      xtReferrals: Number(row?.xtReferrals || 0),
      contactSubmits: Number(row?.contactSubmits || 0),
      registrations: Number(row?.registrations || 0),
    });
    if (granularity === "hour") cursor.setUTCHours(cursor.getUTCHours() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return output;
}

export async function collectAnalytics(request: Request, env: Env) {
  const rateLimited = checkRateLimit(request, env, "analytics", 180, 60);
  if (rateLimited) return rateLimited;

  const payload = await readJson<AnalyticsPayload>(request);
  if (!payload) return badRequest(request, env, "Invalid JSON body");

  const eventType = trim(payload.eventType, 64);
  if (!eventType) return badRequest(request, env, "eventType is required");

  const user = await getCurrentUser(request, env).catch(() => null);
  const cf = request.cf || {};

  await getDb(env)
    .prepare(
      `INSERT INTO analytics_events
       (id, event_type, event_name, path, page_title, referrer, utm_source, utm_medium, utm_campaign, utm_content,
        country, region, city, timezone, colo, device, browser, language, session_id, visitor_id, member_id, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      randomId("evt_"),
      eventType,
      trim(payload.eventName, 120) || null,
      trim(payload.path, 300) || null,
      trim(payload.pageTitle, 200) || null,
      trim(payload.referrer, 500) || null,
      trim(payload.utmSource, 120) || null,
      trim(payload.utmMedium, 120) || null,
      trim(payload.utmCampaign, 160) || null,
      trim(payload.utmContent, 160) || null,
      trim(cf.country, 8) || null,
      trim(cf.region, 120) || null,
      trim(cf.city, 120) || null,
      trim(cf.timezone, 80) || null,
      trim(cf.colo, 16) || null,
      trim(payload.device, 40) || null,
      trim(payload.browser, 80) || null,
      trim(payload.language, 40) || null,
      trim(payload.sessionId, 120) || null,
      trim(payload.visitorId, 120) || null,
      user ? String(user.id) : null,
      safeMetadata(payload.metadata),
      new Date().toISOString(),
    )
    .run();

  return json(request, env, { ok: true });
}

export async function adminAnalyticsDashboard(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const { start, end, previousStart, previousEnd, granularity } = dateRange(url);
  const db = getDb(env);
  const sourceCase = sourceChannelCase();
  const timelineBucket = granularity === "hour" ? "substr(created_at, 1, 13) || ':00'" : "substr(created_at, 1, 10)";

  const [
    pageViews,
    previousPageViews,
    visitors,
    previousVisitors,
    sessions,
    previousSessions,
    bookingClicks,
    previousBookingClicks,
    ctaClicks,
    previousCtaClicks,
    contactSubmits,
    previousContactSubmits,
    memberRegisters,
    previousMemberRegisters,
    leads,
    previousLeads,
    registrations,
    previousRegistrations,
    topPages,
    landingPages,
    topCountries,
    topRegions,
    topCities,
    topReferrers,
    sourceChannels,
    topDevices,
    topBrowsers,
    timeline,
  ] = await Promise.all([
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'page_view' AND created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'page_view' AND created_at BETWEEN ? AND ?", previousStart, previousEnd),
    count(db, "SELECT COUNT(DISTINCT visitor_id) AS count FROM analytics_events WHERE visitor_id IS NOT NULL AND created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(DISTINCT visitor_id) AS count FROM analytics_events WHERE visitor_id IS NOT NULL AND created_at BETWEEN ? AND ?", previousStart, previousEnd),
    count(db, "SELECT COUNT(DISTINCT session_id) AS count FROM analytics_events WHERE session_id IS NOT NULL AND created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(DISTINCT session_id) AS count FROM analytics_events WHERE session_id IS NOT NULL AND created_at BETWEEN ? AND ?", previousStart, previousEnd),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'booking_click' AND created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'booking_click' AND created_at BETWEEN ? AND ?", previousStart, previousEnd),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'cta_click' AND created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'cta_click' AND created_at BETWEEN ? AND ?", previousStart, previousEnd),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'contact_submit' AND created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'contact_submit' AND created_at BETWEEN ? AND ?", previousStart, previousEnd),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'member_register' AND created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type = 'member_register' AND created_at BETWEEN ? AND ?", previousStart, previousEnd),
    count(db, "SELECT COUNT(*) AS count FROM contact_leads WHERE created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(*) AS count FROM contact_leads WHERE created_at BETWEEN ? AND ?", previousStart, previousEnd),
    count(db, "SELECT COUNT(*) AS count FROM users WHERE created_at BETWEEN ? AND ?", start, end),
    count(db, "SELECT COUNT(*) AS count FROM users WHERE created_at BETWEEN ? AND ?", previousStart, previousEnd),
    db.prepare(
      `SELECT COALESCE(path, '/') AS label,
              COUNT(*) AS pageViews,
              COUNT(DISTINCT visitor_id) AS visitors
       FROM analytics_events
       WHERE event_type = 'page_view' AND created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY pageViews DESC
       LIMIT 8`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(path, '/') AS label,
              COUNT(DISTINCT session_id) AS sessions
       FROM analytics_events
       WHERE event_type = 'page_view' AND created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY sessions DESC
       LIMIT 8`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(country, 'Unknown') AS label, COUNT(*) AS count
       FROM analytics_events
       WHERE created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY count DESC
       LIMIT 8`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(region, 'Unknown') AS label, COUNT(*) AS count
       FROM analytics_events
       WHERE created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY count DESC
       LIMIT 8`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(city, 'Unknown') AS label, COUNT(*) AS count
       FROM analytics_events
       WHERE created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY count DESC
       LIMIT 8`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(NULLIF(referrer, ''), 'Direct') AS label, COUNT(*) AS count
       FROM analytics_events
       WHERE event_type = 'page_view' AND created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY count DESC
       LIMIT 8`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT ${sourceCase} AS label, COUNT(*) AS count
       FROM analytics_events
       WHERE event_type = 'page_view' AND created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY count DESC`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(device, 'Unknown') AS label, COUNT(*) AS count
       FROM analytics_events
       WHERE created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY count DESC
       LIMIT 8`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(browser, 'Unknown') AS label, COUNT(*) AS count
       FROM analytics_events
       WHERE created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY count DESC
       LIMIT 8`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT ${timelineBucket} AS date,
              SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS pageViews,
              COUNT(DISTINCT visitor_id) AS visitors,
              COUNT(DISTINCT session_id) AS sessions,
              SUM(CASE WHEN event_type = 'booking_click' THEN 1 ELSE 0 END) AS bookingClicks,
              SUM(CASE WHEN event_type = 'contact_submit' THEN 1 ELSE 0 END) AS contactSubmits,
              SUM(CASE WHEN event_type = 'member_register' THEN 1 ELSE 0 END) AS registrations
       FROM analytics_events
       WHERE created_at BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC`,
    ).bind(start, end).all(),
  ]);

  const bookingRate = percent(bookingClicks, sessions || pageViews);
  const previousBookingRate = percent(previousBookingClicks, previousSessions || previousPageViews);
  const leadRate = percent(leads, sessions || pageViews);
  const previousLeadRate = percent(previousLeads, previousSessions || previousPageViews);
  const registrationRate = percent(registrations, sessions || pageViews);
  const previousRegistrationRate = percent(previousRegistrations, previousSessions || previousPageViews);
  const currentTimeline = fillTimeline((timeline.results || []) as TimelineRow[], start, end, granularity);

  return adminJson(request, env, {
    range: { start, end, previousStart, previousEnd, granularity },
    metrics: {
      visitors: metric(visitors, previousVisitors),
      sessions: metric(sessions, previousSessions),
      pageViews: metric(pageViews, previousPageViews),
      bookingClicks: metric(bookingClicks, previousBookingClicks),
      ctaClicks: metric(ctaClicks, previousCtaClicks),
      contactSubmits: metric(contactSubmits, previousContactSubmits),
      memberRegisters: metric(memberRegisters, previousMemberRegisters),
      leads: metric(leads, previousLeads),
      registrations: metric(registrations, previousRegistrations),
      bookingRate: metric(bookingRate, previousBookingRate),
      leadRate: metric(leadRate, previousLeadRate),
      registrationRate: metric(registrationRate, previousRegistrationRate),
    },
    insights: [
      leadInsight("Visitors", visitors, previousVisitors),
      leadInsight("Page views", pageViews, previousPageViews),
      topPages.results?.[0] ? `${String((topPages.results[0] as { label?: string }).label || "/")} is the top page by views.` : "No top page yet.",
      sourceChannels.results?.[0] ? `${String((sourceChannels.results[0] as { label?: string }).label || "Direct")} is the leading traffic source.` : "No source data yet.",
    ],
    funnel: [
      { label: "Sessions", value: sessions },
      { label: "Booking clicks", value: bookingClicks },
      { label: "Contact leads", value: leads },
      { label: "Registrations", value: registrations },
    ],
    sparklines: {
      visitors: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.visitors || 0) })),
      pageViews: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.pageViews || 0) })),
      sessions: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.sessions || 0) })),
      bookingClicks: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.bookingClicks || 0) })),
      leads: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.contactSubmits || 0) })),
      registrations: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.registrations || 0) })),
    },
    topPages: topPages.results || [],
    landingPages: landingPages.results || [],
    topCountries: topCountries.results || [],
    topRegions: topRegions.results || [],
    topCities: topCities.results || [],
    topReferrers: topReferrers.results || [],
    sourceChannels: sourceChannels.results || [],
    topDevices: topDevices.results || [],
    topBrowsers: topBrowsers.results || [],
    timeline: currentTimeline,
  });
}

export async function adminAdsAnalytics(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const { start, end, previousStart, previousEnd, granularity } = dateRange(url);
  const db = getDb(env);
  const timelineBucket = granularity === "hour" ? "substr(created_at, 1, 13) || ':00'" : "substr(created_at, 1, 10)";
  const adWhere = "(NULLIF(utm_source, '') IS NOT NULL OR NULLIF(utm_medium, '') IS NOT NULL OR NULLIF(utm_campaign, '') IS NOT NULL OR NULLIF(utm_content, '') IS NOT NULL)";

  const metricSql = (condition: string) => `SELECT COUNT(*) AS count FROM analytics_events WHERE ${adWhere} AND ${condition} AND created_at BETWEEN ? AND ?`;
  const distinctSql = (field: string) => `SELECT COUNT(DISTINCT ${field}) AS count FROM analytics_events WHERE ${adWhere} AND ${field} IS NOT NULL AND created_at BETWEEN ? AND ?`;

  const [
    visitors,
    previousVisitors,
    sessions,
    previousSessions,
    pageViews,
    previousPageViews,
    bookingPageClicks,
    previousBookingPageClicks,
    externalClicks,
    previousExternalClicks,
    whatsappOpens,
    previousWhatsappOpens,
    kalixOpens,
    previousKalixOpens,
    communityInquiries,
    previousCommunityInquiries,
    xtReferrals,
    previousXtReferrals,
    contactSubmits,
    previousContactSubmits,
    memberSignups,
    previousMemberSignups,
    campaigns,
    contents,
    landingPages,
    timeline,
    recentEvents,
  ] = await Promise.all([
    count(db, distinctSql("visitor_id"), start, end),
    count(db, distinctSql("visitor_id"), previousStart, previousEnd),
    count(db, distinctSql("session_id"), start, end),
    count(db, distinctSql("session_id"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'page_view'"), start, end),
    count(db, metricSql("event_type = 'page_view'"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'booking_click' AND event_name = 'book_link'"), start, end),
    count(db, metricSql("event_type = 'booking_click' AND event_name = 'book_link'"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'booking_click' AND event_name = 'booking_form_success'"), start, end),
    count(db, metricSql("event_type = 'booking_click' AND event_name = 'booking_form_success'"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'whatsapp_booking_click'"), start, end),
    count(db, metricSql("event_type = 'whatsapp_booking_click'"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'kalix_booking_click'"), start, end),
    count(db, metricSql("event_type = 'kalix_booking_click'"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'community_inquiry_submit'"), start, end),
    count(db, metricSql("event_type = 'community_inquiry_submit'"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'xt_diabetes_referral'"), start, end),
    count(db, metricSql("event_type = 'xt_diabetes_referral'"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'contact_submit'"), start, end),
    count(db, metricSql("event_type = 'contact_submit'"), previousStart, previousEnd),
    count(db, metricSql("event_type = 'member_register'"), start, end),
    count(db, metricSql("event_type = 'member_register'"), previousStart, previousEnd),
    db.prepare(
      `SELECT COALESCE(NULLIF(utm_campaign, ''), '(no campaign)') AS label,
              COALESCE(NULLIF(utm_source, ''), '-') AS source,
              COALESCE(NULLIF(utm_medium, ''), '-') AS medium,
              COUNT(DISTINCT session_id) AS sessions,
              COUNT(DISTINCT visitor_id) AS visitors,
              SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS pageViews,
              SUM(CASE WHEN event_type = 'booking_click' AND event_name = 'book_link' THEN 1 ELSE 0 END) AS bookingClicks,
              SUM(CASE WHEN event_type = 'booking_click' AND event_name = 'booking_form_success' THEN 1 ELSE 0 END) AS externalClicks,
              SUM(CASE WHEN event_type = 'whatsapp_booking_click' THEN 1 ELSE 0 END) AS whatsappOpens,
              SUM(CASE WHEN event_type = 'kalix_booking_click' THEN 1 ELSE 0 END) AS kalixOpens,
              SUM(CASE WHEN event_type = 'community_inquiry_submit' THEN 1 ELSE 0 END) AS communityInquiries,
              SUM(CASE WHEN event_type = 'xt_diabetes_referral' THEN 1 ELSE 0 END) AS xtReferrals,
              SUM(CASE WHEN event_type = 'contact_submit' THEN 1 ELSE 0 END) AS contactSubmits,
              SUM(CASE WHEN event_type = 'member_register' THEN 1 ELSE 0 END) AS memberSignups
       FROM analytics_events
       WHERE ${adWhere} AND created_at BETWEEN ? AND ?
       GROUP BY label, source, medium
       ORDER BY sessions DESC, contactSubmits DESC
       LIMIT 12`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(NULLIF(utm_content, ''), '(no content)') AS label,
              COALESCE(NULLIF(utm_campaign, ''), '(no campaign)') AS campaign,
              COUNT(DISTINCT session_id) AS sessions,
              COUNT(DISTINCT visitor_id) AS visitors,
              SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS pageViews,
              SUM(CASE WHEN event_type = 'booking_click' AND event_name = 'book_link' THEN 1 ELSE 0 END) AS bookingClicks,
              SUM(CASE WHEN event_type = 'booking_click' AND event_name = 'booking_form_success' THEN 1 ELSE 0 END) AS externalClicks,
              SUM(CASE WHEN event_type = 'whatsapp_booking_click' THEN 1 ELSE 0 END) AS whatsappOpens,
              SUM(CASE WHEN event_type = 'kalix_booking_click' THEN 1 ELSE 0 END) AS kalixOpens,
              SUM(CASE WHEN event_type = 'community_inquiry_submit' THEN 1 ELSE 0 END) AS communityInquiries,
              SUM(CASE WHEN event_type = 'xt_diabetes_referral' THEN 1 ELSE 0 END) AS xtReferrals,
              SUM(CASE WHEN event_type = 'contact_submit' THEN 1 ELSE 0 END) AS contactSubmits,
              SUM(CASE WHEN event_type = 'member_register' THEN 1 ELSE 0 END) AS memberSignups
       FROM analytics_events
       WHERE ${adWhere} AND created_at BETWEEN ? AND ?
       GROUP BY label, campaign
       ORDER BY sessions DESC, contactSubmits DESC
       LIMIT 12`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT COALESCE(path, '/') AS label,
              COUNT(DISTINCT session_id) AS sessions,
              SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS pageViews,
              SUM(CASE WHEN event_type = 'booking_click' AND event_name = 'book_link' THEN 1 ELSE 0 END) AS bookingClicks,
              SUM(CASE WHEN event_type = 'booking_click' AND event_name = 'booking_form_success' THEN 1 ELSE 0 END) AS externalClicks,
              SUM(CASE WHEN event_type = 'whatsapp_booking_click' THEN 1 ELSE 0 END) AS whatsappOpens,
              SUM(CASE WHEN event_type = 'kalix_booking_click' THEN 1 ELSE 0 END) AS kalixOpens,
              SUM(CASE WHEN event_type = 'community_inquiry_submit' THEN 1 ELSE 0 END) AS communityInquiries,
              SUM(CASE WHEN event_type = 'xt_diabetes_referral' THEN 1 ELSE 0 END) AS xtReferrals,
              SUM(CASE WHEN event_type = 'contact_submit' THEN 1 ELSE 0 END) AS contactSubmits,
              SUM(CASE WHEN event_type = 'member_register' THEN 1 ELSE 0 END) AS memberSignups
       FROM analytics_events
       WHERE ${adWhere} AND created_at BETWEEN ? AND ?
       GROUP BY label
       ORDER BY sessions DESC
       LIMIT 10`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT ${timelineBucket} AS date,
              SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS pageViews,
              COUNT(DISTINCT visitor_id) AS visitors,
              COUNT(DISTINCT session_id) AS sessions,
              SUM(CASE WHEN event_type = 'booking_click' AND event_name = 'book_link' THEN 1 ELSE 0 END) AS bookingClicks,
              SUM(CASE WHEN event_type = 'booking_click' AND event_name = 'booking_form_success' THEN 1 ELSE 0 END) AS externalClicks,
              SUM(CASE WHEN event_type = 'whatsapp_booking_click' THEN 1 ELSE 0 END) AS whatsappOpens,
              SUM(CASE WHEN event_type = 'kalix_booking_click' THEN 1 ELSE 0 END) AS kalixOpens,
              SUM(CASE WHEN event_type = 'community_inquiry_submit' THEN 1 ELSE 0 END) AS communityInquiries,
              SUM(CASE WHEN event_type = 'xt_diabetes_referral' THEN 1 ELSE 0 END) AS xtReferrals,
              SUM(CASE WHEN event_type = 'contact_submit' THEN 1 ELSE 0 END) AS contactSubmits,
              SUM(CASE WHEN event_type = 'member_register' THEN 1 ELSE 0 END) AS registrations
       FROM analytics_events
       WHERE ${adWhere} AND created_at BETWEEN ? AND ?
       GROUP BY date
       ORDER BY date ASC`,
    ).bind(start, end).all(),
    db.prepare(
      `SELECT created_at, event_type, event_name, path, utm_source, utm_medium, utm_campaign, utm_content
       FROM analytics_events
       WHERE ${adWhere} AND created_at BETWEEN ? AND ?
       ORDER BY created_at DESC
       LIMIT 30`,
    ).bind(start, end).all(),
  ]);

  // A successful booking emits both contact_submit and booking_form_success.
  // Count it once in the conversion total; handoff opens remain intent signals.
  const conversions = contactSubmits + communityInquiries + memberSignups;
  const previousConversions = previousContactSubmits + previousCommunityInquiries + previousMemberSignups;
  const conversionRate = percent(conversions, sessions || pageViews);
  const previousConversionRate = percent(previousConversions, previousSessions || previousPageViews);
  const contactRate = percent(contactSubmits, sessions || pageViews);
  const previousContactRate = percent(previousContactSubmits, previousSessions || previousPageViews);
  const currentTimeline = fillTimeline((timeline.results || []) as TimelineRow[], start, end, granularity).map((row) => ({
    ...row,
    memberSignups: Number(row.registrations || 0),
    conversions: Number(row.contactSubmits || 0) + Number(row.communityInquiries || 0) + Number(row.registrations || 0),
  }));

  return adminJson(request, env, {
    range: { start, end, previousStart, previousEnd, granularity },
    metrics: {
      visitors: metric(visitors, previousVisitors),
      sessions: metric(sessions, previousSessions),
      pageViews: metric(pageViews, previousPageViews),
      bookingClicks: metric(bookingPageClicks, previousBookingPageClicks),
      externalClicks: metric(externalClicks, previousExternalClicks),
      whatsappOpens: metric(whatsappOpens, previousWhatsappOpens),
      kalixOpens: metric(kalixOpens, previousKalixOpens),
      communityInquiries: metric(communityInquiries, previousCommunityInquiries),
      xtReferrals: metric(xtReferrals, previousXtReferrals),
      contactSubmits: metric(contactSubmits, previousContactSubmits),
      memberSignups: metric(memberSignups, previousMemberSignups),
      conversions: metric(conversions, previousConversions),
      conversionRate: metric(conversionRate, previousConversionRate),
      contactRate: metric(contactRate, previousContactRate),
    },
    sparklines: {
      visitors: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.visitors || 0) })),
      sessions: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.sessions || 0) })),
      pageViews: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.pageViews || 0) })),
      bookingClicks: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.bookingClicks || 0) })),
      externalClicks: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.externalClicks || 0) })),
      whatsappOpens: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.whatsappOpens || 0) })),
      kalixOpens: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.kalixOpens || 0) })),
      communityInquiries: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.communityInquiries || 0) })),
      xtReferrals: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.xtReferrals || 0) })),
      contactSubmits: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.contactSubmits || 0) })),
      memberSignups: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.memberSignups || 0) })),
      conversions: currentTimeline.map((row) => ({ date: String(row.date), value: Number(row.conversions || 0) })),
    },
    actions: [
      { label: "Booking page clicks", value: bookingPageClicks },
      { label: "WhatsApp opens", value: whatsappOpens },
      { label: "Kalix opens", value: kalixOpens },
      { label: "Community inquiries", value: communityInquiries },
      { label: "XT Diabetes referrals", value: xtReferrals },
      { label: "External clicks", value: externalClicks },
      { label: "Successful submits", value: contactSubmits },
    ],
    timeline: currentTimeline,
    campaigns: campaigns.results || [],
    contents: contents.results || [],
    landingPages: landingPages.results || [],
    recentEvents: recentEvents.results || [],
  });
}
