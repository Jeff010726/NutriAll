import { expect, test } from "@playwright/test";

const definition = {
  title: "Community nutrition class survey",
  description: "This short survey helps us plan a class that works for your group.",
  language: "en",
  pages: [
    {
      id: "page_1",
      title: "About your interests",
      description: "Choose the answer that fits best.",
      questions: [
        {
          id: "q_topic",
          type: "single",
          title: "Which topic would help you most?",
          description: "",
          required: true,
          options: [
            { id: "weight", label: "Weight loss" },
            { id: "glp1", label: "GLP-1 nutrition support" },
          ],
        },
        {
          id: "q_notes",
          type: "long_text",
          title: "What would you like us to cover?",
          description: "Optional",
          required: false,
        },
      ],
    },
  ],
  thankYouTitle: "Thank you for sharing",
  thankYouMessage: "Your answer will help us plan the class.",
};

const survey = {
  id: "srv_test",
  title: definition.title,
  slug: "community-class",
  description: definition.description,
  status: "open",
  language: "en",
  definition,
  publishedVersionId: "svv_1",
  createdAt: "2026-08-20T10:00:00.000Z",
  updatedAt: "2026-08-21T10:00:00.000Z",
  publishedAt: "2026-08-21T10:00:00.000Z",
  publicUrl: "https://survey.nutriallwellness.org/s/community-class",
  completedCount: 4,
  responseCount: 5,
};

async function mockAuth(page) {
  await page.route("https://survey.nutriallwellness.org/api/auth/me", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ admin: { email: "admin@example.com" } }),
  }));
}

async function expectNoOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test("survey dashboard supports search, links, and management actions", async ({ page }) => {
  await mockAuth(page);
  await page.route("https://survey.nutriallwellness.org/api/manage/surveys**", (route) => {
    if (route.request().method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ surveys: [survey] }) });
    return route.continue();
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("http://survey.localhost:5176/manage", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Surveys" })).toBeVisible();
  await expect(page.getByRole("link", { name: definition.title })).toBeVisible();
  await expect(page.getByText("4").first()).toBeVisible();
  await expect(page.getByRole("button", { name: `Copy link for ${definition.title}` })).toBeEnabled();
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/survey-dashboard-desktop.png", fullPage: true });
});

test("editor adds questions and publishes a version", async ({ page }) => {
  await mockAuth(page);
  let savedDefinition;
  await page.route("https://survey.nutriallwellness.org/api/manage/surveys/srv_test", async (route) => {
    if (route.request().method() === "PUT") {
      savedDefinition = route.request().postDataJSON().definition;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ survey: { ...survey, definition: savedDefinition } }) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ survey }) });
  });
  await page.route("https://survey.nutriallwellness.org/api/manage/surveys/srv_test/publish", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ survey, version: { id: "svv_2", versionNumber: 2 } }),
  }));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("http://survey.localhost:5176/manage/srv_test/design", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Edit survey" })).toBeVisible();
  await page.locator("#new-question-type").selectOption("rating");
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Q3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Publish updates" }).click();
  await expect.poll(() => savedDefinition?.pages[0].questions.length).toBe(3);
  await expect(page.getByText("Published version 2")).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/survey-editor-desktop.png", fullPage: true });
});

test("public survey validates, saves, and submits", async ({ page }) => {
  await page.route("https://survey.nutriallwellness.org/api/auth/me", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{\"admin\":null}" }));
  await page.route("https://survey.nutriallwellness.org/api/public/surveys/community-class", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ survey: { id: survey.id, slug: survey.slug, versionId: "svv_1", definition } }),
  }));
  await page.route("https://survey.nutriallwellness.org/api/public/surveys/community-class/start", (route) => route.fulfill({
    status: 201, contentType: "application/json", body: "{\"responseId\":\"srp_1\",\"token\":\"token_1\"}",
  }));
  let submitted;
  await page.route("https://survey.nutriallwellness.org/api/public/responses/srp_1", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true}" }));
  await page.route("https://survey.nutriallwellness.org/api/public/responses/srp_1/submit", (route) => {
    submitted = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: "application/json", body: "{\"ok\":true,\"status\":\"completed\"}" });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://survey.localhost:5176/s/community-class", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: definition.title })).toBeVisible();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Please answer this question.")).toBeVisible();
  await page.getByText("Weight loss", { exact: true }).click();
  await page.getByLabel("What would you like us to cover?").fill("Simple meal planning");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Thank you for sharing" })).toBeVisible();
  expect(submitted.answers.q_topic).toBe("weight");
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/survey-public-mobile.png", fullPage: true });
});

test("results page shows metrics, charts, and individual answers", async ({ page }) => {
  await mockAuth(page);
  await page.route("https://survey.nutriallwellness.org/api/manage/surveys/srv_test/results", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      survey,
      metrics: { started: 5, completed: 4, completionRate: 80, averageDurationSeconds: 130 },
      responses: [{ id: "srp_1", status: "completed", source: "Church newsletter", answers: { q_topic: "weight", q_notes: "Meal planning" }, startedAt: "2026-08-21T10:00:00Z", completedAt: "2026-08-21T10:02:10Z", durationSeconds: 130 }],
    }),
  }));
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("http://survey.localhost:5176/manage/srv_test/results", { waitUntil: "networkidle" });
  await expect(page.getByText("80%")).toBeVisible();
  await expect(page.getByText("Weight loss", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Individual responses" }).click();
  await expect(page.getByText("Meal planning", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Export CSV" })).toBeVisible();
  await expectNoOverflow(page);
  await page.screenshot({ path: "test-results/survey-results-desktop.png", fullPage: true });
});
