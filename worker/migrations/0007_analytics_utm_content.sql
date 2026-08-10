ALTER TABLE analytics_events ADD COLUMN utm_content TEXT;

CREATE INDEX IF NOT EXISTS idx_analytics_events_campaign_created
ON analytics_events(utm_source, utm_medium, utm_campaign, created_at);
