ALTER TABLE contact_leads ADD COLUMN email_status TEXT NOT NULL DEFAULT 'not_applicable';
ALTER TABLE contact_leads ADD COLUMN email_error TEXT;
ALTER TABLE contact_leads ADD COLUMN email_notified_at TEXT;

CREATE INDEX IF NOT EXISTS idx_contact_leads_email_status ON contact_leads(email_status);
