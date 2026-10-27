import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, auditKitRows } from '../audit-kit-import.mjs';

test('CSV reads BOM, quoted commas, escaped quotes, multiline values and empty trailing fields', () => {
  const rows = parseCsv('\uFEFFemail,first_name,tags,note\r\none@example.com,"A ""B""","one,two","line1\nline2"\r\ntwo@example.com,C,,\r\n');
  assert.equal(rows.length, 2);
  assert.equal(rows[0].first_name, 'A "B"');
  assert.equal(rows[0].tags, 'one,two');
  assert.equal(rows[0].note, 'line1\nline2');
  assert.equal(rows[1].note, '');
});

test('malformed input fails rather than shifting imported fields', () => {
  for (const source of ['email,email\na,b', 'name\na', 'email,name\na', 'email,name\na,"unclosed', 'email,name\na,"closed"junk', 'email,name\na,un"quoted']) {
    assert.throws(() => parseCsv(source));
  }
});

test('audit counts invalid addresses, duplicates, conflicting names and status without exposing records', () => {
  const report = auditKitRows([
    { email: ' Person@Example.com ', status: 'active', tags: 'A, B', Last: 'One', 'Last name': 'Two' },
    { email: 'person@example.com', status: 'cancelled', tags: ' B', created_at: 'not-a-date' },
    { email: '', status: '' }, { email: 'invalid', status: 'bounced' },
  ]);
  assert.equal(report.csv.uniqueValidEmails, 1);
  assert.equal(report.csv.duplicateEmailRows, 1);
  assert.equal(report.csv.emptyEmails, 1);
  assert.equal(report.csv.invalidEmails, 1);
  assert.equal(report.csv.uniqueTrimmedTags, 2);
  assert.equal(report.csv.conflictingLastNames, 1);
  assert.equal(report.csv.invalidDates, 1);
  assert.equal(report.csv.statuses.cancelled, 1);
  assert.doesNotMatch(JSON.stringify(report), /person@|Example\.com|One|Two/);
});

test('cross-source overlap counts unique contacts, while preserving separate booking counts', () => {
  const report = auditKitRows([{ email: 'a@example.com' }, { email: 'b@example.com' }], [
    { source: 'users', email: ' A@EXAMPLE.COM ', marketing_opt_in: 1 },
    { source: 'bookings', email: 'a@example.com' },
    { source: 'bookings', email: 'c@example.com' },
    { source: 'bookings', email: 'c@example.com' },
  ]);
  assert.deepEqual(report.comparison, {
    existingRows: 4, existingUniqueValidEmails: 2, invalidExistingEmailRows: 0,
    existingUserMarketingOptIns: 1, kitEmailsAlreadyInWebsite: 1,
    newEmailsFromKit: 1, combinedUniqueValidEmails: 3,
    perSource: { users: { rows: 1, uniqueValidEmails: 1, kitOverlap: 1 }, bookings: { rows: 3, uniqueValidEmails: 2, kitOverlap: 1 } },
  });
  assert.doesNotMatch(JSON.stringify(report), /@example\.com/);
});
