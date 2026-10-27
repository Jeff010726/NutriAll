import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

// Parse literal data; do not execute code from the source repository.
const require = createRequire(import.meta.url);
const parser = require(require.resolve("@babel/parser", { paths: [path.dirname(require.resolve("@vitejs/plugin-react"))] }));
const source = path.resolve(process.argv[2] || "tmp/diabetescare-recipes-source");
const root = path.resolve(import.meta.dirname, "..");
function literal(node, known = {}) {
  if (node.type === "TSAsExpression" || node.type === "TSSatisfiesExpression") return literal(node.expression, known);
  if (["StringLiteral", "NumericLiteral", "BooleanLiteral"].includes(node.type)) return node.value;
  if (node.type === "NullLiteral") return null;
  if (node.type === "ArrayExpression") return node.elements.map((item) => literal(item, known));
  if (node.type === "ObjectExpression") return Object.fromEntries(node.properties.map((item) => {
    if (item.type !== "ObjectProperty") throw new Error("Unexpected source property");
    return [item.key.name || item.key.value, literal(item.value, known)];
  }));
  if (node.type === "Identifier" && Object.hasOwn(known, node.name)) return known[node.name];
  throw new Error("Unexpected nonliteral source data");
}
async function constant(file, name, known) {
  const parsed = parser.parse(await fs.readFile(path.join(source, file), "utf8"), { sourceType: "module", plugins: ["typescript"] });
  for (const entry of parsed.program.body) {
    const statement = entry.type === "ExportNamedDeclaration" ? entry.declaration : entry;
    if (statement?.type !== "VariableDeclaration") continue;
    for (const declaration of statement.declarations) if (declaration.id.name === name) return literal(declaration.init, known);
  }
  throw new Error("Source constant missing: " + name);
}
const english = await constant("src/lib/recipes.ts", "recipes");
const locales = { en: english };
for (const [locale, file, name] of [["zh-CN", "zh-CN", "zhCN"], ["zh-TW", "zh-TW", "zhTW"], ["es", "es", "es"]]) {
  locales[locale] = (await constant(`src/locales/${file}.ts`, name)).recipes.items;
}
const quote = (value) => "'" + String(value).replaceAll("'", "''") + "'";
const copied = new Map();
const rows = [];
for (const recipe of english) {
  const translations = {};
  for (const [locale, items] of Object.entries(locales)) {
    const item = items.find((item) => item.slug === recipe.slug);
    if (!item) throw new Error(`Missing ${locale} recipe: ${recipe.slug}`);
    const { slug, image, originalCard, date, ...text } = item;
    translations[locale] = text;
  }
  for (const file of [recipe.image, recipe.originalCard]) {
    if (!/^(recipe-covers|recipe-cards)\/[a-z0-9-]+\.webp$/.test(file)) throw new Error("Unexpected media path");
    const bytes = await fs.readFile(path.join(source, "public", file));
    await fs.mkdir(path.dirname(path.join(root, "assets", file)), { recursive: true });
    await fs.copyFile(path.join(source, "public", file), path.join(root, "assets", file));
    copied.set(file, createHash("sha256").update(bytes).digest("hex"));
  }
  const document = { image: "/" + recipe.image, originalCard: "/" + recipe.originalCard, date: recipe.date, translations };
  const json = quote(JSON.stringify(document));
  rows.push(`INSERT OR IGNORE INTO recipes (id,slug,draft_json,published_json,published_at,created_at,updated_at) VALUES (${quote("recipe_import_" + recipe.slug)},${quote(recipe.slug)},${json},${json},'2026-10-28T00:00:00.000Z','2026-10-28T00:00:00.000Z','2026-10-28T00:00:00.000Z');`);
}
await fs.writeFile(path.join(root, "worker/migrations/0023_seed_diabetescare_recipes.sql"), rows.join("\n") + "\n");
const commit = execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
await fs.writeFile(path.join(root, "assets/recipe-import-manifest.json"), JSON.stringify({ repository: "https://github.com/Jeff010726/DiabetesCare", commit, count: english.length, slugs: english.map((recipe) => recipe.slug), media: Object.fromEntries(copied) }, null, 2) + "\n");
console.log(JSON.stringify({ recipes: english.length, languages: Object.keys(locales), images: copied.size, commit }));
