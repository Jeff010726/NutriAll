CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  draft_json TEXT NOT NULL,
  published_json TEXT,
  revision INTEGER NOT NULL DEFAULT 1,
  published_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recipes_public ON recipes(deleted_at, published_at);
CREATE TABLE IF NOT EXISTS recipe_media (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
