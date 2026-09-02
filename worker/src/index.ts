import { adminAdsAnalytics, adminAnalyticsDashboard, collectAnalytics } from "./analytics";
import {
  adminBookings,
  adminClassSignups,
  adminCommunityInquiries,
  adminContactLeads,
  adminDeleteBooking,
  adminDeleteClassSignup,
  adminDownloadClassSignupFile,
  adminLogin,
  adminKalixClicks,
  adminLogout,
  adminMe,
  adminMembers,
  adminPage,
  adminSmtpStatus,
  adminSmtpTest,
  adminStats,
  adminUpdateBooking,
  adminUpdateCommunityInquiry,
  adminWhatsappClicks,
} from "./admin";
import { submitContact } from "./contact";
import { submitCommunityInquiry } from "./communityInquiry";
import { publicBookingActivity } from "./bookingActivity";
import { responseHeaders, json, serverError } from "./http";
import {
  manageSurveyArchive,
  manageSurveyCreate,
  manageSurveyDuplicate,
  manageSurveyExport,
  manageSurveyGet,
  manageSurveyList,
  manageSurveyPublish,
  manageSurveyResults,
  manageSurveyUpdate,
  publicSurveyGet,
  publicSurveySave,
  publicSurveyStart,
} from "./surveys";
import type { Env } from "./types";

