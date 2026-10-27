-- Respect explicit website opt-in; ordinary bookings never opt anyone into marketing.
UPDATE crm_contacts SET subscription_status='subscribed',subscription_source='website-optin'
WHERE subscription_status='unknown' AND EXISTS(SELECT 1 FROM users WHERE lower(trim(users.email))=crm_contacts.email AND users.marketing_opt_in=1);
CREATE TRIGGER crm_users_optin_insert AFTER INSERT ON users WHEN NEW.marketing_opt_in=1 BEGIN
INSERT INTO crm_contacts(email,name,phone,language) SELECT lower(trim(NEW.email)),trim(coalesce(NEW.first_name,'') || ' ' || coalesce(NEW.last_name,'')),coalesce(NEW.phone,''),coalesce(NEW.preferred_language,'') WHERE trim(coalesce(NEW.email,''))!='' AND instr(NEW.email,'@')>1 ON CONFLICT(email) DO NOTHING;
INSERT INTO crm_subscription_events(id,contact_id,status,source,reason) SELECT 'cev_'||lower(hex(randomblob(16))),id,'subscribed','website-optin','Explicit opt-in at registration' FROM crm_contacts WHERE email=lower(trim(NEW.email)) AND subscription_status IN ('unknown','pending');
UPDATE crm_contacts SET subscription_status='subscribed',subscription_source='website-optin',revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE email=lower(trim(NEW.email)) AND subscription_status IN ('unknown','pending');
END;
CREATE TRIGGER crm_users_optin_update AFTER UPDATE OF marketing_opt_in ON users WHEN OLD.marketing_opt_in!=NEW.marketing_opt_in BEGIN
INSERT INTO crm_subscription_events(id,contact_id,status,source,reason) SELECT 'cev_'||lower(hex(randomblob(16))),id,CASE WHEN NEW.marketing_opt_in=1 THEN 'subscribed' ELSE 'unsubscribed' END,'website-optin','Explicit preference update' FROM crm_contacts WHERE email=lower(trim(NEW.email)) AND (NEW.marketing_opt_in=0 OR subscription_status IN ('unknown','pending'));
UPDATE crm_contacts SET subscription_status=CASE WHEN NEW.marketing_opt_in=1 THEN 'subscribed' ELSE 'unsubscribed' END,subscription_source='website-optin',revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE email=lower(trim(NEW.email)) AND (NEW.marketing_opt_in=0 OR subscription_status IN ('unknown','pending'));
END;
CREATE TRIGGER crm_suppression_guard BEFORE UPDATE OF subscription_status ON crm_contacts
WHEN NEW.subscription_status='subscribed' AND EXISTS(SELECT 1 FROM crm_subscription_events WHERE contact_id=OLD.id AND status IN ('bounced','complained','blocked'))
BEGIN SELECT RAISE(ABORT,'Permanent suppression requires a separate verified recovery process'); END;
