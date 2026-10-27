// Generates/imports private data outside source migrations. Never prints customer rows or SQL.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { parseCsv } from './audit-kit-import.mjs';
import { cloudflareSessionEnv } from './cloudflare-command.mjs';

const root = path.resolve(import.meta.dirname, '..'), dir = path.join(root, 'tmp/kit-private');
const mode = process.argv[2] || 'prepare';
if (!['prepare', 'local', 'remote'].includes(mode)) throw new Error('Usage: node scripts/import-kit-snapshot.mjs prepare|local|remote [csv-file]');
const load = async (name) => JSON.parse(await readFile(path.join(dir, name + '.json'), 'utf8'));
const subscribers = await load('v4-subscribers'), tags = await load('tags'), broadcasts = await load('broadcasts');
const templates = await load('v4-templates'), forms = await load('v4-forms'), sequences = await load('v4-sequences'), posts = await load('v4-posts');
const csv = process.argv[3] ? parseCsv(await readFile(path.resolve(process.argv[3]), 'utf8')) : [];
const csvByEmail = new Map(csv.map((row) => [row.email.trim().toLowerCase(), row]));
const quote = (value) => value == null ? 'NULL' : "'" + String(value).replaceAll("'", "''") + "'";
const stable = (value) => createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
const sql = [], statuses = {}, unknownStates = new Set();
const batchId = 'kit_' + stable(JSON.stringify({ subscribers, broadcasts, tags, templates, forms, sequences, posts }));
const statusMap = { active: 'subscribed', inactive: 'pending', cancelled: 'unsubscribed', canceled: 'unsubscribed', bounced: 'bounced', complained: 'complained', blocked: 'blocked' };
const contactFor = (email) => `(SELECT id FROM crm_contacts WHERE email=${quote(email)})`;
const emails = new Set();
for (const tag of tags) sql.push(`INSERT INTO crm_tags(id,name,kit_id) VALUES(${quote('kit_tag_' + tag.id)},${quote(tag.name.trim())},${quote(tag.id)}) ON CONFLICT(name) DO UPDATE SET kit_id=coalesce(crm_tags.kit_id,excluded.kit_id);`);
for (const subscriber of subscribers) {
  const email = String(subscriber.email_address || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || emails.has(email)) throw new Error('Snapshot contains an invalid or duplicate email; import stopped.');
  emails.add(email);
  const row = csvByEmail.get(email), fields = subscriber.fields || {};
  const last = row?.['Last name']?.trim() || row?.Last?.trim() || fields.last_name || fields.last || '';
  const name = [subscriber.first_name || '', last].filter(Boolean).join(' ').trim();
  const status = statusMap[subscriber.state] || 'blocked';
  if (!statusMap[subscriber.state]) unknownStates.add(subscriber.state);
  statuses[status] = (statuses[status] || 0) + 1;
  const custom = JSON.stringify({ kit: { id: subscriber.id, fields, location: subscriber.location || null, attribution: subscriber.attribution || null } });
  const kitSource = `kit-api:${batchId}`;
  sql.push(`INSERT INTO crm_contacts(id,email,name,subscription_status,subscription_source,custom_fields_json,original_subscribed_at) VALUES(${quote('cnt_' + stable('kit:' + email))},${quote(email)},${quote(name)},${quote(status)},${quote(kitSource)},${quote(custom)},${quote(subscriber.created_at)}) ON CONFLICT(email) DO UPDATE SET name=CASE WHEN crm_contacts.name='' THEN excluded.name ELSE crm_contacts.name END,custom_fields_json=CASE WHEN crm_contacts.custom_fields_json='{}' THEN excluded.custom_fields_json ELSE crm_contacts.custom_fields_json END,original_subscribed_at=coalesce(crm_contacts.original_subscribed_at,excluded.original_subscribed_at),subscription_status=CASE WHEN crm_contacts.subscription_status IN ('unsubscribed','bounced','complained','blocked') THEN crm_contacts.subscription_status ELSE excluded.subscription_status END,subscription_source=CASE WHEN crm_contacts.subscription_status IN ('unsubscribed','bounced','complained','blocked') THEN crm_contacts.subscription_source ELSE excluded.subscription_source END;`);
  sql.push(`INSERT INTO crm_contact_sources(contact_id,source,source_id) VALUES(${contactFor(email)},'kit',${quote(subscriber.id)}) ON CONFLICT(source,source_id) DO NOTHING;`);
  sql.push(`INSERT OR IGNORE INTO crm_subscription_events(id,contact_id,status,source,reason) SELECT ${quote('cev_' + stable(batchId + ':' + email))},id,subscription_status,'kit-import','Migrated original KIT subscription state; no email sent' FROM crm_contacts WHERE email=${quote(email)};`);
  for (const tag of subscriber.tags || []) sql.push(`INSERT OR IGNORE INTO crm_contact_tags(contact_id,tag_id) SELECT ${contactFor(email)},id FROM crm_tags WHERE kit_id=${quote(tag.id)};`);
}
for (const item of broadcasts) {
  sql.push(`INSERT OR IGNORE INTO newsletter_broadcasts(id,kit_id,subject,content_html,from_email,source,status,stats_json,source_created_at,source_send_at) VALUES(${quote('kit_' + item.id)},${quote(item.id)},${quote(item.subject || '')},${quote(item.content || '')},${quote(item.email_address || '')},'kit',${quote(item.stats?.status || 'historical')},${quote(JSON.stringify(item.stats || {}))},${quote(item.created_at)},${quote(item.send_at || item.published_at)});`);
}
for (const [kind, rows] of [['template', templates], ['form', forms], ['sequence', sequences], ['post', posts]]) {
  for (const item of rows) sql.push(`INSERT INTO newsletter_resources(id,kind,kit_id,name,definition_json,source) VALUES(${quote(`kit_${kind}_${item.id}`)},${quote(kind)},${quote(item.id)},${quote(item.name || item.title || 'Untitled')},${quote(JSON.stringify(item))},'kit') ON CONFLICT(kind,kit_id) DO UPDATE SET name=excluded.name,definition_json=excluded.definition_json WHERE newsletter_resources.source='kit';`);
}
const summary = { subscribers: subscribers.length, active: statuses.subscribed || 0, suppressed: (statuses.unsubscribed || 0) + (statuses.bounced || 0) + (statuses.complained || 0) + (statuses.blocked || 0), pending: statuses.pending || 0, tags: tags.length, broadcasts: broadcasts.length, templates: templates.length, forms: forms.length, sequences: sequences.length, posts: posts.length };
sql.push(`INSERT OR IGNORE INTO crm_import_batches(id,source,summary_json) VALUES(${quote(batchId)},'KIT API V4 + original CSV',${quote(JSON.stringify(summary))});`);
// A repeat of the identical batch is a no-op, including preference changes and associations.
const guardedSql = sql.map((statement) => statement.replace(/;$/, '') + ';').join('\n');
const file = path.join(dir, 'kit-import.sql');
await writeFile(file, guardedSql);
console.log(JSON.stringify({ mode, summary, statements: sql.length, privateSqlBytes: Buffer.byteLength(guardedSql), unknownStateCount: unknownStates.size }));
if (mode !== 'prepare') {
  const require = createRequire(import.meta.url), wrangler = path.join(path.dirname(require.resolve('wrangler/package.json')), 'bin/wrangler.js');
  const environment = mode === 'remote' ? await cloudflareSessionEnv() : process.env;
  async function cli(args) { return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [wrangler, ...args], { cwd: root, shell: false, windowsHide: true, env: { ...environment, WRANGLER_LOG_PATH: path.join(root, '.wrangler/logs/kit-import.log') }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.on('data', () => {});
    child.on('error', () => reject(new Error('Could not start the import.')));
    child.on('close', (code) => code === 0 ? resolve(output) : reject(new Error('Import failed; raw SQL output withheld to protect client information.')));
  }); }
  const location = mode === 'remote' ? '--remote' : '--local';
  const existing = JSON.parse(await cli(['d1', 'execute', 'nutriall-db', location, '--command', `SELECT id FROM crm_import_batches WHERE id=${quote(batchId)}`, '--json']));
  if (existing[0]?.results?.length) console.log('The identical snapshot is already imported; no data changed.');
  else { await cli(['d1', 'execute', 'nutriall-db', location, '--file', file, '--yes']); console.log('Snapshot import completed. No messages were sent.'); }
}
