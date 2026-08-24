import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/analytics/collect", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" }));
  await page.route("**/api/booking-activity", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ activities: [
      { name: "A***", kind: "free-call", createdAt: new Date(Date.now() - 12 * 60_000).toISOString(), avatarIndex: 0 },
      { name: "D***", kind: "nutrition-consultation", createdAt: new Date(Date.now() - 28 * 60_000).toISOString(), avatarIndex: 1 },
    ] }),
  }));
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
  await expect(page.getByRole("heading", { name: "Food, health, and real life belong in the same conversation." })).toBeVisible();
  await expect(page.locator(".clinic-hero").getByRole("link", { name: "Book a free 15-minute call" })).toBeVisible();
  await expect(page.locator(".insurance-logo-item")).toHaveCount(5);
  await expect(page.getByRole("img", { name: "Healthfirst" })).toBeVisible();
  await expect(page.locator(".clinic-capability-grid > a")).toHaveCount(3);
  await expect(page.getByRole("heading", { name: "Need nutrition classes for your members? We can run the whole program." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "You will not be handed the same plan as everyone else." })).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("font-size", "18px");
  await expect(page.locator(".clinic-language-trust")).toHaveCSS("font-size", "16px");
  await expect(page.locator(".clinic-footer-brand > p")).toHaveCSS("color", "rgb(63, 81, 76)");
  await expect(page.locator(".clinic-footer-brand > p")).toHaveCSS("font-size", "17px");
  const headerLogo = page.locator(".clinic-brand img");
  const footerLogo = page.locator(".clinic-footer-brand img");
  await expect(headerLogo).toHaveAttribute("src", /nutriall-logo\.png$/);
  await expect(footerLogo).toHaveAttribute("src", /nutriall-logo\.png$/);
  const [headerLogoBox, footerLogoBox] = await Promise.all([headerLogo.boundingBox(), footerLogo.boundingBox()]);
  expect(headerLogoBox?.width).toBe(128);
  expect(Math.abs((headerLogoBox?.x ?? 0) - (footerLogoBox?.x ?? 0))).toBeLessThanOrEqual(1);
  await expect(page.locator(".clinic-team-preview > img")).toHaveAttribute("src", /team\/xiaofang-tan-dark-studio\.jpg$/);
  const teamPreviewBox = await page.locator(".clinic-team-preview").boundingBox();
  expect(teamPreviewBox?.height).toBe(720);
  await expect(page.locator(".clinic-team-preview > img")).toHaveCSS("object-position", "50% 54%");
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/home-desktop.png", fullPage: true });
});

test("2K home keeps the hero copy readable", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto("./?lng=zh-CN", { waitUntil: "networkidle" });
  const headingBox = await page.locator(".clinic-hero-copy h1").boundingBox();
  expect(headingBox?.width).toBeGreaterThan(400);
  expect(headingBox?.height).toBeLessThan(240);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/home-2k.png", fullPage: false });
});

