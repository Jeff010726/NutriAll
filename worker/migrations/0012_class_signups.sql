CREATE TABLE IF NOT EXISTS class_signups (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  email TEXT NOT NULL,
  age_range TEXT NOT NULL,
  gender TEXT NOT NULL,
  gender_other TEXT,
  race_ethnicity TEXT NOT NULL,
  primary_language TEXT NOT NULL,
  primary_language_other TEXT,
  state_residence TEXT NOT NULL,
  education_level TEXT NOT NULL,
  has_us_health_insurance TEXT NOT NULL,
  diagnosed_conditions TEXT NOT NULL,
  blood_sugar_monitoring TEXT NOT NULL,
  diabetes_medications TEXT NOT NULL,
  agreement_accepted INTEGER NOT NULL DEFAULT 0,
  agreement_version TEXT NOT NULL,
  agreement_accepted_at TEXT,
  source_page TEXT,
  preferred_site_language TEXT,
  ip TEXT,
  user_agent TEXT,
  email_status TEXT NOT NULL DEFAULT 'pending',
  email_error TEXT,
  email_notified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_signups_email ON class_signups(email);
CREATE INDEX IF NOT EXISTS idx_class_signups_created_at ON class_signups(created_at);
CREATE INDEX IF NOT EXISTS idx_class_signups_email_status ON class_signups(email_status);
