// Only GET requests to Kit. Exports contain customer information and stay git-ignored.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as pause } from 'node:timers/promises';

const root = path.resolve(import.meta.dirname, '..');
const credentials = JSON.parse(await readFile(path.join(root, '.kit-migration-secrets.json'), 'utf8'));
const destination = path.join(root, 'tmp/kit-private');
await mkdir(destination, { recursive: true });
let requests = 0;
async function get(resource, params = {}) {
  if (!/^(subscribers|broadcasts|tags|sequences|forms)(\/[0-9]+(\/(stats|subscriptions))?)?$/.test(resource)) throw new Error('Endpoint is outside the read-only export scope.');
  const url = new URL(`https://api.convertkit.com/v3/${resource}`);
  url.searchParams.set('api_secret', credentials.apiSecret);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  await pause(650);
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(30000) });
    requests++;
    if (response.status === 429 && attempt < 2) { await pause(3000 * (attempt + 1)); continue; }
    if (!response.ok) throw new Error(`Kit read failed (${response.status}); request and response withheld.`);
    return response.json();
  }
}
async function all(resource, field) {
  const records = [];
  for (let page = 1; page <= 1000; page++) {
    const result = await get(resource, { page });
    if (!Array.isArray(result[field])) throw new Error('Kit returned an unexpected export structure.');
    records.push(...result[field]);
    if (page >= Number(result.total_pages || 1)) return records;
  }
  throw new Error('Export pagination exceeded its limit.');
}
async function save(name, records) {
  await writeFile(path.join(destination, `${name}.json`), JSON.stringify(records));
  console.log(JSON.stringify({ saved: name, records: records.length, requests }));
}
try {
  const subscribers = await all('subscribers', 'subscribers');
  await save('subscribers', subscribers);
  const tags = await all('tags', 'tags');
  await save('tags', tags);
  const memberships = [];
  for (const tag of tags) {
    for (const subscription of await all(`tags/${tag.id}/subscriptions`, 'subscriptions')) {
      memberships.push({ tag_id: tag.id, subscriber_id: subscription.subscriber.id });
    }
  }
  await save('memberships', memberships);
  const listed = await all('broadcasts', 'broadcasts');
  const broadcasts = [];
  for (const item of listed) {
    const detail = await get(`broadcasts/${item.id}`);
    const stats = await get(`broadcasts/${item.id}/stats`);
    broadcasts.push({ ...detail.broadcast, stats: stats.broadcast?.stats || null });
    if (broadcasts.length % 10 === 0) console.log(JSON.stringify({ reading: 'broadcasts', completed: broadcasts.length, total: listed.length }));
  }
  await save('broadcasts', broadcasts);
  await save('sequences', await all('sequences', 'courses'));
  await save('forms', await all('forms', 'forms'));
  await writeFile(path.join(destination, 'export-summary.json'), JSON.stringify({ exported_at: new Date().toISOString(), api_version: 3, subscribers: subscribers.length, tags: tags.length, memberships: memberships.length, broadcasts: broadcasts.length, limitations: ['V3 active subscriber listing; other subscription states not yet verified', 'Sequence contents and modern templates require additional API access', 'No automation graph API export verified'], requests }, null, 2));
  console.log('Read-only KIT export finished. Personal data is stored only in the ignored private export directory.');
} catch (error) {
  console.error(/Kit |Export |Endpoint /.test(error.message) ? error.message : 'Export failed; connection details withheld. Completed private exports remain available for retry.');
  process.exitCode = 1;
}
