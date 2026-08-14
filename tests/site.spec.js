import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/analytics/collect", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" }));
  await page.route("https://connect.facebook.net/en_US/fbevents.js", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: "" }));
});

async function expectNoHorizontalOverflow(page) {
  const sizes = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.viewport + 1);
}

test("desktop home prioritizes insurance and booking", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=en", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Weight loss care built around your health and your life." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Book a free consultation" })).toBeVisible();
  await expect(page.locator(".insurance-logo-item")).toHaveCount(5);
  await expect(page.getByRole("img", { name: "Healthfirst" })).toBeVisible();
  await expect(page.locator(".clinic-capability-grid > a")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "Registered dietitians, supported by medical oversight." })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/home-desktop.png", fullPage: true });
});

test("mobile home keeps the conversion path visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?lng=en", { waitUntil: "networkidle" });
  await expect(page.locator(".mobile-booking-bar")).toBeVisible();
  await expect(page.locator(".insurance-logo-item")).toHaveCount(5);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator(".clinic-mobile-menu")).toHaveClass(/is-open/);
  await expect(page.getByRole("link", { name: "Insulin Pump Training" }).last()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
});

test("desktop clinical menu stays open and its service links are clickable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=en", { waitUntil: "networkidle" });
  const menuButton = page.getByRole("button", { name: "Diabetes & Training" });
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".nav-dropdown-clinical")).toBeVisible();
  await page.locator(".nav-dropdown-clinical").getByRole("link", { name: /CGM Training & Reports/ }).click();
  await expect(page).toHaveURL(/\/cgm-training$/);
  await expect(page.locator("h1")).toHaveText("CGM Training & Reports");
});

test("language switcher updates conversion content", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=en", { waitUntil: "networkidle" });
  await page.locator(".clinic-header-actions").getByLabel("Language").selectOption("es");
  await expect(page.locator("h1")).toHaveText("Atención para bajar de peso adaptada a su salud y a su vida.");
  await expect(page.getByRole("link", { name: "Reservar consulta gratuita" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("all migrated diabetes service routes render", async ({ page }) => {
  for (const [path, heading] of [
    ["diabetes-classes", "Diabetes Classes"],
    ["pump-training", "Insulin Pump Training"],
    ["cgm-training", "CGM Training & Reports"],
    ["glp1-training", "GLP-1 Medication Training"],
    ["providers", "For Providers"],
  ]) {
    await page.goto(`./${path}?lng=en`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveText(heading);
    await expectNoHorizontalOverflow(page);
  }
});

test("core weight and insurance routes follow the selected language", async ({ page }) => {
  for (const [path, heading] of [
    ["one-to-one-weight-loss", "Pérdida de peso 1:1"],
    ["glp1-care", "Control de peso con GLP-1"],
    ["medical-weight-loss", "Pérdida de peso médica"],
    ["insurance", "Seguro y costo"],
  ]) {
    await page.goto(`./${path}?lng=es`, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveText(heading);
    await expectNoHorizontalOverflow(page);
  }
});

test("validated booking form submits the expected contract", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  let submitted;
  await page.route("https://admin.nutriallwellness.org/api/contact", async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, id: "lead_e2e" }) });
  });
  await page.goto("./?utm_source=facebook&utm_medium=paid_social&utm_campaign=weight-loss", { waitUntil: "networkidle" });
  await page.goto("./book?service=glp1", { waitUntil: "networkidle" });
  await expect(page.getByText("GLP-1 support", { exact: true })).toBeVisible();
  const pixelQueueBeforeSubmit = await page.evaluate(() => window.fbq?.queue || []);
  expect(pixelQueueBeforeSubmit).not.toContainEqual(["trackCustom", "ExternalLinkClick"]);
  await page.getByLabel("Full name").fill("Jane Test");
  await page.getByLabel("Email").fill("jane@example.com");
  await page.getByLabel("Phone").fill("2125550198");
  await page.getByLabel("Age", { exact: true }).fill("42");
  await page.getByLabel("Preferred language").selectOption("English");
  await page.getByLabel("I'm a returning patient").check();
  await page.getByLabel("Best time to reach you").selectOption("10AM - 12PM");
  await page.getByLabel("Insurance company").fill("Aetna");
  await page.getByLabel("Member ID").fill("TEST-001");
  await page.getByLabel("Date of birth").fill("1984-01-15");
  await page.screenshot({ path: "test-results/booking-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Request my free consultation" }).click();
  await expect(page.getByRole("heading", { name: "We will be in touch shortly." })).toBeVisible();
  await expect(page).toHaveURL(/\/booking-redirect$/);
  expect(submitted.serviceInterest).toBe("GLP-1 support");
  expect(submitted.utmSource).toBe("facebook");
  expect(submitted.utmMedium).toBe("paid_social");
  expect(submitted.utmCampaign).toBe("weight-loss");
  expect(submitted.insuranceMemberId).toBe("TEST-001");
  expect(submitted.patientType).toBe("returning");
  const pixelQueue = await page.evaluate(() => window.fbq?.queue || []);
  expect(pixelQueue).toContainEqual(["init", "1809933399979917"]);
  expect(pixelQueue).toContainEqual(["track", "PageView"]);
  expect(pixelQueue).toContainEqual(["trackCustom", "ContactFormSubmit"]);
  expect(pixelQueue).toContainEqual(["trackCustom", "ExternalLinkClick"]);
});

test("legacy booking confirmation resolves to the conversion route", async ({ page }) => {
  await page.goto("./booking-confirmation", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/booking-redirect$/);
  await expect(page.getByRole("heading", { name: "We will be in touch shortly." })).toBeVisible();
});

test("WhatsApp booking route records attribution before redirecting", async ({ page }) => {
  const analyticsEvents = [];
  await page.unroute("**/api/analytics/collect");
  await page.route("**/api/analytics/collect", async (route) => {
    analyticsEvents.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" });
  });
  await page.route("https://wa.me/**", (route) => route.abort());
  await page.goto("./booking-whatsapp?utm_source=facebook&utm_medium=paid_social&utm_campaign=weight-loss&utm_content=creative-01", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Opening WhatsApp..." })).toBeVisible();
  await expect.poll(() => analyticsEvents.some((event) => event.eventType === "whatsapp_booking_click")).toBe(true);
  const event = analyticsEvents.find((item) => item.eventType === "whatsapp_booking_click");
  expect(event.utmCampaign).toBe("weight-loss");
  expect(event.utmContent).toBe("creative-01");
  const pixelQueue = await page.evaluate(() => window.fbq?.queue || []);
  expect(pixelQueue).toContainEqual(["trackCustom", "ExternalLinkClick"]);
});

test("mobile booking form is usable without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./book?service=one-to-one", { waitUntil: "networkidle" });
  await expect(page.getByLabel("Full name")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/booking-mobile.png", fullPage: true });
});

test("about page presents one unified dietitian team", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./about?lng=en", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Meet the team behind your care." })).toBeVisible();
  await expect(page.locator(".all-dietitians .dietitian-profile")).toHaveCount(8);
  await expect(page.getByRole("heading", { name: "Siqian (Cici) Chen, MS, RD, LDN" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yirao (Rebecca) Wang, RDN, LDN, MPH" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yue Jin, MS, RD" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/about-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/about-mobile.png", fullPage: true });
});
