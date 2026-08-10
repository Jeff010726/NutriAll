CREATE TABLE IF NOT EXISTS contact_leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  source_page TEXT,
  preferred_language TEXT,
  ip TEXT,
  user_agent TEXT,
  sheet_status TEXT NOT NULL DEFAULT 'pending',
  sheet_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_leads_email ON contact_leads(email);
CREATE INDEX IF NOT EXISTS idx_contact_leads_sheet_status ON contact_leads(sheet_status);