test("care needs uses varied looping bubbles instead of service cards", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1100 });
  await page.goto("./?lng=zh-CN", { waitUntil: "networkidle" });
  const needs = page.locator(".care-needs");
  await expect(needs.getByRole("heading", { name: "今天最想先解决什么？" })).toBeVisible();
  await expect(page.locator(".clinic-path-grid")).toHaveCount(0);
  await expect(needs.locator(".care-needs-group")).toHaveCount(12);
  await expect(needs.locator('.care-needs-group:not([aria-hidden="true"]) .is-featured')).toHaveCount(6);
  await expect(needs.getByText("GLP-1", { exact: true }).first()).toBeVisible();

  const featuredBox = await needs.locator('.care-needs-group:not([aria-hidden="true"]) .is-featured').first().boundingBox();
  const smallBox = await needs.locator('.care-needs-group:not([aria-hidden="true"]) .is-small').first().boundingBox();
  expect(featuredBox?.width).toBeGreaterThan(smallBox?.width ?? 0);
  await expect(needs.locator(".care-needs-group").first()).toHaveCSS("align-items", "flex-end");
  await expect(needs.locator(".care-needs-bubble").first()).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(needs.locator(".care-needs-bubble").first()).toHaveCSS("box-shadow", "none");
  await expect(needs.locator(".care-needs-track").first()).toHaveCSS("animation-name", "care-needs-scroll");
  const activeBubbleLinks = needs.locator('.care-needs-group:not([aria-hidden="true"]) .care-needs-bubble');
  await expect(activeBubbleLinks).toHaveCount(22);
  const bubbleDestinations = await activeBubbleLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(bubbleDestinations).toContain("/one-to-one-weight-loss");
  expect(bubbleDestinations).toContain("/glp1-care");
  expect(bubbleDestinations).toContain("/conditions/pcos");
  expect(bubbleDestinations).toContain("/conditions/food-allergies");
  const coverage = await needs.locator(".care-needs-track").evaluateAll((tracks) => tracks.map((track) => ({
    trackWidth: track.scrollWidth,
    viewportWidth: track.parentElement?.clientWidth ?? 0,
  })));
  expect(coverage.every(({ trackWidth, viewportWidth }) => trackWidth * .75 >= viewportWidth)).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("every condition bubble has a detailed plain-language Chinese guide", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const conditionRoutes = [
    "pcos", "thyroid-health", "digestive-health", "sports-nutrition", "menopause-nutrition",
    "heart-health", "pregnancy-postpartum", "eating-disorders", "celiac-disease", "kidney-health",
    "cancer-nutrition", "high-cholesterol", "food-allergies",
  ];

  for (const route of conditionRoutes) {
    await page.goto(`./conditions/${route}?lng=zh-CN`, { waitUntil: "networkidle" });
    await expect(page.locator(".care-guide-hero h1")).not.toBeEmpty();
    await expect(page.locator(".care-guide-overview-copy p")).toHaveCount(2);
    await expect(page.locator(".care-guide-focus-grid article")).toHaveCount(4);
    await expect(page.locator(".care-guide-visit li")).toHaveCount(3);
    await expect(page.locator(".care-guide-sources a").first()).toHaveAttribute("href", /^https:\/\//);
    await expect(page.locator(".care-guide-booking").getByRole("link", { name: "免费聊 15 分钟" })).toBeVisible();
    await expect(page.locator(".care-guide-booking")).toHaveCSS("background-color", "rgb(23, 53, 46)");
    const bookingHeadingBox = await page.locator(".care-guide-booking h2").boundingBox();
    expect(bookingHeadingBox?.width).toBeGreaterThan(700);
    expect(bookingHeadingBox?.height).toBeLessThan(120);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://nutriallwellness.org/conditions/${route}`);
    await expect(page.locator('meta[name="description"]')).not.toHaveAttribute("content", /Physician-led medical weight loss/);
    await expectNoHorizontalOverflow(page);
  }
});

