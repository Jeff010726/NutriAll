CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'archived')),
  language TEXT NOT NULL DEFAULT 'en',
  draft_definition TEXT NOT NULL,
  published_version_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS survey_versions (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  definition TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  UNIQUE (survey_id, version_number)
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  response_token_hash TEXT NOT NULL,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  answers TEXT NOT NULL DEFAULT '{}',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  duration_seconds INTEGER,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES survey_versions(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_surveys_status_updated ON surveys(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_versions_survey ON survey_versions(survey_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_status ON survey_responses(survey_id, status, started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_survey_responses_token ON survey_responses(response_token_hash);
