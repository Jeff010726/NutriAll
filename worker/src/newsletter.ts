import { adminJson, requireAdmin } from './admin';
import { randomId } from './crypto';
import { getDb } from './db';
import type { Env } from './types';

type Contact = { id: string; email: string; name: string; phone: string; language: string; subscription_status: string; revision: number; archived_at: string | null; [key: string]: unknown };
const statuses = ['unknown', 'pending', 'subscribed', 'unsubscribed', 'bounced', 'complained', 'blocked'];
const resourceKinds = ['template', 'snippet', 'form', 'sequence', 'post'];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function text(value: unknown, max: number) {
  if (typeof value !== 'string' || value.length > max) throw new Error('文字为空或超过长度限制。');
  return value.trim();
}
async function body(request: Request) {
  const value = await request.text();
  if (value.length > 800000) throw new Error('内容过大。');
  return JSON.parse(value) as Record<string, unknown>;
}
const csvCell = (value: unknown) => '"' + String(value ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"';
function isRevision(value: unknown): value is number { return Number.isInteger(value) && Number(value) > 0; }

async function sendingStatus(env: Env) {
  if (!env.RESEND_API_KEY || !env.RESEND_DOMAIN_ID) return { configured: false, reason: '营销发信服务尚未配置；保存草稿和迁移不会发出邮件。' };
  try {
    const response = await fetch(`https://api.resend.com/domains/${encodeURIComponent(env.RESEND_DOMAIN_ID)}`, { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` }, signal: AbortSignal.timeout(6000) });
    if (!response.ok) return { configured: false, reason: 'Resend 连接暂不可用；草稿和客户数据仍保留。' };
    const domain = await response.json() as { name: string; status: string };
    return { configured: domain.status === 'verified', provider: 'Resend', domain: domain.name, domainStatus: domain.status, from: env.NEWSLETTER_FROM, reason: domain.status === 'verified' ? 'Resend 已连接，发信域名已验证。客户管理与草稿可用；群发排期和自动化运行尚未启用。' : 'Resend 已连接，正在等待发信域名的 DNS 验证。保存和迁移不会发送邮件。' };
  } catch { return { configured: false, reason: '暂时无法读取发信域名状态，请稍后刷新。' }; }
}

export async function manageNewsletter(request: Request, env: Env, pathname: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const out = (data: unknown, status = 200) => adminJson(request, env, data, { status });
  if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('Origin') && request.headers.get('Origin') !== new URL(request.url).origin) return out({ error: '请从当前管理页面操作。' }, 403);
  const db = getDb(env), url = new URL(request.url);
  try {
    if (pathname === '/summary' && request.method === 'GET') {
      const [counts, broadcastCounts, imports, tagCount] = await Promise.all([
        db.prepare('SELECT subscription_status AS status,COUNT(*) AS count FROM crm_contacts WHERE archived_at IS NULL GROUP BY subscription_status').all(),
        db.prepare('SELECT source,status,COUNT(*) AS count FROM newsletter_broadcasts WHERE archived_at IS NULL GROUP BY source,status').all(),
        db.prepare('SELECT id,source,summary_json,created_at FROM crm_import_batches ORDER BY created_at DESC LIMIT 10').all(),
        db.prepare('SELECT COUNT(*) AS count FROM crm_tags').first(),
      ]);
      return out({ contacts: counts.results, broadcasts: broadcastCounts.results, imports: imports.results, tagCount, sending: await sendingStatus(env) });
    }
    if (pathname === '/tags' && request.method === 'GET') return out({ tags: (await db.prepare('SELECT t.*,COUNT(ct.contact_id) AS contact_count FROM crm_tags t LEFT JOIN crm_contact_tags ct ON ct.tag_id=t.id GROUP BY t.id ORDER BY t.name COLLATE NOCASE').all()).results });
    if (pathname === '/tags' && request.method === 'POST') {
      const data = await body(request), name = text(data.name, 160);
      if (!name) return out({ error: '请填写标签名称。' }, 400);
      await db.prepare('INSERT INTO crm_tags(id,name) VALUES(?,?) ON CONFLICT(name) DO NOTHING').bind(randomId('tag_'), name).run();
      return out({ tag: await db.prepare('SELECT * FROM crm_tags WHERE name=?').bind(name).first() });
    }
    if (pathname === '/contacts/export.csv' && request.method === 'GET') {
      const result = await db.prepare("SELECT c.email,c.name,c.phone,c.language,c.subscription_status,c.original_subscribed_at,c.notes,(SELECT group_concat(t.name,' | ') FROM crm_contact_tags ct JOIN crm_tags t ON t.id=ct.tag_id WHERE ct.contact_id=c.id) AS tags FROM crm_contacts c WHERE c.archived_at IS NULL ORDER BY c.created_at DESC").all<Record<string, unknown>>();
      const columns = ['email', 'name', 'phone', 'language', 'subscription_status', 'original_subscribed_at', 'notes', 'tags'];
      const csv = '\uFEFF' + [columns.map(csvCell).join(','), ...(result.results || []).map((row) => columns.map((column) => csvCell(row[column])).join(','))].join('\r\n');
      return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="nutriall-contacts.csv"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
    }
    if (pathname === '/contacts' && request.method === 'GET') {
      const search = (url.searchParams.get('q') || '').trim().slice(0, 150), status = url.searchParams.get('status'), tag = url.searchParams.get('tag');
      const page = Math.max(1, Math.min(100000, Number(url.searchParams.get('page')) || 1));
      const clauses = ['c.archived_at IS NULL'], args: string[] = [];
      if (search) { clauses.push("(c.email LIKE ? ESCAPE '\\' OR c.name LIKE ? ESCAPE '\\')"); const escaped = '%' + search.replace(/[\\%_]/g, '\\$&') + '%'; args.push(escaped, escaped); }
      if (status && statuses.includes(status)) { clauses.push('c.subscription_status=?'); args.push(status); }
      if (tag) { clauses.push('EXISTS(SELECT 1 FROM crm_contact_tags ct WHERE ct.contact_id=c.id AND ct.tag_id=?)'); args.push(tag); }
      const where = clauses.join(' AND ');
      const [count, rows] = await Promise.all([
        db.prepare(`SELECT COUNT(*) AS total FROM crm_contacts c WHERE ${where}`).bind(...args).first<{ total: number }>(),
        db.prepare(`SELECT c.id,c.email,c.name,c.phone,c.language,c.subscription_status,c.revision,c.created_at,c.original_subscribed_at,(SELECT group_concat(t.name,' | ') FROM crm_contact_tags ct JOIN crm_tags t ON t.id=ct.tag_id WHERE ct.contact_id=c.id) AS tags,(SELECT group_concat(DISTINCT s.source) FROM crm_contact_sources s WHERE s.contact_id=c.id) AS sources FROM crm_contacts c WHERE ${where} ORDER BY c.created_at DESC,c.id LIMIT 50 OFFSET ?`).bind(...args, (page - 1) * 50).all(),
      ]);
      return out({ contacts: rows.results, total: count?.total || 0, page, pageSize: 50 });
    }
    if (pathname === '/contacts' && request.method === 'POST') {
      const data = await body(request), email = text(data.email, 320).toLowerCase(), name = text(data.name || '', 200);
      if (!emailPattern.test(email)) return out({ error: '请填写有效邮箱。' }, 400);
      const existing = await db.prepare('SELECT id FROM crm_contacts WHERE email=?').bind(email).first();
      if (existing) return out({ error: '这个邮箱已在客户名单中，请搜索后编辑。' }, 409);
      const id = randomId('cnt_');
      await db.batch([
        db.prepare('INSERT INTO crm_contacts(id,email,name) VALUES(?,?,?)').bind(id, email, name),
        db.prepare("INSERT INTO crm_contact_sources(contact_id,source,source_id) VALUES(?,'manual',?)").bind(id, id),
      ]);
      return out({ contact: await db.prepare('SELECT * FROM crm_contacts WHERE id=?').bind(id).first() }, 201);
    }
    const contactMatch = pathname.match(/^\/contacts\/(cnt_[a-f0-9]+)(?:\/(subscription))?$/);
    if (contactMatch) {
      const id = contactMatch[1], action = contactMatch[2];
      const contact = await db.prepare('SELECT * FROM crm_contacts WHERE id=? AND archived_at IS NULL').bind(id).first<Contact>();
      if (!contact) return out({ error: '找不到这位联系人。' }, 404);
      if (!action && request.method === 'GET') {
        const [tags, sources, events] = await Promise.all([
          db.prepare('SELECT t.* FROM crm_tags t JOIN crm_contact_tags ct ON ct.tag_id=t.id WHERE ct.contact_id=? ORDER BY t.name').bind(id).all(),
          db.prepare('SELECT source,source_id,created_at FROM crm_contact_sources WHERE contact_id=?').bind(id).all(),
          db.prepare('SELECT status,source,reason,created_at FROM crm_subscription_events WHERE contact_id=? ORDER BY created_at DESC LIMIT 30').bind(id).all(),
        ]);
        return out({ contact, tags: tags.results, sources: sources.results, events: events.results });
      }
      if (action === 'subscription' && request.method === 'POST') {
        const data = await body(request), status = String(data.status), reason = text(data.reason || '', 1000);
        if (!['unknown', 'subscribed', 'unsubscribed', 'blocked'].includes(status) || !reason) return out({ error: '请选择状态并填写变更依据。' }, 400);
        if (status === 'subscribed' && (['bounced', 'complained', 'blocked'].includes(contact.subscription_status) || data.confirmConsent !== true)) return out({ error: '需记录明确的订阅同意；退信、投诉和禁止发送不能在这里直接恢复。' }, 400);
        if (status === 'subscribed' && await db.prepare("SELECT id FROM crm_subscription_events WHERE contact_id=? AND status IN ('bounced','complained','blocked') LIMIT 1").bind(id).first()) return out({ error: '这位联系人有永久抑制记录，需要另外核实后才能恢复。' }, 400);
        if (!isRevision(data.revision) || data.revision !== contact.revision) return out({ error: '资料已改变，请重新打开。' }, 409);
        const result = await db.batch([
          db.prepare("INSERT INTO crm_subscription_events(id,contact_id,status,source,reason) SELECT ?,id,?,'admin',? FROM crm_contacts WHERE id=? AND revision=?").bind(randomId('cev_'), status, reason, id, data.revision),
          db.prepare("UPDATE crm_contacts SET subscription_status=?,subscription_source='admin',revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?").bind(status, id, data.revision),
        ]);
        return result[1].meta.changes ? out({ ok: true }) : out({ error: '资料已改变，请重新打开。' }, 409);
      }
      if (!action && request.method === 'PUT') {
        const data = await body(request);
        if (!isRevision(data.revision) || data.revision !== contact.revision) return out({ error: '资料已改变，请重新打开。' }, 409);
        const name = text(data.name || '', 200), phone = text(data.phone || '', 80), language = text(data.language || '', 30), notes = text(data.notes || '', 10000);
        const tagIds = data.tagIds;
        if (tagIds !== undefined && (!Array.isArray(tagIds) || tagIds.length > 200 || tagIds.some((item) => typeof item !== 'string' || item.length > 100))) return out({ error: '标签无效。' }, 400);
        const operations = [];
        if (Array.isArray(tagIds)) {
          for (const tagId of tagIds) if (!await db.prepare('SELECT id FROM crm_tags WHERE id=?').bind(tagId).first()) return out({ error: '选中的标签不存在，请刷新。' }, 400);
          operations.push(db.prepare('DELETE FROM crm_contact_tags WHERE contact_id=? AND EXISTS(SELECT 1 FROM crm_contacts WHERE id=? AND revision=?)').bind(id, id, data.revision));
          for (const tagId of new Set(tagIds)) operations.push(db.prepare('INSERT INTO crm_contact_tags(contact_id,tag_id) SELECT id,? FROM crm_contacts WHERE id=? AND revision=?').bind(tagId, id, data.revision));
        }
        operations.push(db.prepare('UPDATE crm_contacts SET name=?,phone=?,language=?,notes=?,updated_at=CURRENT_TIMESTAMP,revision=revision+1 WHERE id=? AND revision=?').bind(name, phone, language, notes, id, data.revision));
        const results = await db.batch(operations);
        return results[results.length - 1].meta.changes ? out({ ok: true }) : out({ error: '资料已改变，请重新打开。' }, 409);
      }
      if (!action && request.method === 'DELETE') {
        const revision = Number(request.headers.get('If-Match'));
        if (!isRevision(revision)) return out({ error: '缺少资料版本。' }, 400);
        const result = await db.prepare('UPDATE crm_contacts SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,revision=revision+1 WHERE id=? AND revision=?').bind(id, revision).run();
        return result.meta.changes ? out({ ok: true }) : out({ error: '资料已改变，请重新打开。' }, 409);
      }
    }
    if (pathname === '/broadcasts' && request.method === 'GET') {
      const rows = await db.prepare('SELECT id,kit_id,subject,preview_text,source,status,stats_json,source_created_at,source_send_at,created_at,updated_at,revision FROM newsletter_broadcasts WHERE archived_at IS NULL ORDER BY COALESCE(source_send_at,source_created_at,created_at) DESC').all();
      return out({ broadcasts: rows.results });
    }
    const broadcastMatch = pathname.match(/^\/broadcasts\/(nbl_[a-f0-9]+|kit_[0-9]+)(?:\/(send))?$/);
    if (broadcastMatch || pathname === '/broadcasts') {
      const id = broadcastMatch?.[1], action = broadcastMatch?.[2];
      const current = id ? await db.prepare('SELECT * FROM newsletter_broadcasts WHERE id=? AND archived_at IS NULL').bind(id).first<{ revision: number; source: string }>() : null;
      if (id && !current) return out({ error: '找不到邮件。' }, 404);
      if (action === 'send') return out({ error: '尚未配置营销发信服务。邮件仍保留为草稿，没有发送。' }, 503);
      if (id && request.method === 'GET') return out({ broadcast: current });
      if ((!id && request.method === 'POST') || (id && request.method === 'PUT')) {
        if (current?.source === 'kit') return out({ error: '历史邮件保留原样，请复制为新草稿后编辑。' }, 400);
        const data = await body(request), subject = text(data.subject || '', 300), content = text(data.content_html || '', 500000), preview = text(data.preview_text || '', 500);
        if (current && (!isRevision(data.revision) || data.revision !== current.revision)) return out({ error: '草稿已改变，请重新打开。' }, 409);
        const nextId = id || randomId('nbl_');
        if (id) {
          const result = await db.prepare('UPDATE newsletter_broadcasts SET subject=?,content_html=?,preview_text=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?').bind(subject, content, preview, id, data.revision).run();
          if (!result.meta.changes) return out({ error: '草稿已改变，请重新打开。' }, 409);
        } else await db.prepare('INSERT INTO newsletter_broadcasts(id,subject,content_html,preview_text) VALUES(?,?,?,?)').bind(nextId, subject, content, preview).run();
        return out({ broadcast: await db.prepare('SELECT * FROM newsletter_broadcasts WHERE id=?').bind(nextId).first() }, id ? 200 : 201);
      }
      if (id && request.method === 'DELETE') {
        if (current?.source === 'kit') return out({ error: '历史迁移邮件不可删除。' }, 400);
        const revision = Number(request.headers.get('If-Match'));
        const result = await db.prepare('UPDATE newsletter_broadcasts SET archived_at=CURRENT_TIMESTAMP,revision=revision+1 WHERE id=? AND revision=?').bind(id, revision).run();
        return result.meta.changes ? out({ ok: true }) : out({ error: '草稿已改变，请重新打开。' }, 409);
      }
    }
    if (pathname === '/resources' && request.method === 'GET') {
      const kind = url.searchParams.get('kind') || 'template';
      if (!resourceKinds.includes(kind)) return out({ error: '不支持的内容类型。' }, 400);
      return out({ resources: (await db.prepare('SELECT * FROM newsletter_resources WHERE kind=? AND archived_at IS NULL ORDER BY created_at DESC').bind(kind).all()).results });
    }
    if (pathname === '/resources' && request.method === 'POST') {
      const data = await body(request), kind = String(data.kind), name = text(data.name, 200), definition = text(data.definition || '', 500000);
      if (!resourceKinds.includes(kind) || !name) return out({ error: '请填写名称和有效内容类型。' }, 400);
      const id = randomId('nrs_');
      await db.prepare('INSERT INTO newsletter_resources(id,kind,name,definition_json) VALUES(?,?,?,?)').bind(id, kind, name, JSON.stringify({ content: definition })).run();
      return out({ id }, 201);
    }
    const resourceMatch = pathname.match(/^\/resources\/(nrs_[a-f0-9]+|kit_[a-z]+_[0-9]+)$/);
    if (resourceMatch && ['PUT', 'DELETE'].includes(request.method)) {
      const current = await db.prepare('SELECT source,revision FROM newsletter_resources WHERE id=? AND archived_at IS NULL').bind(resourceMatch[1]).first<{ source: string; revision: number }>();
      if (!current) return out({ error: '找不到内容。' }, 404);
      if (current.source === 'kit') return out({ error: '历史内容保留原样，请复制后编辑。' }, 400);
      if (request.method === 'DELETE') {
        const revision = Number(request.headers.get('If-Match'));
        const result = await db.prepare('UPDATE newsletter_resources SET archived_at=CURRENT_TIMESTAMP,revision=revision+1 WHERE id=? AND revision=?').bind(resourceMatch[1], revision).run();
        return result.meta.changes ? out({ ok: true }) : out({ error: '内容已改变，请重新打开。' }, 409);
      }
      const data = await body(request), name = text(data.name, 200), content = text(data.definition || '', 500000);
      if (!isRevision(data.revision) || !name) return out({ error: '缺少名称或内容版本。' }, 400);
      const result = await db.prepare('UPDATE newsletter_resources SET name=?,definition_json=?,revision=revision+1,updated_at=CURRENT_TIMESTAMP WHERE id=? AND revision=?').bind(name, JSON.stringify({ content }), resourceMatch[1], data.revision).run();
      return result.meta.changes ? out({ ok: true }) : out({ error: '内容已改变，请重新打开。' }, 409);
    }
    return out({ error: '没有这个接口或操作。' }, 404);
  } catch (error) {
    return out({ error: error instanceof Error && !/D1|SQLITE|constraint|JSON|Unexpected/i.test(error.message) ? error.message : '操作未完成，请检查输入后重试。' }, 400);
  }
}
