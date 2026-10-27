import { expect, test } from "@playwright/test";

const text = { title: "Cucumber Tomato Salad", category: "Fresh sides", excerpt: "A simple salad with cucumber and tomatoes.", tags: ["Side", "Quick"], prepTime: "15 min", cookTime: "0 min", servings: "4", ingredients: ["1 cucumber", "10 oz tomatoes"], instructions: ["Wash and slice.", "Toss together."], nutrition: ["Nutrition retained from the original recipe"], diabetesNote: "Pair with protein.", carbAwareness: "Adjust portions to your needs." };
const document = { image: "/recipe-covers/cucumber-tomato-salad.webp", originalCard: "/recipe-cards/cucumber-tomato-card.webp", date: "2026-10-28", translations: { en: text, "zh-CN": { ...text, title: "黄瓜番茄沙拉" } } };
const recipe = () => ({ id: "recipe-1", slug: "cucumber-tomato-salad", revision: 1, status: "published", document: structuredClone(document), publicUrl: "https://nutriallwellness.org/recipes/cucumber-tomato-salad", updatedAt: "2026-10-28T00:00:00.000Z" });
test.beforeEach(async ({ page }) => {
  await page.route("**/api/analytics/collect", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("https://connect.facebook.net/**", (route) => route.fulfill({ body: "" }));
});
async function mockPublic(page) {
  await page.route("**/api/recipes**", (route) => {
    const url = new URL(route.request().url());
    const locale = url.searchParams.get("lng") || "en";
    const item = { id: "recipe-1", slug: "cucumber-tomato-salad", image: document.image, originalCard: document.originalCard, date: document.date, ...(document.translations[locale] || text), contentLanguage: document.translations[locale] ? locale : "en" };
    if (url.pathname === "/api/recipes") return route.fulfill({ json: { recipes: [item] } });
    if (url.pathname === "/api/recipes/cucumber-tomato-salad") return route.fulfill({ json: { recipe: item } });
    return route.fulfill({ status: 404, json: { error: "Not found" } });
  });
}
async function mockManager(page, signedIn = true) {
  let items = [recipe()];
  const writes = [];
  await page.route("**/api/recipe-manage/**", async (route) => {
    const req = route.request(); const path = new URL(req.url()).pathname; const method = req.method();
    if (path.endsWith("/auth/me")) return route.fulfill({ json: { admin: signedIn ? { email: "owner@example.com" } : null } });
    if (path.endsWith("/auth/login")) { writes.push(req.postDataJSON()); return route.fulfill({ json: { admin: { email: "owner@example.com" } } }); }
    if (path.endsWith("/images") && method === "GET") return route.fulfill({ json: { images: [] } });
    if (path.endsWith("/images") && method === "POST") { writes.push({ kind: "image", type: req.headers()["content-type"] }); return route.fulfill({ json: { image: { id: "upload-1", url: document.image, original_name: "Salad.webp" } }, status: 201 }); }
    if (method === "GET") return route.fulfill({ json: { recipes: items } });
    if (method === "DELETE") { items = []; return route.fulfill({ json: { ok: true } }); }
    const data = req.postDataJSON(); writes.push(data);
    const updated = { ...data, id: data.id || "recipe-new", revision: (data.revision || 0) + 1, status: path.endsWith("/publish") ? "published" : "draft" };
    items = [updated]; return route.fulfill({ json: { recipe: updated } });
  });
  return writes;
}
async function contained(page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true); }

