CREATE TABLE crm_contacts (
  id TEXT PRIMARY KEY DEFAULT ('cnt_' || lower(hex(randomblob(16)))),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(trim(email))),
  name TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', language TEXT NOT NULL DEFAULT '',
  subscription_status TEXT NOT NULL DEFAULT 'unknown' CHECK (subscription_status IN ('unknown','pending','subscribed','unsubscribed','bounced','complained','blocked')),
  subscription_source TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
  custom_fields_json TEXT NOT NULL DEFAULT '{}', original_subscribed_at TEXT,
  revision INTEGER NOT NULL DEFAULT 1, archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE crm_contact_sources (
  contact_id TEXT NOT NULL REFERENCES crm_contacts(id), source TEXT NOT NULL, source_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(source,source_id)
);
CREATE INDEX idx_crm_sources_contact ON crm_contact_sources(contact_id);
CREATE TABLE crm_tags (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, kit_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE crm_contact_tags (contact_id TEXT NOT NULL REFERENCES crm_contacts(id), tag_id TEXT NOT NULL REFERENCES crm_tags(id), PRIMARY KEY(contact_id,tag_id));
CREATE TABLE crm_subscription_events (id TEXT PRIMARY KEY, contact_id TEXT NOT NULL REFERENCES crm_contacts(id), status TEXT NOT NULL, source TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE crm_import_batches (id TEXT PRIMARY KEY, source TEXT NOT NULL, summary_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(archived_at,subscription_status);
CREATE TABLE newsletter_broadcasts (
  id TEXT PRIMARY KEY, kit_id TEXT UNIQUE, subject TEXT NOT NULL DEFAULT '', preview_text TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '', from_email TEXT NOT NULL DEFAULT '', source TEXT NOT NULL DEFAULT 'nutriall',
  status TEXT NOT NULL DEFAULT 'draft', stats_json TEXT NOT NULL DEFAULT '{}',
  source_created_at TEXT, source_send_at TEXT, revision INTEGER NOT NULL DEFAULT 1, archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE newsletter_resources (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, kit_id TEXT, name TEXT NOT NULL, definition_json TEXT NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'nutriall', revision INTEGER NOT NULL DEFAULT 1, archived_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(kind,kit_id)
);

-- bookings: preserve separate business records; no automatic marketing subscription.
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(email)),coalesce(name,''),coalesce(phone,''),coalesce(preferred_language,'') FROM contact_leads WHERE trim(coalesce(email,'')) != '' AND instr(email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT OR IGNORE INTO crm_contact_sources(contact_id,source,source_id) SELECT c.id,'bookings',s.id FROM contact_leads s JOIN crm_contacts c ON c.email=lower(trim(s.email));
CREATE TRIGGER crm_contact_leads_insert AFTER INSERT ON contact_leads BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),coalesce(NEW.name,''),coalesce(NEW.phone,''),coalesce(NEW.preferred_language,'')  WHERE trim(coalesce(NEW.email,'')) != '' AND instr(NEW.email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_contact_sources(contact_id,source,source_id) SELECT id,'bookings',NEW.id FROM crm_contacts WHERE email=lower(trim(NEW.email)) ON CONFLICT(source,source_id) DO UPDATE SET contact_id=excluded.contact_id;
END;
CREATE TRIGGER crm_contact_leads_update AFTER UPDATE OF email ON contact_leads BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),coalesce(NEW.name,''),coalesce(NEW.phone,''),coalesce(NEW.preferred_language,'')  WHERE trim(coalesce(NEW.email,'')) != '' AND instr(NEW.email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_contact_sources(contact_id,source,source_id) SELECT id,'bookings',NEW.id FROM crm_contacts WHERE email=lower(trim(NEW.email)) ON CONFLICT(source,source_id) DO UPDATE SET contact_id=excluded.contact_id;
END;
CREATE TRIGGER crm_contact_leads_delete AFTER DELETE ON contact_leads BEGIN DELETE FROM crm_contact_sources WHERE source='bookings' AND source_id=OLD.id; END;

-- community_inquiries: preserve separate business records; no automatic marketing subscription.
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(email)),coalesce(contact_name,''),coalesce(phone,''),coalesce(preferred_language,'') FROM community_inquiries WHERE trim(coalesce(email,'')) != '' AND instr(email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT OR IGNORE INTO crm_contact_sources(contact_id,source,source_id) SELECT c.id,'community_inquiries',s.id FROM community_inquiries s JOIN crm_contacts c ON c.email=lower(trim(s.email));
CREATE TRIGGER crm_community_inquiries_insert AFTER INSERT ON community_inquiries BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),coalesce(NEW.contact_name,''),coalesce(NEW.phone,''),coalesce(NEW.preferred_language,'')  WHERE trim(coalesce(NEW.email,'')) != '' AND instr(NEW.email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_contact_sources(contact_id,source,source_id) SELECT id,'community_inquiries',NEW.id FROM crm_contacts WHERE email=lower(trim(NEW.email)) ON CONFLICT(source,source_id) DO UPDATE SET contact_id=excluded.contact_id;
END;
CREATE TRIGGER crm_community_inquiries_update AFTER UPDATE OF email ON community_inquiries BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),coalesce(NEW.contact_name,''),coalesce(NEW.phone,''),coalesce(NEW.preferred_language,'')  WHERE trim(coalesce(NEW.email,'')) != '' AND instr(NEW.email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_contact_sources(contact_id,source,source_id) SELECT id,'community_inquiries',NEW.id FROM crm_contacts WHERE email=lower(trim(NEW.email)) ON CONFLICT(source,source_id) DO UPDATE SET contact_id=excluded.contact_id;
END;
CREATE TRIGGER crm_community_inquiries_delete AFTER DELETE ON community_inquiries BEGIN DELETE FROM crm_contact_sources WHERE source='community_inquiries' AND source_id=OLD.id; END;

-- class_signups: preserve separate business records; no automatic marketing subscription.
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(email)),coalesce(full_name,''),coalesce('',''),coalesce(preferred_site_language,'') FROM class_signups WHERE trim(coalesce(email,'')) != '' AND instr(email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT OR IGNORE INTO crm_contact_sources(contact_id,source,source_id) SELECT c.id,'class_signups',s.id FROM class_signups s JOIN crm_contacts c ON c.email=lower(trim(s.email));
CREATE TRIGGER crm_class_signups_insert AFTER INSERT ON class_signups BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),coalesce(NEW.full_name,''),coalesce('',''),coalesce(NEW.preferred_site_language,'')  WHERE trim(coalesce(NEW.email,'')) != '' AND instr(NEW.email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_contact_sources(contact_id,source,source_id) SELECT id,'class_signups',NEW.id FROM crm_contacts WHERE email=lower(trim(NEW.email)) ON CONFLICT(source,source_id) DO UPDATE SET contact_id=excluded.contact_id;
END;
CREATE TRIGGER crm_class_signups_update AFTER UPDATE OF email ON class_signups BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),coalesce(NEW.full_name,''),coalesce('',''),coalesce(NEW.preferred_site_language,'')  WHERE trim(coalesce(NEW.email,'')) != '' AND instr(NEW.email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_contact_sources(contact_id,source,source_id) SELECT id,'class_signups',NEW.id FROM crm_contacts WHERE email=lower(trim(NEW.email)) ON CONFLICT(source,source_id) DO UPDATE SET contact_id=excluded.contact_id;
END;
CREATE TRIGGER crm_class_signups_delete AFTER DELETE ON class_signups BEGIN DELETE FROM crm_contact_sources WHERE source='class_signups' AND source_id=OLD.id; END;

-- users: preserve separate business records; no automatic marketing subscription.
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(email)),coalesce(trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')),''),coalesce(phone,''),coalesce(preferred_language,'') FROM users WHERE trim(coalesce(email,'')) != '' AND instr(email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT OR IGNORE INTO crm_contact_sources(contact_id,source,source_id) SELECT c.id,'users',s.id FROM users s JOIN crm_contacts c ON c.email=lower(trim(s.email));
CREATE TRIGGER crm_users_insert AFTER INSERT ON users BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),coalesce(trim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,'')),''),coalesce(NEW.phone,''),coalesce(NEW.preferred_language,'')  WHERE trim(coalesce(NEW.email,'')) != '' AND instr(NEW.email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_contact_sources(contact_id,source,source_id) SELECT id,'users',NEW.id FROM crm_contacts WHERE email=lower(trim(NEW.email)) ON CONFLICT(source,source_id) DO UPDATE SET contact_id=excluded.contact_id;
END;
CREATE TRIGGER crm_users_update AFTER UPDATE OF email ON users BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),coalesce(trim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,'')),''),coalesce(NEW.phone,''),coalesce(NEW.preferred_language,'')  WHERE trim(coalesce(NEW.email,'')) != '' AND instr(NEW.email,'@') > 1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_contact_sources(contact_id,source,source_id) SELECT id,'users',NEW.id FROM crm_contacts WHERE email=lower(trim(NEW.email)) ON CONFLICT(source,source_id) DO UPDATE SET contact_id=excluded.contact_id;
END;
CREATE TRIGGER crm_users_delete AFTER DELETE ON users BEGIN DELETE FROM crm_contact_sources WHERE source='users' AND source_id=OLD.id; END;
