import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';

const root = path.resolve(import.meta.dirname, '..');
const credentials = JSON.parse(await readFile(path.join(root, '.kit-migration-secrets.json'), 'utf8'));
const directory = path.join(root, 'tmp/kit-private');
await mkdir(directory, { recursive: true });
const summary = { api_version: 4, exported_at: new Date().toISOString(), resources: {}, unavailable: [] };
async function get(resource, params = {}, optional = false) {
  if (!/^(subscribers|email_templates|sequences|snippets|forms|segments|posts)(\/[0-9]+(\/emails(\/[0-9]+)?)?)?$/.test(resource)) throw new Error('Endpoint outside migration read scope.');
  const url = new URL(`https://api.kit.com/v4/${resource}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  await pause(600);
  const response = await fetch(url, { method: 'GET', headers: { 'X-Kit-Api-Key': credentials.v4Key }, redirect: 'error', signal: AbortSignal.timeout(30000) });
  if (!response.ok) {
    if (optional && [403, 404, 422].includes(response.status)) { summary.unavailable.push({ resource, status: response.status }); return null; }
    throw new Error(`KIT read failed (${response.status}); details withheld.`);
  }
  return response.json();
}
async function all(resource, field, params = {}) {
  const rows = [], cursors = new Set();
  let after;
  for (let page = 0; page < 1000; page++) {
    const data = await get(resource, { per_page: 1000, ...params, ...(after ? { after } : {}) });
    if (!Array.isArray(data[field])) throw new Error('Unexpected KIT pagination response.');
    rows.push(...data[field]);
    if (!data.pagination?.has_next_page) return rows;
    after = data.pagination.end_cursor;
    if (!after || cursors.has(after)) throw new Error('KIT export pagination did not advance.');
    cursors.add(after);
  }
  throw new Error('KIT export exceeded pagination limit.');
}
async function save(resource, rows) {
  await writeFile(path.join(directory, `v4-${resource}.json`), JSON.stringify(rows));
  summary.resources[resource] = rows.length;
  console.log(JSON.stringify({ saved: resource, records: rows.length }));
}
try {
  const subscribers = await all('subscribers', 'subscribers', { status: 'all', include: 'tags,attribution,location' });
  await save('subscribers', subscribers);
  summary.subscriberStates = subscribers.reduce((counts, row) => ({ ...counts, [row.state]: (counts[row.state] || 0) + 1 }), {});
  const templates = await all('email_templates', 'email_templates');
  for (const template of templates) {
    const detail = await get(`email_templates/${template.id}`, {}, true);
    if (detail?.email_template) Object.assign(template, detail.email_template);
  }
  await save('templates', templates);
  const sequences = await all('sequences', 'sequences');
  for (const sequence of sequences) {
    sequence.emails = await all(`sequences/${sequence.id}/emails`, 'emails', { include_content: true });
    for (const email of sequence.emails) {
      if (!email.content) {
        const detail = await get(`sequences/${sequence.id}/emails/${email.id}`, {}, true);
        if (detail?.sequence_email) Object.assign(email, detail.sequence_email);
      }
    }
  }
  await save('sequences', sequences);
  for (const [resource, field] of [['snippets', 'snippets'], ['forms', 'forms'], ['segments', 'segments'], ['posts', 'posts']]) await save(resource, await all(resource, field));
  await writeFile(path.join(directory, 'v4-export-summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ complete: true, ...summary }));
} catch (error) {
  await writeFile(path.join(directory, 'v4-export-summary.json'), JSON.stringify({ ...summary, complete: false }, null, 2));
  console.error(/KIT |Endpoint |Unexpected /.test(error.message) ? error.message : 'KIT export failed; sensitive connection details withheld.');
  process.exitCode = 1;
}
