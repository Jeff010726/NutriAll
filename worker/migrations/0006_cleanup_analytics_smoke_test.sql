DELETE FROM analytics_events
WHERE visitor_id = 'vis_smoke_test'
  OR session_id = 'ses_smoke_test'
  OR path = '/__smoke_analytics__';
