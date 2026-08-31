import { expect, test } from "@playwright/test";

const metric = (value) => ({ value, previous: Math.max(0, value - 1), change: 12 });
const analytics = {
  range: {
    start: "2026-08-01T00:00:00.000Z",
    end: "2026-08-25T23:59:59.999Z",
    previousStart: "2026-07-07T00:00:00.000Z",
    previousEnd: "2026-07-31T23:59:59.999Z",
  },
  metrics: {
    visitors: metric(120), sessions: metric(150), pageViews: metric(260), bookingClicks: metric(24),
    leads: metric(9), registrations: metric(7), bookingRate: metric(16), leadRate: metric(6),
  },
  sparklines: {
    visitors: [{ value: 4 }, { value: 8 }], sessions: [{ value: 6 }, { value: 10 }],
    pageViews: [{ value: 12 }, { value: 22 }], bookingClicks: [{ value: 1 }, { value: 4 }],
    leads: [{ value: 1 }, { value: 2 }], registrations: [{ value: 0 }, { value: 2 }],
  },
  timeline: [
    { date: "2026-08-24", visitors: 4, sessions: 6, pageViews: 12, bookingClicks: 1, contactSubmits: 1 },
    { date: "2026-08-25", visitors: 8, sessions: 10, pageViews: 22, bookingClicks: 4, contactSubmits: 2 },
  ],
  funnel: [{ label: "Sessions", value: 150 }, { label: "Bookings", value: 24 }],
  topPages: [{ label: "/one-to-one-weight-loss", pageViews: 88 }],
  sourceChannels: [{ label: "Search", count: 60 }],
  topCountries: [{ label: "United States", count: 110 }],
  topDevices: [{ label: "Mobile", count: 80 }],
  landingPages: [{ label: "/", sessions: 70 }],
  topBrowsers: [{ label: "Safari", count: 60 }],
  topReferrers: [{ label: "Google", count: 55 }],
  topRegions: [{ label: "New York", count: 80 }],
  topCities: [{ label: "New York", count: 65 }],
  insights: ["Booking interest increased during this range."],
};

const adsAnalytics = {
  range: analytics.range,
  metrics: {
    visitors: metric(80), sessions: metric(100), pageViews: metric(180), conversions: metric(3),
    contactSubmits: metric(2), memberSignups: metric(1), externalClicks: metric(2), whatsappOpens: metric(4),
    kalixOpens: metric(3), bookingClicks: metric(12), contactRate: metric(2),
  },
  sparklines: {
    visitors: [], sessions: [], pageViews: [], conversions: [], contactSubmits: [], memberSignups: [],
    externalClicks: [], whatsappOpens: [], kalixOpens: [], bookingClicks: [],
  },
  timeline: [],
  actions: [
    { label: "Booking page clicks", value: 12 }, { label: "WhatsApp opens", value: 4 },
    { label: "Kalix opens", value: 3 }, { label: "External clicks", value: 2 }, { label: "Successful submits", value: 2 },
  ],
  landingPages: [{ label: "/", sessions: 100 }],
  campaigns: [{ label: "weight_loss_2026", source: "facebook", medium: "paid_social", sessions: 100, visitors: 80, pageViews: 180, bookingClicks: 12, whatsappOpens: 4, kalixOpens: 3, externalClicks: 2, contactSubmits: 2, memberSignups: 1 }],
  contents: [{ label: "homepage_ad_01", campaign: "weight_loss_2026", sessions: 100, visitors: 80, pageViews: 180, bookingClicks: 12, whatsappOpens: 4, kalixOpens: 3, externalClicks: 2, contactSubmits: 2, memberSignups: 1 }],
  recentEvents: [],
};

const bookings = [
  {
    id: "booking-1", created_at: "2026-08-25T01:30:00.000Z", lead_status: "new",
    name: "Mei-Ling Alexandra Chen", email: "mei.ling.chen@example.com", phone: "+1 (929) 555-0123",
    service_interest: "GLP-1 nutrition support and weight management", patient_type: "new",
    preferred_language: "Cantonese", availability: "Weekday afternoons after 3:00 PM Eastern Time",
    insurance_company: "Blue Cross Blue Shield", insurance_member_id: "ABC123456789",
    date_of_birth: "1968-04-18", assigned_to: "", follow_up_at: "2026-08-24T15:00:00.000Z",
    notes: "Please call after work. Client would like insurance benefits explained in plain language.",
    message: "Age: 58\nPreferred Language: Cantonese", sheet_status: "synced", email_status: "sent",
    confirmation_email_status: "sent", source_page: "/glp-1-support",
  },
  {
    id: "booking-2", created_at: "2026-08-24T15:30:00.000Z", lead_status: "benefits_check",
    name: "Robert Williams", email: "robert@example.com", phone: "+1 212 555 0199",
    service_interest: "Weight loss", patient_type: "returning", preferred_language: "English",
    insurance_company: "Aetna", assigned_to: "Ziying", follow_up_at: "2026-08-28T12:00:00.000Z",
    notes: "", message: "", sheet_status: "synced", email_status: "sent", confirmation_email_status: "sent",
  },
];

