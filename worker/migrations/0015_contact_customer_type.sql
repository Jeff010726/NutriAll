ALTER TABLE contact_leads ADD COLUMN customer_type TEXT CHECK (customer_type IN ('new', 'returning'));
