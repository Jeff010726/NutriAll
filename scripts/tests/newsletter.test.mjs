import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { build } = require(require.resolve('esbuild', { paths: [path.dirname(require.resolve('wrangler/package.json'))] }));
const root = path.resolve(import.meta.dirname, '../..'), temporary = await mkdtemp(path.join(tmpdir(), 'nutriall-newsletter-test-'));
await build({ stdin: { contents: 'export * from "./worker/src/newsletter.ts";export { adminLogin } from "./worker/src/admin.ts";', resolveDir: root }, bundle: true, platform: 'node', format: 'esm', outfile: path.join(temporary, 'newsletter.mjs'), plugins: [{ name: 'sockets', setup(builder) { builder.onResolve({ filter: /^cloudflare:sockets$/ }, () => ({ path: 'sockets', namespace: 'mock' })); builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export function connect(){throw new Error("Email must not send during newsletter data tests");}' })); } }] });
const { manageNewsletter, adminLogin } = await import(pathToFileURL(path.join(temporary, 'newsletter.mjs')));
after(() => rm(temporary, { recursive: true }));
async function context() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of (await readdir(path.join(root, 'worker/migrations'))).filter((name) => name.endsWith('.sql')).sort()) sqlite.exec(await readFile(path.join(root, 'worker/migrations', file), 'utf8'));
  const DB = { prepare(sql) { const statement = sqlite.prepare(sql); let values = []; return { bind(...params) { values = params; return this; }, async first() { return statement.get(...values) || null; }, async all() { return { results: statement.all(...values) }; }, async run() { return { meta: statement.run(...values) }; } }; }, async batch(statements) { sqlite.exec('BEGIN'); try { const results = []; for (const statement of statements) results.push(await statement.run()); sqlite.exec('COMMIT'); return results; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } };
  const env = { DB, APP_ENV: 'test', ADMIN_EMAIL: 'owner@example.com', ADMIN_PASSWORD: 'test-password' };
  const response = await adminLogin(new Request('https://newsletter.nutriallwellness.org/api/newsletter-manage/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': crypto.randomUUID() }, body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }) }), env);
  const cookie = response.headers.get('Set-Cookie').split(';')[0];
  const request = (method, data, headers = {}) => new Request('https://newsletter.nutriallwellness.org/api/newsletter-manage/contacts', { method, headers: { Cookie: cookie, Origin: 'https://newsletter.nutriallwellness.org', ...headers }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const call = (method, route, data, headers) => manageNewsletter(request(method, data, headers), env, route);
  return { sqlite, env, request, call };
}

test('new bookings unify customers without changing their marketing preferences or original bookings', async () => {
  const ctx = await context();
  ctx.sqlite.exec("INSERT INTO contact_leads(id,name,email,message) VALUES('booking1','Alice',' Alice@Example.com ','first'); INSERT INTO contact_leads(id,name,email,message) VALUES('booking2','Alice','alice@example.com','second');");
  assert.equal(ctx.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_contacts').get().n, 1);
  assert.equal(ctx.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_contact_sources').get().n, 2);
  assert.equal(ctx.sqlite.prepare('SELECT subscription_status FROM crm_contacts').get().subscription_status, 'unknown');
  ctx.sqlite.exec("DELETE FROM contact_leads WHERE id='booking1'");
  assert.equal(ctx.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_contacts').get().n, 1);
  assert.equal(ctx.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_contact_sources').get().n, 1);
  ctx.sqlite.close();
});

test('contacts require authentication; cross-origin changes and duplicate identities are rejected', async () => {
  const ctx = await context();
  const anonymous = await manageNewsletter(new Request('https://newsletter.nutriallwellness.org/api/newsletter-manage/contacts'), ctx.env, '/contacts');
  assert.equal(anonymous.status, 401);
  assert.equal((await ctx.call('POST', '/contacts', { email: 'a@example.com' }, { Origin: 'https://untrusted.example' })).status, 403);
  const contact = (await (await ctx.call('POST', '/contacts', { email: ' A@Example.com ' })).json()).contact;
  assert.equal(contact.subscription_status, 'unknown');
  assert.equal((await ctx.call('POST', '/contacts', { email: 'a@example.com' })).status, 409);
  ctx.sqlite.close();
});

test('subscription changes require evidence, protect suppressed contacts, and reject stale edits', async () => {
  const ctx = await context();
  let contact = (await (await ctx.call('POST', '/contacts', { email: 'a@example.com' })).json()).contact;
  assert.equal((await ctx.call('POST', `/contacts/${contact.id}/subscription`, { status: 'subscribed', revision: 1 })).status, 400);
  assert.equal((await ctx.call('POST', `/contacts/${contact.id}/subscription`, { status: 'subscribed', reason: 'Explicit request', confirmConsent: true, revision: 1 })).status, 200);
  assert.equal((await ctx.call('PUT', '/contacts/' + contact.id, { name: 'stale', revision: 1 })).status, 409);
  ctx.sqlite.exec("UPDATE crm_contacts SET subscription_status='complained' WHERE email='a@example.com'");
  assert.equal((await ctx.call('POST', `/contacts/${contact.id}/subscription`, { status: 'subscribed', reason: 'Attempted override', confirmConsent: true, revision: 2 })).status, 400);
  assert.equal(ctx.sqlite.prepare('SELECT COUNT(*) AS n FROM crm_subscription_events').get().n, 1);
  ctx.sqlite.close();
});

test('explicit website preferences are respected and cannot bypass a permanent suppression history', async () => {
  const ctx = await context();
  ctx.sqlite.exec("INSERT INTO users(id,email,marketing_opt_in) VALUES('u1','subscribed@example.com',1),('u2','private@example.com',0)");
  assert.equal(ctx.sqlite.prepare("SELECT subscription_status FROM crm_contacts WHERE email='subscribed@example.com'").get().subscription_status, 'subscribed');
  assert.equal(ctx.sqlite.prepare("SELECT subscription_status FROM crm_contacts WHERE email='private@example.com'").get().subscription_status, 'unknown');
  ctx.sqlite.exec("UPDATE users SET marketing_opt_in=0 WHERE id='u1'");
  assert.equal(ctx.sqlite.prepare("SELECT subscription_status FROM crm_contacts WHERE email='subscribed@example.com'").get().subscription_status, 'unsubscribed');
  ctx.sqlite.exec("INSERT INTO crm_subscription_events(id,contact_id,status,source) SELECT 'complaint',id,'complained','test' FROM crm_contacts WHERE email='private@example.com'");
  assert.throws(() => ctx.sqlite.exec("UPDATE users SET marketing_opt_in=1 WHERE id='u2'"), /Permanent suppression/);
  ctx.sqlite.close();
});

test('draft editing uses versions, preserves historical broadcasts and cannot accidentally send', async () => {
  const ctx = await context();
  const draft = (await (await ctx.call('POST', '/broadcasts', { subject: 'Hello', content_html: '<p>Welcome</p>' })).json()).broadcast;
  assert.equal(draft.status, 'draft');
  assert.equal((await ctx.call('PUT', '/broadcasts/' + draft.id, { ...draft, subject: 'Changed' })).status, 200);
  assert.equal((await ctx.call('PUT', '/broadcasts/' + draft.id, { ...draft, subject: 'Stale' })).status, 409);
  assert.equal((await ctx.call('POST', '/broadcasts/' + draft.id + '/send', {})).status, 503);
  ctx.sqlite.exec("INSERT INTO newsletter_broadcasts(id,kit_id,source,subject) VALUES('kit_123','123','kit','Historical')");
  assert.equal((await ctx.call('PUT', '/broadcasts/kit_123', { subject: 'Overwrite', revision: 1 })).status, 400);
  assert.equal((await ctx.call('DELETE', '/broadcasts/kit_123')).status, 400);
  ctx.sqlite.close();
});

test('CSV exports neutralize formulas while preserving customer names; templates can be saved and edited', async () => {
  const ctx = await context();
  await ctx.call('POST', '/contacts', { email: 'a@example.com', name: '=1+1' });
  const csv = await (await ctx.call('GET', '/contacts/export.csv')).text();
  assert.ok(csv.includes("'=1+1"));
  const result = await (await ctx.call('POST', '/resources', { kind: 'template', name: 'Welcome', definition: '<p>Hello</p>' })).json();
  assert.equal((await ctx.call('PUT', '/resources/' + result.id, { name: 'Updated', definition: '<p>New</p>', revision: 1 })).status, 200);
  assert.equal((await ctx.call('PUT', '/resources/' + result.id, { name: 'Stale', definition: '', revision: 1 })).status, 409);
  ctx.sqlite.close();
});
