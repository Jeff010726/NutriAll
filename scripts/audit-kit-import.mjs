// Read-only migration audit. Personal records stay in memory; stdout contains counts only.
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function parseCsv(input) {
  const text = input.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  const pushField = () => { row.push(field); field = ''; closed = false; };
  const pushRow = () => {
    pushField();
    if (row.some((cell) => cell !== '')) rows.push(row);
    row = [];
  };
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') { field += '"'; index++; }
        else { quoted = false; closed = true; }
      } else field += char;
    } else if (char === ',') pushField();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++;
      pushRow();
    } else if (char === '"' && field === '' && !closed) quoted = true;
    else {
      if (closed || char === '"') throw new Error('Invalid CSV quoting. No records were written.');
      field += char;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote. No records were written.');
  if (field !== '' || row.length || closed) pushRow();
  if (!rows.length) throw new Error('CSV is empty.');
  const headers = rows.shift().map((header) => header.trim());
  if (new Set(headers).size !== headers.length || headers.some((header) => !header)) {
    throw new Error('CSV contains empty or duplicate column headers.');
  }
  if (!headers.includes('email')) throw new Error('CSV requires an email column.');
  return rows.map((cells) => {
    if (cells.length !== headers.length) throw new Error('CSV row width does not match its header.');
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
}

export function auditKitRows(rows, existingRows = null) {
  const emails = new Set(), tags = new Set(), statuses = {};
  let emptyEmails = 0, invalidEmails = 0, duplicateEmailRows = 0;
  let conflictingLastNames = 0, normalizedTagValues = 0, invalidDates = 0;
  const timestamps = [];
  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email) emptyEmails++;
    else if (!validEmail(email)) invalidEmails++;
    else {
      if (emails.has(email)) duplicateEmailRows++;
      emails.add(email);
    }
    const status = String(row.status || '').trim().toLowerCase() || 'missing';
    statuses[status] = (statuses[status] || 0) + 1;
    const firstLast = String(row.Last || '').trim();
    const secondLast = String(row['Last name'] || '').trim();
    if (firstLast && secondLast && firstLast !== secondLast) conflictingLastNames++;
    for (const raw of String(row.tags || '').split(',')) {
      const tag = raw.trim();
      if (!tag) continue;
      if (tag !== raw) normalizedTagValues++;
      tags.add(tag);
    }
    if (row.created_at) {
      const timestamp = Date.parse(row.created_at);
      if (Number.isFinite(timestamp)) timestamps.push(timestamp);
      else invalidDates++;
    }
  }
  const report = {
    mode: 'read-only; no database writes or emails',
    csv: {
      rows: rows.length, uniqueValidEmails: emails.size, emptyEmails, invalidEmails,
      duplicateEmailRows, statuses, uniqueTrimmedTags: tags.size, normalizedTagValues,
      conflictingLastNames, invalidDates,
      earliestSourceDate: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null,
      latestSourceDate: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
    },
  };
  if (existingRows !== null) {
    const existingEmails = new Set(), optedInEmails = new Set(), perSource = {};
    let invalidExistingEmailRows = 0;
    for (const row of existingRows) {
      const email = normalizeEmail(row.email);
      const source = row.source;
      perSource[source] ||= { rows: 0, emails: new Set(), overlap: new Set() };
      perSource[source].rows++;
      if (!validEmail(email)) { invalidExistingEmailRows++; continue; }
      existingEmails.add(email);
      perSource[source].emails.add(email);
      if (emails.has(email)) perSource[source].overlap.add(email);
      if (Number(row.marketing_opt_in) === 1) optedInEmails.add(email);
    }
    const overlap = [...emails].filter((email) => existingEmails.has(email)).length;
    report.comparison = {
      existingRows: existingRows.length, existingUniqueValidEmails: existingEmails.size,
      invalidExistingEmailRows, existingUserMarketingOptIns: optedInEmails.size,
      kitEmailsAlreadyInWebsite: overlap, newEmailsFromKit: emails.size - overlap,
      combinedUniqueValidEmails: new Set([...emails, ...existingEmails]).size,
      perSource: Object.fromEntries(Object.entries(perSource).map(([source, data]) => [source, {
        rows: data.rows, uniqueValidEmails: data.emails.size, kitOverlap: data.overlap.size,
      }])),
    };
  }
  return report;
}

async function readRemoteContacts() {
  const require = createRequire(import.meta.url);
  const wrangler = path.join(path.dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
  const query = `SELECT 'users' AS source, email, marketing_opt_in FROM users
    UNION ALL SELECT 'bookings', email, 0 FROM contact_leads
    UNION ALL SELECT 'class_signups', email, 0 FROM class_signups
    UNION ALL SELECT 'community_inquiries', email, 0 FROM community_inquiries`;
  const output = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, 'd1', 'execute', 'nutriall-db', '--remote', '--json', '--command', query], {
      cwd: root, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', () => {});
    child.on('error', () => reject(new Error('Could not start the read-only database audit.')));
    child.on('close', (code) => {
      if (code !== 0) reject(new Error('Read-only database query failed. Raw CLI output withheld to protect client information.'));
      else resolve(stdout);
    });
  });
  let result;
  try { result = JSON.parse(output)[0]; }
  catch { throw new Error('Database returned an unexpected response; raw output withheld.'); }
  if (!result?.success || !Array.isArray(result.results)) throw new Error('Database query did not succeed.');
  return result.results;
}

async function main() {
  const [csvPath, option, ...extra] = process.argv.slice(2);
  if (!csvPath || (option && option !== '--compare-remote') || extra.length) {
    throw new Error('Usage: node scripts/audit-kit-import.mjs <csv-file> [--compare-remote]');
  }
  const rows = parseCsv(await readFile(path.resolve(csvPath), 'utf8'));
  const contacts = option === '--compare-remote' ? await readRemoteContacts() : null;
  console.log(JSON.stringify(auditKitRows(rows, contacts), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    // Do not print file system errors containing personal paths or raw CSV records.
    console.error(error.code ? 'Could not read the supplied CSV file.' : error.message);
    process.exitCode = 1;
  });
}
