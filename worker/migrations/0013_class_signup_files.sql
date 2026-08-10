CREATE TABLE IF NOT EXISTS class_signup_files (
  id TEXT PRIMARY KEY,
  signup_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(signup_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_class_signup_files_signup_id ON class_signup_files(signup_id);