test("weight, GLP-1, and medical weight pages include the full guide", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["one-to-one-weight-loss", "glp1-care", "medical-weight-loss"]) {
    await page.goto(`./${route}?lng=en`, { waitUntil: "networkidle" });
    await expect(page.locator(".clinical-service-hero").getByRole("link", { name: "Book Now" })).toHaveAttribute("href", "https://app.kalixhealth.com/calendar?calendar_token=06d2246dd9ed72a6228706d8c2dcac8f");
    await expect(page.locator(".care-guide-overview-copy p")).toHaveCount(2);
    await expect(page.locator(".care-guide-focus-grid article")).toHaveCount(4);
    await expect(page.locator(".care-guide-faq details").first()).toBeVisible();
    await expect(page.locator(".care-guide-sources a").first()).toBeVisible();
    await expect(page.locator(".care-guide-booking").getByRole("link", { name: "Book a free 15-minute call" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test("care journey changes the scene with each step", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=en", { waitUntil: "networkidle" });
  const journey = page.locator(".care-journey");
  await expect(journey.getByRole("heading", { name: "What should we talk about?" })).toBeVisible();
  const secondStep = journey.getByRole("button", { name: /We check and match/ });
  await secondStep.click();
  await expect(secondStep).toHaveAttribute("aria-expanded", "true");
  await expect(journey.getByRole("heading", { name: "The right care, clearly matched" })).toBeVisible();
  await expect(journey.getByText("Insurance checked first")).toBeVisible();
  await page.mouse.move(1, 1);
  await expect(journey.locator("article").nth(1).locator(".care-journey-row-progress")).toHaveCSS("animation-duration", "6.5s");
  await expect(journey.getByRole("button", { name: /Meet your dietitian/ })).toHaveAttribute("aria-expanded", "true", { timeout: 7_000 });
});

test("home FAQ expands one plain-language answer at a time", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=zh-CN", { waitUntil: "networkidle" });
  const faq = page.locator(".home-faq");
  await expect(faq.getByRole("heading", { name: "常见问题" })).toBeVisible();
  await expect(faq.locator(".home-faq-item")).toHaveCount(5);

  const firstQuestion = faq.getByRole("button", { name: "营养师可以帮我解决哪些问题？" });
  const secondQuestion = faq.getByRole("button", { name: "保险可以报销营养咨询吗？" });
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
  await expect(faq.getByText(/减重、GLP-1 营养支持/)).toBeVisible();
  await secondQuestion.click();
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  await expect(secondQuestion).toHaveAttribute("aria-expanded", "true");
  await expect(faq.getByText(/不少商业保险会报销/)).toBeVisible();
  const insuranceCall = faq.getByRole("link", { name: /免费聊 15 分钟，先把保险问清楚/ });
  await expect(insuranceCall).toBeVisible();
  await expect(insuranceCall).toHaveAttribute("href", "/book?service=insurance");
  await expect(faq.locator(".home-faq-answer p").nth(1)).toHaveCSS("font-size", "17px");
  await expectNoHorizontalOverflow(page);
});

test("mobile home keeps the conversion path visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./?lng=en", { waitUntil: "networkidle" });
  await expect(page.locator(".mobile-booking-bar")).toBeVisible();
  const activity = page.locator(".booking-activity-toast");
  await expect(activity).toBeVisible({ timeout: 3_000 });
  await expect(activity).toHaveAttribute("data-activity-origin", "real");
  await expect(activity.getByText("Demo")).toHaveCount(0);
  await expect(activity.locator("img")).toHaveAttribute("src", /social-proof\/demo-/);
  const [activityBox, bookingBarBox] = await Promise.all([
    activity.boundingBox(),
    page.locator(".mobile-booking-bar").boundingBox(),
  ]);
  expect((activityBox?.y ?? 0) + (activityBox?.height ?? 0)).toBeLessThan((bookingBarBox?.y ?? 0) - 4);
  await expect(page.locator("body")).toHaveCSS("font-size", "17px");
  await expect(page.locator(".insurance-logo-item")).toHaveCount(5);
  const [mobileHeaderLogoBox, mobileFooterLogoBox] = await Promise.all([
    page.locator(".clinic-brand img").boundingBox(),
    page.locator(".clinic-footer-brand img").boundingBox(),
  ]);
  expect(Math.abs((mobileHeaderLogoBox?.x ?? 0) - (mobileFooterLogoBox?.x ?? 0))).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(page.locator(".clinic-mobile-menu")).toHaveClass(/is-open/);
  await expect(page.getByRole("link", { name: "Community Programs" }).last()).toBeVisible();
  await page.getByRole("button", { name: "Menu" }).click();
  const journey = page.locator(".care-journey");
  await expect(journey).toBeVisible();
  await journey.getByRole("button", { name: /Meet your dietitian/ }).click();
  await expect(journey.getByRole("heading", { name: "A few useful next steps" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
});

test("anonymized booking activity rotates, can be dismissed, and stays off booking pages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=zh-CN", { waitUntil: "networkidle" });
  const activity = page.locator(".booking-activity-toast");
  await expect(activity).toBeVisible({ timeout: 3_000 });
  await expect(activity).toHaveAttribute("data-activity-origin", "real");
  await expect(activity.getByText("演示")).toHaveCount(0);
  await expect(activity).toHaveAttribute("data-activity-origin", "demo", { timeout: 7_000 });
  await expect(activity.getByText("演示")).toHaveCount(0);
  await activity.getByRole("button", { name: "关闭近期预约动态" }).click();
  await expect(activity).toHaveCount(0);

  await page.goto("./book?lng=zh-CN", { waitUntil: "networkidle" });
  await page.waitForTimeout(1_600);
  await expect(page.locator(".booking-activity-toast")).toHaveCount(0);
});

test("desktop service menu stays open and its links are clickable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=en", { waitUntil: "networkidle" });
  const menuButton = page.getByRole("button", { name: "Service" });
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".nav-dropdown-weight")).toBeVisible();
  await page.locator(".nav-dropdown-weight").getByRole("link", { name: /GLP-1 Weight Management/ }).click();
  await expect(page).toHaveURL(/\/glp1-care$/);
  await expect(page.locator("h1")).toHaveText("GLP-1 Weight Management");
});

