import { adminJson, requireAdmin } from "./admin";
import { randomId } from "./crypto";
import { getDb } from "./db";
import { badRequest, json } from "./http";
import type { Env } from "./types";

type RecipeText = {
  title: string; category: string; excerpt: string; tags: string[]; prepTime: string; cookTime: string; servings: string;
  diabetesNote: string; carbAwareness: string; ingredients: string[]; instructions: string[]; nutrition: string[];
};
type RecipeDocument = { image: string; originalCard: string; date: string; translations: Record<string, RecipeText> };
type RecipeRow = { id: string; slug: string; draft_json: string; published_json: string | null; revision: number; published_at: string | null; deleted_at: string | null; created_at: string; updated_at: string };
const locales = ["en", "zh-CN", "zh-TW", "es"];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validRecipeImage(value: unknown): value is string {
  return typeof value === "string" && (value === "" || /^\/(recipe-covers|recipe-cards)\/[a-z0-9-]+\.(webp|png|jpg|jpeg)$/.test(value) || /^\/api\/recipes\/media\/rim_[a-f0-9]{32}$/.test(value));
}
function str(value: unknown, max: number) {
  if (typeof value !== "string" || value.length > max) throw new Error("Invalid text or text is too long");
  return value.trim();
}
function lines(value: unknown, limit: number, length: number) {
  if (!Array.isArray(value) || value.length > limit) throw new Error("Too many lines");
  return value.map((item) => str(item, length)).filter(Boolean);
}
export function validateRecipeDocument(value: unknown, publish: boolean): RecipeDocument {
  if (!value || typeof value !== "object") throw new Error("Recipe content is required");
  const input = value as Record<string, unknown>;
  if (!validRecipeImage(input.image) || !validRecipeImage(input.originalCard)) throw new Error("Choose a recipe image from the image library or upload one");
  const date = str(input.date, 10);
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)))) throw new Error("Invalid recipe date");
  const translations: Record<string, RecipeText> = {};
  const supplied = input.translations as Record<string, Record<string, unknown>>;
  if (!supplied || typeof supplied !== "object") throw new Error("Recipe language content is required");
  for (const locale of locales) {
    const item = supplied[locale];
    if (!item) continue;
    const text: RecipeText = {
      title: str(item.title, 200), category: str(item.category, 100), excerpt: str(item.excerpt, 1500),
      tags: lines(item.tags, 20, 60), prepTime: str(item.prepTime, 60), cookTime: str(item.cookTime, 60), servings: str(item.servings, 60),
      diabetesNote: str(item.diabetesNote, 3000), carbAwareness: str(item.carbAwareness, 3000),
      ingredients: lines(item.ingredients, 100, 1000), instructions: lines(item.instructions, 100, 3000), nutrition: lines(item.nutrition, 40, 300),
    };
    if (locale !== "en" && !Object.values(text).some((value) => Array.isArray(value) ? value.length : value)) continue;
    if (publish && (!text.title || !text.excerpt || !text.ingredients.length || !text.instructions.length)) throw new Error(`Complete title, description, ingredients and instructions for ${locale}, or remove that translation`);
    translations[locale] = text;
  }
  if (!translations.en?.title) throw new Error("An English title is required");
  if (publish && !input.image) throw new Error("A cover image is required to publish");
  return { image: input.image, originalCard: input.originalCard, date, translations };
}
async function parseInput(request: Request, publish: boolean) {
  if (Number(request.headers.get("Content-Length")) > 180000) throw new Error("Recipe is too large");
  const body = await request.text();
  if (body.length > 180000) throw new Error("Recipe is too large");
  const data = JSON.parse(body);
  const slug = str(data.slug, 160);
  if (!slugPattern.test(slug)) throw new Error("Use a URL name containing lowercase letters, numbers, and hyphens");
  return { slug, document: validateRecipeDocument(data.document, publish), revision: Number(data.revision) };
}
function managed(row: RecipeRow) {
  return { id: row.id, slug: row.slug, document: JSON.parse(row.draft_json), revision: row.revision,
    status: row.deleted_at ? "deleted" : row.published_json ? "published" : "draft",
    hasUnpublishedChanges: Boolean(row.published_json && row.draft_json !== row.published_json),
    publishedAt: row.published_at, updatedAt: row.updated_at, createdAt: row.created_at,
    publicUrl: `https://nutriallwellness.org/recipes/${row.slug}` };
}
export async function publicRecipes(request: Request, env: Env, slug?: string) {
  const db = getDb(env);
  const localeParam = new URL(request.url).searchParams.get("lng") || "en";
  const locale = locales.includes(localeParam) ? localeParam : "en";
  const rows = slug
    ? await db.prepare("SELECT id,slug,published_json FROM recipes WHERE slug = ? AND deleted_at IS NULL AND published_json IS NOT NULL").bind(slug).all<RecipeRow>()
    : await db.prepare("SELECT id,slug,published_json FROM recipes WHERE deleted_at IS NULL AND published_json IS NOT NULL ORDER BY published_at DESC,slug ASC").all<RecipeRow>();
  const recipes = rows.results.map((row) => {
    const document = JSON.parse(row.published_json!) as RecipeDocument;
    const activeLocale = document.translations[locale] ? locale : "en";
    return { id: row.id, slug: row.slug, image: document.image, originalCard: document.originalCard, date: document.date,
      ...document.translations[activeLocale], contentLanguage: activeLocale, requestedLanguage: locale };
  });
  const response = json(request, env, slug ? recipes[0] ? { recipe: recipes[0] } : { error: "Recipe not found" } : { recipes }, { status: slug && !recipes.length ? 404 : 200 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.delete("X-Robots-Tag");
  return response;
}

export async function recipeSitemap(request: Request, env: Env) {
  if (!env.ASSETS) return new Response("Sitemap unavailable", { status: 503 });
  const base = await env.ASSETS.fetch(request);
  if (!base.ok) return base;
  const rows = await getDb(env).prepare("SELECT slug FROM recipes WHERE deleted_at IS NULL AND published_json IS NOT NULL ORDER BY slug").all<{ slug: string }>();
  const urls = ["/recipes", ...rows.results.map((row) => `/recipes/${row.slug}`)].map((path) => `<url><loc>https://nutriallwellness.org${path}</loc></url>`).join("\n");
  return new Response((await base.text()).replace("</urlset>", urls + "\n</urlset>"), { headers: { "Content-Type": "application/xml;charset=utf-8", "Cache-Control": "no-store" } });
}
export async function manageRecipes(request: Request, env: Env, id?: string, action?: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("Origin");
    if (origin && origin !== new URL(request.url).origin) return adminJson(request, env, { error: "Invalid request origin" }, { status: 403 });
  }
  const db = getDb(env);
  if (!id && request.method === "GET") {
    const rows = await db.prepare("SELECT * FROM recipes WHERE deleted_at IS NULL ORDER BY updated_at DESC").all<RecipeRow>();
    return adminJson(request, env, { recipes: rows.results.map(managed) });
  }
  const row = id ? await db.prepare("SELECT * FROM recipes WHERE id = ? AND deleted_at IS NULL").bind(id).first<RecipeRow>() : null;
  if (id && !row) return adminJson(request, env, { error: "Recipe not found" }, { status: 404 });
  if (row && request.method === "GET") return adminJson(request, env, { recipe: managed(row) });
  if (request.method === "DELETE" && row) {
    const revision = Number(request.headers.get("If-Match"));
    if (revision !== row.revision) return adminJson(request, env, { error: "This recipe changed. Reload before deleting." }, { status: 409 });
    const result = await db.prepare("UPDATE recipes SET deleted_at = ?, revision = revision + 1 WHERE id = ? AND revision = ?").bind(new Date().toISOString(), id, revision).run();
    return adminJson(request, env, result.meta.changes ? { ok: true } : { error: "This recipe changed. Reload first." }, { status: result.meta.changes ? 200 : 409 });
  }
  if (request.method === "POST" && action === "unpublish" && row) {
    const revision = Number(request.headers.get("If-Match"));
    if (revision !== row.revision) return adminJson(request, env, { error: "This recipe changed. Reload first." }, { status: 409 });
    const result = await db.prepare("UPDATE recipes SET published_json = NULL,published_at = NULL,updated_at = ?,revision = revision + 1 WHERE id = ? AND revision = ?").bind(new Date().toISOString(), id, revision).run();
    if (!result.meta.changes) return adminJson(request, env, { error: "This recipe changed. Reload first." }, { status: 409 });
    return adminJson(request, env, { recipe: managed((await db.prepare("SELECT * FROM recipes WHERE id = ?").bind(id).first<RecipeRow>())!) });
  }
  if ((!id && request.method === "POST") || (row && request.method === "PUT") || (row && request.method === "POST" && action === "publish")) {
    try {
      const publish = action === "publish";
      const data = await parseInput(request, publish);
      if (row?.published_json && data.slug !== row.slug) return badRequest(request, env, "Unpublish this recipe before changing its URL name");
      if (row && data.revision !== row.revision) return adminJson(request, env, { error: "Someone else updated this recipe. Reload to avoid losing their changes." }, { status: 409 });
      const duplicate = await db.prepare("SELECT id FROM recipes WHERE slug = ? AND id != ?").bind(data.slug, id || "").first();
      if (duplicate) return badRequest(request, env, "That URL name is already in use");
      if (publish) {
        for (const image of [data.document.image, data.document.originalCard]) if (image.startsWith("/api/recipes/media/")) {
          if (!await db.prepare("SELECT id FROM recipe_media WHERE id = ?").bind(image.split("/").pop()).first()) return badRequest(request, env, "The selected image no longer exists");
        }
      }
      const now = new Date().toISOString();
      const content = JSON.stringify(data.document);
      const recipeId = id || randomId("rcp_");
      if (row) {
        const result = await db.prepare(publish
          ? "UPDATE recipes SET slug = ?,draft_json = ?,published_json = ?,published_at = ?,updated_at = ?,revision = revision + 1 WHERE id = ? AND revision = ?"
          : "UPDATE recipes SET slug = ?,draft_json = ?,updated_at = ?,revision = revision + 1 WHERE id = ? AND revision = ?")
          .bind(...(publish ? [data.slug, content, content, now, now, recipeId, row.revision] : [data.slug, content, now, recipeId, row.revision])).run();
        if (!result.meta.changes) return adminJson(request, env, { error: "This recipe changed. Reload first." }, { status: 409 });
      } else {
        await db.prepare("INSERT INTO recipes (id,slug,draft_json,created_at,updated_at) VALUES (?,?,?,?,?)").bind(recipeId, data.slug, content, now, now).run();
      }
      return adminJson(request, env, { recipe: managed((await db.prepare("SELECT * FROM recipes WHERE id = ?").bind(recipeId).first<RecipeRow>())!) }, { status: row ? 200 : 201 });
    } catch (error) {
      return badRequest(request, env, error instanceof Error && !/D1|SQLITE/.test(error.message) ? error.message : "Could not save recipe. Check the URL name and try again.");
    }
  }
  return adminJson(request, env, { error: "Method not allowed" }, { status: 405 });
}

export function recipeImageType(bytes: Uint8Array) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value)) return "image/png";
  if (new TextDecoder().decode(bytes.slice(0,4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8,12)) === "WEBP") return "image/webp";
  return null;
}
export async function recipeMedia(request: Request, env: Env, id?: string) {
  if (request.method === "GET" && id) {
    const row = await getDb(env).prepare("SELECT object_key,content_type FROM recipe_media WHERE id = ?").bind(id).first<{ object_key: string; content_type: string }>();
    const object = row && env.RECIPE_IMAGES ? await env.RECIPE_IMAGES.get(row.object_key) : null;
    if (!row || !object) return new Response("Image not found", { status: 404 });
    return new Response(object.body, { headers: { "Content-Type": row.content_type, "Cache-Control": "public,max-age=31536000,immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'" } });
  }
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  if (request.method === "GET") {
    const rows = await getDb(env).prepare("SELECT id,original_name,created_at FROM recipe_media ORDER BY created_at DESC LIMIT 100").all<{ id: string; original_name: string; created_at: string }>();
    return adminJson(request, env, { images: rows.results.map((row) => ({ ...row, url: `/api/recipes/media/${row.id}` })) });
  }
  if (request.method !== "POST") return adminJson(request, env, { error: "Method not allowed" }, { status: 405 });
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return adminJson(request, env, { error: "Invalid request origin" }, { status: 403 });
  if (!env.RECIPE_IMAGES) return adminJson(request, env, { error: "Image storage is not configured" }, { status: 503 });
  const max = 8 * 1024 * 1024;
  if (Number(request.headers.get("Content-Length")) > max) return badRequest(request, env, "Images must be 8 MB or smaller");
  if (!request.body) return badRequest(request, env, "Choose an image");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel(); return badRequest(request, env, "Images must be 8 MB or smaller"); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  const type = recipeImageType(bytes);
  if (!type || size < 16) return badRequest(request, env, "Use a JPEG, PNG, or WebP image");
  const mediaId = randomId("rim_");
  const objectKey = `recipes/${mediaId}`;
  let name = request.headers.get("X-File-Name") || "Recipe image";
  try { name = decodeURIComponent(name); } catch { /* Keep the supplied label if it is not encoded. */ }
  name = name.slice(0, 200);
  await env.RECIPE_IMAGES.put(objectKey, bytes, { httpMetadata: { contentType: type } });
  try {
    await getDb(env).prepare("INSERT INTO recipe_media (id,object_key,content_type,original_name,size_bytes,created_at) VALUES (?,?,?,?,?,?)").bind(mediaId, objectKey, type, name, size, new Date().toISOString()).run();
  } catch (error) { await env.RECIPE_IMAGES.delete(objectKey); throw error; }
  return adminJson(request, env, { image: { id: mediaId, url: `/api/recipes/media/${mediaId}`, original_name: name } }, { status: 201 });
}
