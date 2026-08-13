ALTER TABLE contact_leads ADD COLUMN patient_type TEXT CHECK (patient_type IN ('new', 'returning'));
UPDATE contact_leads SET patient_type = customer_type WHERE customer_type IN ('new', 'returning');