function adminResponse(request: Request, env: Env) {
  const url = new URL(request.url);
  const headers = responseHeaders(request, env);

  if (url.pathname === "/robots.txt") {
    return new Response("User-agent: *\nDisallow: /\n", {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  if (url.pathname === "/admin/api/login" && request.method === "POST") return adminLogin(request, env);
  if (url.pathname === "/admin/api/logout" && request.method === "POST") return adminLogout(request, env);
  if (url.pathname === "/admin/api/me" && request.method === "GET") return adminMe(request, env);
  if (url.pathname === "/admin/api/stats" && request.method === "GET") return adminStats(request, env);
  if (url.pathname === "/admin/api/analytics/dashboard" && request.method === "GET") return adminAnalyticsDashboard(request, env);
  if (url.pathname === "/admin/api/analytics/ads" && request.method === "GET") return adminAdsAnalytics(request, env);
  if (url.pathname === "/admin/api/bookings" && request.method === "GET") return adminBookings(request, env);
  if (url.pathname === "/admin/api/bookings/update" && request.method === "POST") return adminUpdateBooking(request, env);
  if (url.pathname === "/admin/api/class-signups" && request.method === "GET") return adminClassSignups(request, env);
  if (url.pathname === "/admin/api/community-inquiries" && request.method === "GET") return adminCommunityInquiries(request, env);
  if (url.pathname === "/admin/api/community-inquiries/update" && request.method === "POST") return adminUpdateCommunityInquiry(request, env);
  if (url.pathname === "/admin/api/bookings/delete" && request.method === "POST") return adminDeleteBooking(request, env);
  if (url.pathname === "/admin/api/class-signups/delete" && request.method === "POST") return adminDeleteClassSignup(request, env);
  const classSignupFileMatch = url.pathname.match(/^\/admin\/api\/class-signups\/([^/]+)\/files\/([^/]+)\/download$/);
  if (classSignupFileMatch && request.method === "GET") {
    return adminDownloadClassSignupFile(request, env, decodeURIComponent(classSignupFileMatch[1]), decodeURIComponent(classSignupFileMatch[2]));
  }
  if (url.pathname === "/admin/api/smtp-status" && request.method === "GET") return adminSmtpStatus(request, env);
  if (url.pathname === "/admin/api/smtp-test" && request.method === "POST") return adminSmtpTest(request, env);
  if (url.pathname === "/admin/api/contact-leads" && request.method === "GET") return adminContactLeads(request, env);
  if (url.pathname === "/admin/api/whatsapp-clicks" && request.method === "GET") return adminWhatsappClicks(request, env);
  if (url.pathname === "/admin/api/kalix-clicks" && request.method === "GET") return adminKalixClicks(request, env);
  if (url.pathname === "/admin/api/members" && request.method === "GET") return adminMembers(request, env);
  if (request.method === "GET" && ["/", "/index.html", "/admin", "/admin/", "/admin/index.html"].includes(url.pathname)) return adminPage(request, env);

  return json(request, env, { error: "Not found" }, { status: 404 });
}

async function surveyPage(request: Request, env: Env) {
  if (!env.ASSETS) return json(request, env, { error: "Survey application is unavailable" }, { status: 503 });
  const assetUrl = new URL(request.url);
  assetUrl.pathname = "/survey";
  assetUrl.search = "";
  return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
}

async function surveyResponse(request: Request, env: Env, pathname?: string) {
  const url = new URL(request.url);
  const path = pathname || url.pathname;

  if (path === "/robots.txt") {
    return new Response("User-agent: *\nDisallow: /manage\n", {
      headers: { ...responseHeaders(request, env), "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  if (path === "/api/auth/login" && request.method === "POST") return adminLogin(request, env);
  if (path === "/api/auth/logout" && request.method === "POST") return adminLogout(request, env);
  if (path === "/api/auth/me" && request.method === "GET") return adminMe(request, env);
  if (path === "/api/manage/surveys" && request.method === "GET") return manageSurveyList(request, env);
  if (path === "/api/manage/surveys" && request.method === "POST") return manageSurveyCreate(request, env);

  const manageMatch = path.match(/^\/api\/manage\/surveys\/([^/]+)(?:\/(publish|duplicate|results|export\.csv))?$/);
  if (manageMatch) {
    const id = decodeURIComponent(manageMatch[1]);
    const action = manageMatch[2];
    if (!action && request.method === "GET") return manageSurveyGet(request, env, id);
    if (!action && request.method === "PUT") return manageSurveyUpdate(request, env, id);
    if (!action && request.method === "DELETE") return manageSurveyArchive(request, env, id);
    if (action === "publish" && request.method === "POST") return manageSurveyPublish(request, env, id);
    if (action === "duplicate" && request.method === "POST") return manageSurveyDuplicate(request, env, id);
    if (action === "results" && request.method === "GET") return manageSurveyResults(request, env, id);
    if (action === "export.csv" && request.method === "GET") return manageSurveyExport(request, env, id);
  }

  const publicSurveyMatch = path.match(/^\/api\/public\/surveys\/([^/]+)(?:\/(start))?$/);
  if (publicSurveyMatch) {
    const slug = decodeURIComponent(publicSurveyMatch[1]);
    if (!publicSurveyMatch[2] && request.method === "GET") return publicSurveyGet(request, env, slug);
    if (publicSurveyMatch[2] === "start" && request.method === "POST") return publicSurveyStart(request, env, slug);
  }

  const publicResponseMatch = path.match(/^\/api\/public\/responses\/([^/]+)(?:\/(submit))?$/);
  if (publicResponseMatch) {
    const id = decodeURIComponent(publicResponseMatch[1]);
    if (!publicResponseMatch[2] && request.method === "PUT") return publicSurveySave(request, env, id, false);
    if (publicResponseMatch[2] === "submit" && request.method === "POST") return publicSurveySave(request, env, id, true);
  }

  if (path.startsWith("/api/")) return json(request, env, { error: "Not found" }, { status: 404 });
  if (/\.[a-z0-9]+$/i.test(path) && env.ASSETS) return env.ASSETS.fetch(request);
  return surveyPage(request, env);
}

async function route(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);

  const legacySiteHosts = new Set(["nutriallwellness.com", "www.nutriallwellness.com"]);
  const legacyAdminHost = "admin.nutriallwellness.com";

  if (url.hostname === "www.nutriallwellness.org" || (legacySiteHosts.has(url.hostname) && ["GET", "HEAD"].includes(request.method))) {
    const destination = new URL(request.url);
    destination.hostname = "nutriallwellness.org";
    return Response.redirect(destination.toString(), 301);
  }

  if (url.hostname === legacyAdminHost && ["GET", "HEAD"].includes(request.method) && !url.pathname.startsWith("/api/")) {
    const destination = new URL(request.url);
    destination.hostname = env.ADMIN_HOST || "admin.nutriallwellness.org";
    return Response.redirect(destination.toString(), 301);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(request, env) });
  }

  if (env.APP_ENV !== "production" && url.pathname.startsWith("/survey-api/")) {
    return surveyResponse(request, env, url.pathname.slice("/survey-api".length));
  }

  if (url.hostname === "survey.nutriallwellness.org") return surveyResponse(request, env);

  const isAdminHostPage =
    (url.hostname === env.ADMIN_HOST || url.hostname === legacyAdminHost) && !url.pathname.startsWith("/api/");
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/") || isAdminHostPage) {
    return adminResponse(request, env);
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    return json(request, env, {
      ok: true,
      service: "nutriall-api",
      environment: env.APP_ENV,
      d1Configured: Boolean(env.DB),
      googleSheetsConfigured: Boolean(
        env.GOOGLE_SHEETS_SPREADSHEET_ID && env.GOOGLE_SHEETS_CLIENT_EMAIL && env.GOOGLE_SHEETS_PRIVATE_KEY,
      ),
    });
  }

  if (url.pathname === "/api/analytics/collect" && request.method === "POST") return collectAnalytics(request, env);
  if (url.pathname === "/api/community-inquiry" && request.method === "POST") return submitCommunityInquiry(request, env, ctx);
  if (url.pathname === "/api/booking-activity" && request.method === "GET") return publicBookingActivity(request, env);
  if (url.pathname === "/api/contact" && request.method === "POST") return submitContact(request, env, ctx);
  if (url.pathname.startsWith("/api/")) return json(request, env, { error: "Not found" }, { status: 404 });
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return json(request, env, { error: "Not found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await route(request, env, ctx);
    } catch (error) {
      return serverError(request, env, error instanceof Error ? error.message : undefined);
    }
  },
};