const signups = [{
  id: "signup-1", created_at: "2026-08-24T12:00:00.000Z", age_range: "55-64", gender: "Female",
  race_ethnicity: JSON.stringify(["Asian"]), primary_language: "Mandarin", state_residence: "New York",
  education_level: "College", has_us_health_insurance: "Yes", diagnosed_conditions: JSON.stringify(["Type 2 diabetes"]),
  blood_sugar_monitoring: "Daily", diabetes_medications: JSON.stringify(["Metformin"]), agreement_accepted: 1,
  agreement_version: "2026-01", agreement_accepted_at: "2026-08-24T12:00:00.000Z", email_status: "sent",
  files: [{ id: "front", kind: "front" }, { id: "back", kind: "back" }],
}];

const whatsappData = {
  range: { start: "2026-08-01T00:00:00.000Z", end: "2026-08-25T23:59:59.999Z" },
  summary: { total: 4, uniqueVisitors: 4, attributedOpens: 3, latest: "2026-08-25T03:30:00.000Z" },
  clicks: [{
    id: "wa-1", created_at: "2026-08-25T03:30:00.000Z", path: "/booking-whatsapp/", referrer: "https://nutriallwellness.org/book",
    utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "weight_loss_2026", utm_content: "homepage_ad_01",
    country: "US", region: "New York", city: "Flushing", timezone: "America/New_York", device: "mobile", browser: "Mobile Safari",
    language: "zh-CN", session_id: "ses_12345678", visitor_id: "vis_87654321",
  }],
};

const kalixData = {
  range: whatsappData.range,
  summary: { total: 3, uniqueVisitors: 2, attributedOpens: 3, latest: "2026-08-25T04:15:00.000Z" },
  clicks: [{
    ...whatsappData.clicks[0], id: "kalix-1", created_at: "2026-08-25T04:15:00.000Z", event_name: "glpCare",
    path: "/glp1-care", visitor_id: "vis_11223344",
  }],
};

async function mockAdmin(page, updates) {
  await page.route("**/admin/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/admin/api/me") return route.fulfill({ json: { admin: { email: "owner@nutriallwellness.org" } } });
    if (path === "/admin/api/analytics/dashboard") return route.fulfill({ json: analytics });
    if (path === "/admin/api/analytics/ads") return route.fulfill({ json: adsAnalytics });
    if (path === "/admin/api/bookings") return route.fulfill({ json: { bookings } });
    if (path === "/admin/api/bookings/update") {
      updates.push(request.postDataJSON());
      return route.fulfill({ json: { ok: true } });
    }
    if (path === "/admin/api/class-signups") return route.fulfill({ json: { signups } });
    if (path === "/admin/api/contact-leads") return route.fulfill({ json: { leads: [{ created_at: "2026-08-25T02:00:00.000Z", name: "L. Wong", email: "lw@example.com", message: "Please explain insurance coverage.", source_page: "/contact", preferred_language: "Chinese", sheet_status: "synced" }] } });
    if (path === "/admin/api/whatsapp-clicks") return route.fulfill({ json: whatsappData });
    if (path === "/admin/api/kalix-clicks") return route.fulfill({ json: kalixData });
    if (path === "/admin/api/members") return route.fulfill({ json: { members: [{ created_at: "2026-08-20T02:00:00.000Z", email: "member@example.com", phone: "+1 718 555 0100", first_name: "Grace", last_name: "Lee", preferred_language: "English", marketing_opt_in: 1 }] } });
    if (path === "/admin/api/smtp-status") return route.fulfill({ json: { configured: true } });
    if (path === "/admin/api/logout") return route.fulfill({ json: { ok: true } });
    return route.fulfill({ json: {} });
  });
}

