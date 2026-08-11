import { adminAdsAnalytics, adminAnalyticsDashboard, collectAnalytics } from "./analytics";
import {
  adminBookings,
  adminClassSignups,
  adminContactLeads,
  adminDeleteBooking,
  adminDeleteClassSignup,
  adminDownloadClassSignupFile,
  adminLogin,
  adminLogout,
  adminMe,
  adminMembers,
  adminPage,
  adminSmtpStatus,
  adminSmtpTest,
  adminStats,
  adminUpdateBooking,
} from "./admin";
import { submitContact } from "./contact";
import { responseHeaders, json, serverError } from "./http";
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
  if (url.pathname === "/admin/api/bookings/delete" && request.method === "POST") return adminDeleteBooking(request, env);
  if (url.pathname === "/admin/api/class-signups/delete" && request.method === "POST") return adminDeleteClassSignup(request, env);
  const classSignupFileMatch = url.pathname.match(/^\/admin\/api\/class-signups\/([^/]+)\/files\/([^/]+)\/download$/);
  if (classSignupFileMatch && request.method === "GET") {
    return adminDownloadClassSignupFile(request, env, decodeURIComponent(classSignupFileMatch[1]), decodeURIComponent(classSignupFileMatch[2]));
  }
  if (url.pathname === "/admin/api/smtp-status" && request.method === "GET") return adminSmtpStatus(request, env);
  if (url.pathname === "/admin/api/smtp-test" && request.method === "POST") return adminSmtpTest(request, env);
  if (url.pathname === "/admin/api/contact-leads" && request.method === "GET") return adminContactLeads(request, env);
  if (url.pathname === "/admin/api/members" && request.method === "GET") return adminMembers(request, env);
  if (request.method === "GET" && ["/", "/index.html", "/admin", "/admin/", "/admin/index.html"].includes(url.pathname)) return adminPage(request, env);

  return json(request, env, { error: "Not found" }, { status: 404 });
}

async function route(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);

  if (url.hostname === "www.nutriallwellness.com") {
    const destination = new URL(request.url);
    destination.hostname = "nutriallwellness.com";
    return Response.redirect(destination.toString(), 301);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(request, env) });
  }

  const isAdminHostPage = env.ADMIN_HOST && url.hostname === env.ADMIN_HOST && !url.pathname.startsWith("/api/");
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