test("menu, recipes, search, localized detail and missing state follow NutriAll styling", async ({ page }) => {
  await mockPublic(page);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./?lng=zh-CN");
  await page.locator(".clinic-nav").getByRole("link", { name: "健康食谱" }).click();
  await expect(page.locator(".nr-card h2")).toHaveText("黄瓜番茄沙拉");
  await page.getByRole("searchbox").fill("不存在的食材");
  await expect(page.locator(".nr-empty")).toBeVisible();
  await page.getByRole("searchbox").fill("");
  await page.screenshot({ path: "test-results/recipes-desktop.png", fullPage: true });
  await page.locator(".nr-card").click();
  await expect(page.locator("h1")).toHaveText("黄瓜番茄沙拉");
  await expect(page.locator(".nr-method ol li")).toHaveCount(2);
  await page.screenshot({ path: "test-results/recipe-detail-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await contained(page);
  await page.screenshot({ path: "test-results/recipe-detail-mobile.png", fullPage: true });
  await page.goto("./recipes/not-a-recipe?lng=en");
  await expect(page.getByText("This recipe is unpublished or has been removed.")).toBeVisible();
  await expect(page.locator(".nr-method")).toHaveCount(0);
});

test("imported live recipe data has 12 localized cards with working images on desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./recipes?lng=zh-CN");
  await expect(page.locator(".nr-card")).toHaveCount(12);
  await expect.poll(() => page.locator(".nr-card img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: "test-results/recipes-imported-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await contained(page);
  await page.screenshot({ path: "test-results/recipes-imported-mobile.png", fullPage: true });
  for (const width of [950, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./recipes?lng=es");
    await expect(page.locator(".nr-card")).toHaveCount(12);
    await contained(page);
  }
});

test("recipe manager logs in with existing credentials and manages drafts, preview and publish", async ({ page }) => {
  const writes = await mockManager(page, false);
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("./recipe-admin");
  await page.getByLabel("邮箱").fill("owner@example.com"); await page.getByLabel("密码").fill("test-password");
  await page.getByRole("button", { name: "登录", exact: true }).click();
  await expect(page.getByRole("button", { name: "创建食谱" })).toBeVisible();
  expect(writes[0]).toMatchObject({ email: "owner@example.com", password: "test-password" });
  await page.screenshot({ path: "test-results/recipe-manager-list.png", fullPage: true });
  await page.getByRole("button", { name: "编辑", exact: true }).click();
  await page.getByLabel("食谱标题").fill("Updated Salad");
  await page.getByRole("button", { name: "保存草稿" }).click();
  await expect(page.getByRole("status")).toContainText("草稿已保存");
  await page.getByRole("button", { name: "预览", exact: true }).click();
  await expect(page.locator(".rm-preview h1")).toHaveText("Updated Salad");
  await page.getByRole("button", { name: "继续编辑" }).click();
  await page.getByRole("button", { name: "发布到网站" }).click();
  await expect(page.getByRole("status")).toContainText("食谱已发布");
  await page.screenshot({ path: "test-results/recipe-manager-editor.png", fullPage: true });
});

test("mobile editor creates a recipe, uploads cover, shows validation errors and deletes", async ({ page }) => {
  const writes = await mockManager(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./recipe-admin"); await page.getByRole("button", { name: "创建食谱" }).click();
  await page.getByLabel("食谱网址名称").fill("my-salad"); await page.getByLabel("食谱标题").fill("My Salad");
  await page.getByLabel("食谱简介").fill("A lunch idea");
  await page.getByLabel("食材（每行一项）").fill("Cucumber\nTomato");
  await page.getByLabel("做法（每行一个步骤）").fill("Wash\nSlice");
  await page.getByRole("button", { name: "选择 / 上传图片" }).first().click();
  await page.getByLabel("上传图片", { exact: true }).setInputFiles("assets/recipe-covers/cucumber-tomato-salad.webp");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(writes.some((item) => item.kind === "image" && item.type === "image/webp")).toBe(true);
  await page.getByRole("button", { name: "保存草稿" }).click();
  await expect(page.getByRole("status")).toContainText("草稿已保存");
  await contained(page);
  await page.screenshot({ path: "test-results/recipe-manager-mobile.png", fullPage: true });
  await page.route("**/api/recipe-manage/recipes/recipe-new/publish", (route) => route.fulfill({ status: 409, json: { error: "Someone else updated this recipe. Reload to avoid losing their changes." } }));
  await page.getByRole("button", { name: "发布到网站" }).click();
  await expect(page.getByRole("alert")).toContainText("Someone else updated");
  await expect(page.getByLabel("食谱标题")).toHaveValue("My Salad");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "删除食谱", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("食谱已删除");
});
