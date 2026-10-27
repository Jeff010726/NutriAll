# Recipe management

- Public library: https://nutriallwellness.org/recipes
- Manager: https://recipes.nutriallwellness.org/manage
- Local manager: http://127.0.0.1:5175/recipe-admin

Authentication uses the existing `adminLogin`, `adminMe`, `adminLogout`, and `requireAdmin`
handlers and the same configured admin credentials. Cookies are host-only, so users sign
in separately on the recipe subdomain. Passwords and customer information are never copied.

Apply migrations 0022 and 0023 once. They create recipe/media tables and import 12 recipes
from DiabetesCare's default branch `0518` at commit
`b3d1fb8b086805c7e179e5315269fdc78bc033ad`. English, Simplified Chinese,
Traditional Chinese, and Spanish text plus 24 WebP cover/card images are retained.
`assets/recipe-import-manifest.json` records source filenames and checksums.
The import script parses literal source data without executing repository code.
The seed uses INSERT OR IGNORE and will not replace later admin edits.

Use the existing Cloudflare D1 database and the dedicated R2 bucket
`nutriall-recipe-images` bound as `RECIPE_IMAGES`. Imported assets are served from
the site asset binding; newly uploaded photos/cards are read through `/api/recipes/media/:id`.
Uploads accept JPEG, PNG, and WebP up to 8 MB, validated from bytes. They are immutable;
replacing a photo creates a new object and does not change photos used elsewhere.

The manager supports search/status filter, language tabs, image picker/upload,
draft saving, draft preview, publication, unpublication, link copy, and deletion.
Changes to published content remain draft-only until published. The slug cannot change
while published. Revision checks reject stale edits with 409. Deletes soft-delete the row;
recovery can be performed by an authorized operator in D1. Image objects are retained so
deleting a recipe cannot break another recipe using the same photo.

Only published, non-deleted content appears in the public API and dynamic sitemap.
If a translation is absent the page clearly identifies the English fallback.
Partial translations must be completed or removed before publication.
New recipe/translation text and nutrition facts are authored by the operator; the system
does not generate nutrient values or make clinical claims. Imported nutrition values
are kept as source text and remain editable.

Checks: `npm run test:recipes`, Playwright `tests/recipes.spec.js`, worker typecheck,
lint, Vite build plus `scripts/postbuild.mjs`.
