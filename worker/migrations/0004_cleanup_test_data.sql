DELETE FROM member_events
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'debug+%@example.com'
);

DELETE FROM sessions
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'debug+%@example.com'
);

DELETE FROM auth_identities
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE 'debug+%@example.com'
);

DELETE FROM users
WHERE email LIKE 'debug+%@example.com';

DELETE FROM contact_leads
WHERE email = 'test@example.com'
  AND (
    name = 'Test User'
    OR name LIKE 'Deploy Test %'
    OR name LIKE 'Sheet Priority Test %'
    OR name LIKE 'Sheet Debug Test %'
  );