test.describe("mobile admin", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("prioritizes operations and supports booking follow-up", async ({ page }) => {
    const updates = [];
    await mockAdmin(page, updates);
    await page.goto("http://127.0.0.1:8790/admin");

    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByText("New bookings")).toBeVisible();
    await expect(page.locator(".side")).toBeHidden();
    await expect(page.locator(".mobile-nav")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: "test-results/admin-mobile-overview.png", fullPage: true });

    await page.getByRole("button", { name: "Bookings", exact: true }).click();
    await expect(page.locator("#content").getByRole("heading", { name: "Mei-Ling Alexandra Chen" })).toBeVisible();
    await page.screenshot({ path: "test-results/admin-mobile-bookings.png", fullPage: true });
    await page.locator("[data-booking-detail='booking-1']").click();
    await expect(page.locator("#mobile-sheet-title")).toHaveText("Mei-Ling Alexandra Chen");
    await page.screenshot({ path: "test-results/admin-mobile-booking-detail.png" });
    await page.getByRole("button", { name: "Edit follow-up" }).click();
    await page.locator("#mobile-booking-status").selectOption("contacted");
    await page.locator("#mobile-booking-owner").fill("Xiaofang Tan");
    await page.locator("#mobile-booking-notes").fill("Called and reviewed benefits.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Booking updated")).toBeVisible();
    expect(updates.at(-1)).toMatchObject({ id: "booking-1", leadStatus: "contacted", assignedTo: "Xiaofang Tan", notes: "Called and reviewed benefits.", markContacted: true });
  });

  test("shows class files and secondary admin areas", async ({ page }) => {
    await mockAdmin(page, []);
    await page.goto("http://127.0.0.1:8790/admin");
    await page.getByRole("button", { name: "Classes" }).click();
    await page.getByRole("button", { name: "View enrollment" }).click();
    await expect(page.getByRole("link", { name: "Download insurance card front" })).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "More" }).click();
    await page.getByRole("button", { name: "WhatsApp opens" }).click();
    await expect(page.getByRole("heading", { name: "WhatsApp Opens" })).toBeVisible();
    await expect(page.getByText("Visitor ...87654321")).toBeVisible();
    await page.screenshot({ path: "test-results/admin-mobile-whatsapp.png", fullPage: true });
    await page.getByRole("button", { name: "View details" }).click();
    await expect(page.locator("#mobile-sheet-body .mobile-detail-note")).toContainText("It does not confirm that they sent a message or booked an appointment.");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "More" }).click();
    await page.getByRole("button", { name: "Kalix opens" }).click();
    await expect(page.getByRole("heading", { name: "Kalix Opens" })).toBeVisible();
    await expect(page.getByText("GLP-1 care")).toBeVisible();
    await page.screenshot({ path: "test-results/admin-mobile-kalix.png", fullPage: true });
    await page.getByRole("button", { name: "View details" }).click();
    await expect(page.locator("#mobile-sheet-body .mobile-detail-note")).toContainText("It is not a confirmed appointment.");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("button", { name: "More" }).click();
    await page.getByRole("button", { name: "Contact leads" }).click();
    await expect(page.getByRole("heading", { name: "L. Wong" })).toBeVisible();
    await page.getByRole("button", { name: "More" }).click();
    await page.getByRole("button", { name: "Members" }).click();
    await expect(page.getByRole("heading", { name: "Grace Lee" })).toBeVisible();
  });
});

test("desktop admin retains the existing table navigation", async ({ page }) => {
  const updates = [];
  await mockAdmin(page, updates);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("http://127.0.0.1:8790/admin");
  await expect(page.locator(".side")).toBeVisible();
  await expect(page.locator(".mobile-nav")).toBeHidden();
  await page.locator("[data-view='bookings']").click();
  await expect(page.locator(".tablewrap")).toBeVisible();
  await expect(page.locator("thead")).toContainText("Insurance Company");
  await page.locator("[data-view='whatsapp']").click();
  await expect(page.getByRole("heading", { name: "WhatsApp Opens" })).toBeVisible();
  await expect(page.locator("thead")).toContainText("Source / Campaign");
  await expect(page.getByText(/visitor reached the WhatsApp handoff/)).toBeVisible();
  await page.locator("[data-view='kalix']").click();
  await expect(page.getByRole("heading", { name: "Kalix Opens" })).toBeVisible();
  await expect(page.locator("thead")).toContainText("Service");
  await expect(page.getByText("GLP-1 care")).toBeVisible();
  await page.locator("[data-view='ads']").click();
  await expect(page.getByRole("heading", { name: "Ads" })).toBeVisible();
  await expect(page.getByText("WhatsApp opens", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Kalix opens", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Booking page clicks", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("External clicks", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: "test-results/admin-desktop-ad-actions.png", fullPage: true });
});

test("mobile admin remains contained across phone and tablet widths", async ({ page }) => {
  await mockAdmin(page, []);
  for (const width of [430, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("http://127.0.0.1:8790/admin");
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.getByRole("button", { name: "Bookings", exact: true }).click();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});