test("language switcher updates conversion content", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=en", { waitUntil: "networkidle" });
  await page.locator(".clinic-header-actions").getByLabel("Language").selectOption("es");
  await expect(page.locator("h1")).toHaveText("La comida, la salud y la vida merecen una sola conversación.");
  await expect(page.locator(".clinic-hero").getByRole("link", { name: "Llamada gratuita de 15 minutos" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test("retired diabetes routes return visitors to the focused home page", async ({ page }) => {
  for (const path of ["diabetes-care", "diabetes-classes", "pump-training", "cgm-training", "providers", "recipes", "research"]) {
    await page.goto(`./${path}?lng=en`, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Food, health, and real life belong in the same conversation." })).toBeVisible();
  }
  await expect(page.getByText("Diabetes & Training", { exact: true })).toHaveCount(0);
});

test("community contracting page explains the offer and keeps a free-call path visible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./community-programs?lng=en", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Nutrition classes, contracted and run for your community." })).toBeVisible();
  await expect(page.locator(".community-format-grid article")).toHaveCount(3);
  await expect(page.getByText("Churches and faith communities", { exact: true })).toBeVisible();
  await expect(page.locator(".community-program-hero").getByRole("link", { name: /Book a Free Call/ })).toHaveAttribute("href", "/book?service=community");
  const communityCtaHeading = await page.locator(".community-final-cta h2").boundingBox();
  expect(communityCtaHeading?.width).toBeGreaterThan(800);
  expect(communityCtaHeading?.height).toBeLessThan(100);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/community-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./community-programs?lng=zh-CN", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "社区、教会需要营养福利课程，我们可以整套承接。" })).toBeVisible();
  const mobileCommunityCtaHeading = await page.locator(".community-final-cta h2").boundingBox();
  expect(mobileCommunityCtaHeading?.width).toBeGreaterThan(320);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/community-mobile.png", fullPage: true });
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
  await expect(page.getByRole("heading", { name: "Bringing culturally rooted, multilingual nutrition to life." })).toBeVisible();
  await expect(page.locator(".clinic-founder-story-copy > p")).toHaveCount(5);
  await expect(page.locator(".clinic-founder-story blockquote")).toContainText("mother tongue");
  await expect(page.locator(".all-dietitians .dietitian-profile")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: /Lisa Van Leeuwen/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Alexandra Rodiles/ })).toHaveCount(0);
  await expect(page.locator(".dietitian-profile > img").first()).toHaveCSS("object-fit", "contain");
  await expect(page.getByRole("heading", { name: "Siqian (Cici) Chen, MS, RD, LDN" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yirao (Rebecca) Wang, RDN, LDN, MPH" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Yue Jin, MS, RD" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ziying Zhang, MS, RDN" })).toBeVisible();
  const ziyingCard = page.locator(".dietitian-profile").filter({ has: page.getByRole("heading", { name: "Ziying Zhang, MS, RDN" }) });
  await expect(ziyingCard.getByText("Registered Dietitian / Diabetes Educator", { exact: true })).toBeVisible();
  await expect(ziyingCard.getByText(/Teachers College, Columbia University/)).toHaveCount(1);
  await expect(ziyingCard.getByText(/leads a diabetes education program/)).toHaveCount(1);
  await expect(page.locator(".dietitian-profile > img[src$='-dark-studio.jpg']")).toHaveCount(6);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/about-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: "test-results/about-mobile.png", fullPage: true });
  await page.goto("./about?lng=zh-CN", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "让多语言、尊重文化的营养照护真正落地。" })).toBeVisible();
  await expect(page.locator(".clinic-founder-story blockquote")).toContainText("不应该让任何人放弃自己的母语");
  await expectNoHorizontalOverflow(page);
});
