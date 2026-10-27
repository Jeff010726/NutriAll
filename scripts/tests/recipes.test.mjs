import assert from "node:assert/strict";
import { test, after } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { createRequire } from "node:module";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { build } = require(require.resolve("esbuild", { paths: [path.dirname(require.resolve("wrangler/package.json"))] }));
const root = path.resolve(import.meta.dirname, "../..");
const temp = await mkdtemp(path.join(tmpdir(), "nutriall-recipes-test-"));
await build({ stdin: { contents: 'export * from "./worker/src/recipes.ts";export { adminLogin,adminMe } from "./worker/src/admin.ts";', resolveDir: root }, bundle: true, platform: "node", format: "esm", outfile: path.join(temp, "recipes.mjs"),
  plugins: [{ name: "sockets", setup(builder) { builder.onResolve({ filter: /^cloudflare:sockets$/ }, () => ({ path: "sockets", namespace: "mock" })); builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: 'export function connect(){throw new Error("No SMTP in recipe tests");}' })); } }],
});
const { publicRecipes, manageRecipes, recipeMedia, adminLogin, adminMe } = await import(pathToFileURL(path.join(temp, "recipes.mjs")));
after(() => rm(temp, { recursive: true }));
async function context() {
  const sqlite = new DatabaseSync(":memory:");
  for (const file of (await readdir(path.join(root, "worker/migrations"))).filter((file) => file.endsWith(".sql")).sort()) sqlite.exec(await readFile(path.join(root, "worker/migrations", file), "utf8"));
  const DB = { prepare(sql) { const statement = sqlite.prepare(sql); let values = []; return { bind(...params) { values = params; return this; }, async first() { return statement.get(...values) || null; }, async all() { return { results: statement.all(...values) }; }, async run() { return { meta: statement.run(...values) }; } }; } };
  const objects = new Map();
  const env = { DB, APP_ENV: "test", ADMIN_EMAIL: "owner@example.com", ADMIN_PASSWORD: "local-test-password", RECIPE_IMAGES: { async put(key, body) { objects.set(key, body); }, async get(key) { return objects.has(key) ? { body: objects.get(key) } : null; }, async delete(key) { objects.delete(key); } } };
  const login = await adminLogin(new Request("https://recipes.nutriallwellness.org/api/recipe-manage/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "CF-Connecting-IP": crypto.randomUUID() }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) }), env);
  assert.equal(login.status, 200);
  const cookie = login.headers.get("Set-Cookie").split(";")[0];
  const request = (method, data, headers = {}) => new Request("https://recipes.nutriallwellness.org/api/recipe-manage/recipes", { method, headers: { Cookie: cookie, "Content-Type": "application/json", Origin: "https://recipes.nutriallwellness.org", ...headers }, ...(data ? { body: JSON.stringify(data) } : {}) });
  return { sqlite, env, request, cookie };
}
const draft = () => ({ slug: "test-new-recipe", document: { image: "/recipe-covers/cucumber-tomato-salad.webp", originalCard: "", date: "2026-10-28", translations: { en: { title: "Test Recipe", excerpt: "A simple recipe", category: "Lunch", tags: ["Quick"], prepTime: "10 min", cookTime: "5 min", servings: "2", diabetesNote: "", carbAwareness: "", ingredients: ["One cucumber"], instructions: ["Wash and slice."], nutrition: [] } } } });

test("migration imports all 12 recipes and every language/image from source", async () => {
  const ctx = await context();
  assert.equal(ctx.sqlite.prepare("SELECT COUNT(*) AS n FROM recipes").get().n, 12);
  for (const locale of ["en", "zh-CN", "zh-TW", "es"]) {
    const data = await (await publicRecipes(new Request(`https://nutriallwellness.org/api/recipes?lng=${locale}`), ctx.env)).json();
    assert.equal(data.recipes.length, 12);
    for (const recipe of data.recipes) { assert.equal(recipe.contentLanguage, locale); assert.ok(recipe.ingredients.length); assert.ok(recipe.instructions.length); await readFile(path.join(root, "assets", recipe.image)); await readFile(path.join(root, "assets", recipe.originalCard)); }
  }
  ctx.sqlite.close();
});

test("manager uses existing admin credentials; unauthenticated writes and foreign origins rejected", async () => {
  const ctx = await context();
  assert.equal((await manageRecipes(new Request("https://recipes.nutriallwellness.org/api/recipe-manage/recipes"), ctx.env)).status, 401);
  assert.equal((await manageRecipes(new Request("https://recipes.nutriallwellness.org/api/recipe-manage/recipes", { method: "POST", body: JSON.stringify(draft()) }), ctx.env)).status, 401);
  assert.equal((await manageRecipes(ctx.request("POST", draft(), { Origin: "https://foreign.example" }), ctx.env)).status, 403);
  const me = await (await adminMe(ctx.request("GET"), ctx.env)).json();
  assert.equal(me.admin.email, "owner@example.com");
  ctx.sqlite.close();
});

test("create, draft edits, publish, conflict protection, unpublish, and delete update public visibility", async () => {
  const ctx = await context();
  let recipe = (await (await manageRecipes(ctx.request("POST", draft()), ctx.env)).json()).recipe;
  assert.equal((await publicRecipes(ctx.request("GET"), ctx.env, recipe.slug)).status, 404);
  recipe = (await (await manageRecipes(ctx.request("POST", recipe), ctx.env, recipe.id, "publish")).json()).recipe;
  assert.equal((await publicRecipes(ctx.request("GET"), ctx.env, recipe.slug)).status, 200);
  const stale = structuredClone(recipe);
  recipe.document.translations.en.title = "Draft changed title";
  recipe = (await (await manageRecipes(ctx.request("PUT", recipe), ctx.env, recipe.id)).json()).recipe;
  const published = await (await publicRecipes(ctx.request("GET"), ctx.env, recipe.slug)).json();
  assert.equal(published.recipe.title, "Test Recipe");
  assert.equal((await manageRecipes(ctx.request("PUT", stale), ctx.env, recipe.id)).status, 409);
  recipe = (await (await manageRecipes(ctx.request("POST", recipe), ctx.env, recipe.id, "publish")).json()).recipe;
  assert.equal((await (await publicRecipes(ctx.request("GET"), ctx.env, recipe.slug)).json()).recipe.title, "Draft changed title");
  recipe = (await (await manageRecipes(ctx.request("POST", null, { "If-Match": String(recipe.revision) }), ctx.env, recipe.id, "unpublish")).json()).recipe;
  assert.equal((await publicRecipes(ctx.request("GET"), ctx.env, recipe.slug)).status, 404);
  assert.equal((await manageRecipes(ctx.request("DELETE", null, { "If-Match": String(recipe.revision) }), ctx.env, recipe.id)).status, 200);
  assert.equal((await manageRecipes(ctx.request("GET"), ctx.env, recipe.id)).status, 404);
  assert.ok(ctx.sqlite.prepare("SELECT deleted_at FROM recipes WHERE id = ?").get(recipe.id).deleted_at);
  ctx.sqlite.close();
});

test("invalid image URLs, incomplete translations, duplicate slugs and missing ingredients cannot publish", async () => {
  const ctx = await context();
  const bad = draft(); bad.document.image = "javascript:alert(1)";
  assert.equal((await manageRecipes(ctx.request("POST", bad), ctx.env)).status, 400);
  const duplicate = draft(); duplicate.slug = "cucumber-tomato-salad";
  assert.equal((await manageRecipes(ctx.request("POST", duplicate), ctx.env)).status, 400);
  let recipe = (await (await manageRecipes(ctx.request("POST", draft()), ctx.env)).json()).recipe;
  recipe.document.translations.en.ingredients = [];
  assert.equal((await manageRecipes(ctx.request("POST", recipe), ctx.env, recipe.id, "publish")).status, 400);
  recipe.document.translations.en.ingredients = ["Cucumber"];
  recipe.document.translations.es = { ...recipe.document.translations.en, title: "Prueba", instructions: [] };
  assert.equal((await manageRecipes(ctx.request("POST", recipe), ctx.env, recipe.id, "publish")).status, 400);
  ctx.sqlite.close();
});

test("image upload checks authentication, bytes and size, and makes uploaded images available", async () => {
  const ctx = await context();
  const bytes = await readFile(path.join(root, "assets/recipe-covers/cucumber-tomato-salad.webp"));
  const request = (body, headers = {}) => new Request("https://recipes.nutriallwellness.org/api/recipe-manage/images", { method: "POST", headers: { Cookie: ctx.cookie, ...headers }, body });
  assert.equal((await recipeMedia(new Request("https://recipes.nutriallwellness.org/api/recipe-manage/images", { method: "POST", body: bytes }), ctx.env)).status, 401);
  assert.equal((await recipeMedia(request("<svg></svg>"), ctx.env)).status, 400);
  assert.equal((await recipeMedia(request(bytes, { "Content-Length": String(9 * 1024 * 1024) }), ctx.env)).status, 400);
  const response = await recipeMedia(request(bytes, { "X-File-Name": "Salad.webp" }), ctx.env);
  assert.equal(response.status, 201);
  const { image } = await response.json();
  const loaded = await recipeMedia(ctx.request("GET"), ctx.env, image.id);
  assert.equal(loaded.headers.get("Content-Type"), "image/webp");
  assert.deepEqual(Buffer.from(await loaded.arrayBuffer()), bytes);
  ctx.sqlite.close();
});
