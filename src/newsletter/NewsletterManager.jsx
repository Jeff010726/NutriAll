import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Send, FileText, Tags, Layers, Settings, LogOut, Search, Plus, ArrowLeft, Download, X, Copy, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

const base = '/api/newsletter-manage';
const statusNames = { unknown: '未订阅', pending: '待确认', subscribed: '已订阅', unsubscribed: '已退订', bounced: '永久退信', complained: '投诉', blocked: '禁止发送' };
const sourceNames = { kit: 'KIT', users: '网站会员', bookings: '网站预约', class_signups: '课程报名', community_inquiries: '社区合作', manual: '手动添加' };
const nav = [ ['dashboard', '总览', LayoutDashboard], ['contacts', '客户与订阅者', Users], ['broadcasts', '群发邮件', Send], ['template', '邮件模板', FileText], ['tags', '标签', Tags], ['form', '表单与落地页', Layers], ['sequence', '邮件序列', BookOpen], ['post', '历史公开文章', FileText], ['settings', '设置与迁移', Settings] ];
async function api(path, options = {}) {
  const response = await fetch(base + path, { credentials: 'same-origin', ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) { const error = new Error(data.error || '连接失败，请重试。'); error.status = response.status; throw error; }
  return data;
}
const date = (value) => value ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : value.replace(' ', 'T') + 'Z').toLocaleDateString('zh-CN') : '—';
const parse = (value, fallback = {}) => { try { return JSON.parse(value); } catch { return fallback; } };
function Preview({ html }) {
  const policy = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; form-action 'none'; base-uri 'none';";
  // Remove network attributes before HTML parsing; CSP and the empty sandbox remain the security boundaries.
  const inert = (html || '<p>还没有正文。</p>').replace(/\b(src|srcset|href|poster|background|action)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '$1=""');
  return <div className="nl-preview"><p>邮件预览 · 远程图片暂不加载，避免触发旧邮件的打开统计。</p><iframe title="邮件内容预览" sandbox="" referrerPolicy="no-referrer" srcDoc={`<!doctype html><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font:16px/1.65 Arial,sans-serif;color:#26352f;overflow-wrap:anywhere}img,table{max-width:100%}</style>${inert}`} /></div>;
}

export function NewsletterManager() {
  const [admin, setAdmin] = useState(undefined), [view, setView] = useState('dashboard');
  const [summary, setSummary] = useState(null), [contacts, setContacts] = useState([]), [total, setTotal] = useState(0), [tags, setTags] = useState([]), [broadcasts, setBroadcasts] = useState([]), [resources, setResources] = useState([]);
  const [query, setQuery] = useState(''), [status, setStatus] = useState(''), [tag, setTag] = useState(''), [page, setPage] = useState(1);
  const [contact, setContact] = useState(null), [contactExtra, setContactExtra] = useState({}), [mail, setMail] = useState(null), [resource, setResource] = useState(null);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [mailFilter, setMailFilter] = useState('all'), [preview, setPreview] = useState(false);
  function fail(error) { if (error.status === 401) setAdmin(null); setError(error.message); }
  useEffect(() => { api('/auth/me').then((data) => setAdmin(data.admin || data.email ? data : null)).catch(() => setAdmin(null)); }, []);
  useEffect(() => {
    if (!admin) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const data = await (view === 'contacts' ? api(`/contacts?${new URLSearchParams({ q: query, status, tag, page: String(page) })}`) : view === 'broadcasts' ? api('/broadcasts') : ['template', 'form', 'sequence', 'post'].includes(view) ? api('/resources?kind=' + view) : view === 'tags' ? api('/tags') : api('/summary'));
        if (!active) return;
        if (view === 'contacts') { setContacts(data.contacts); setTotal(data.total); }
        else if (view === 'broadcasts') setBroadcasts(data.broadcasts);
        else if (['template', 'form', 'sequence', 'post'].includes(view)) setResources(data.resources);
        else if (view === 'tags') setTags(data.tags);
        else setSummary(data);
      } catch (error) { if (active) fail(error); }
      finally { if (active) setLoading(false); }
    }, query ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [admin, view, query, status, tag, page]);
  useEffect(() => { if (admin) api('/tags').then((data) => setTags(data.tags)).catch(fail); }, [admin]);
  async function refresh() {
    if (view === 'contacts') { const data = await api(`/contacts?${new URLSearchParams({ q: query, status, tag, page: String(page) })}`); setContacts(data.contacts); setTotal(data.total); }
    if (view === 'broadcasts') setBroadcasts((await api('/broadcasts')).broadcasts);
    if (['template', 'form', 'sequence', 'post'].includes(view)) setResources((await api('/resources?kind=' + view)).resources);
    setTags((await api('/tags')).tags);
  }
  function navigate(next) {
    if ((mail?.dirty || contact?.dirty || resource?.dirty) && !window.confirm('还有未保存的修改，确定离开？')) return;
    setView(next); setQuery(''); setPage(1); setContact(null); setMail(null); setResource(null); setNotice(''); setError('');
  }
  useEffect(() => {
    const handler = (event) => { if (mail?.dirty || contact?.dirty || resource?.dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, [mail?.dirty, contact?.dirty, resource?.dirty]);
  async function login(event) {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try { await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) }); setAdmin(await api('/auth/me')); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  async function openContact(id) {
    setBusy(true); setError('');
    try { const data = await api('/contacts/' + id); setContact({ ...data.contact, tagIds: data.tags.map((item) => item.id) }); setContactExtra(data); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  async function saveContact(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api('/contacts/' + contact.id, { method: 'PUT', body: JSON.stringify(contact) }); await openContact(contact.id); await refresh(); setNotice('客户资料已保存。'); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  async function subscription(next) {
    const reason = window.prompt(next === 'subscribed' ? '请记录这位客户何时、通过什么方式明确同意订阅。' : '请填写状态变更原因。');
    if (!reason) return;
    if (next === 'subscribed' && !window.confirm('确认有明确订阅同意记录？这项操作不会立即发送邮件。')) return;
    setBusy(true); setError('');
    try { await api(`/contacts/${contact.id}/subscription`, { method: 'POST', body: JSON.stringify({ status: next, reason, confirmConsent: next === 'subscribed', revision: contact.revision }) }); await openContact(contact.id); await refresh(); setNotice('订阅状态已更新，未发送邮件。'); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  async function createContact() {
    const email = window.prompt('填写客户邮箱。新客户默认未订阅，不会发送邮件。'); if (!email) return;
    setBusy(true); setError('');
    try { const result = await api('/contacts', { method: 'POST', body: JSON.stringify({ email, name: '' }) }); await refresh(); await openContact(result.contact.id); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  async function openMail(id) {
    setBusy(true); setError('');
    try { setMail((await api('/broadcasts/' + id)).broadcast); setPreview(true); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  async function saveMail() {
    setBusy(true); setError('');
    try { const data = await api('/broadcasts' + (mail.id ? '/' + mail.id : ''), { method: mail.id ? 'PUT' : 'POST', body: JSON.stringify(mail) }); setMail(data.broadcast); await refresh(); setNotice('草稿已保存，没有发送。'); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  async function saveResource() {
    setBusy(true); setError('');
    try { await api('/resources' + (resource.id ? '/' + resource.id : ''), { method: resource.id ? 'PUT' : 'POST', body: JSON.stringify(resource) }); setResource(null); await refresh(); setNotice('内容已保存。'); }
    catch (error) { fail(error); } finally { setBusy(false); }
  }
  if (admin === undefined) return <main className="nl-loading">正在连接 NutriAll 管理后台…</main>;
  if (!admin) return <main className="nl-login"><form onSubmit={login}><img src="/nutriall-logo.png" alt="NutriAll" /><span>NEWSLETTER & CONTACTS</span><h1>邮件与客户管理</h1><p>使用现有 NutriAll 管理后台的账号和密码。</p><label>邮箱<input name="email" type="email" required autoComplete="username" /></label><label>密码<input name="password" type="password" required autoComplete="current-password" /></label>{error && <p role="alert" className="nl-error">{error}</p>}<button className="nl-primary" disabled={busy}>{busy ? '正在登录…' : '登录'}</button><a href="https://admin.nutriallwellness.org">返回原管理后台</a></form></main>;
  const totalContacts = (summary?.contacts || []).reduce((sum, item) => sum + item.count, 0);
  const subscribed = summary?.contacts?.find((item) => item.status === 'subscribed')?.count || 0;
  const currentTitle = nav.find(([id]) => id === view)?.[1] || '邮件与客户管理';
  const visibleMails = broadcasts.filter((item) => (mailFilter === 'all' || (mailFilter === 'kit' ? item.source === 'kit' : item.source !== 'kit')) && item.subject.toLowerCase().includes(query.toLowerCase()));
  return <div className="nl-shell"><aside className="nl-sidebar"><a className="nl-brand" href="https://nutriallwellness.org" target="_blank" rel="noreferrer"><img src="/nutriall-logo.png" alt="NutriAll" /><span>邮件与客户管理<small>NutriAll Workspace</small></span></a><nav>{nav.map(([id, label, Icon]) => <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => navigate(id)}><Icon size={19} />{label}</button>)}</nav><a className="nl-old-admin" href="https://admin.nutriallwellness.org" target="_blank" rel="noreferrer">打开预约管理 ↗</a><button className="nl-logout" type="button" onClick={async () => { if ((mail?.dirty || contact?.dirty) && !window.confirm('放弃尚未保存的修改并退出？')) return; try { await api('/auth/logout', { method: 'POST' }); setAdmin(null); setMail(null); setContact(null); setResource(null); } catch (error) { fail(error); } }}><LogOut size={17} />退出登录</button></aside>
    <main className="nl-main"><header className="nl-page-head"><div><p>NUTRIALL WORKSPACE</p><h1>{currentTitle}</h1></div>{view === 'contacts' && <div className="nl-actions"><a className="nl-button" href={base + '/contacts/export.csv'}><Download size={17} />导出名单</a><button className="nl-primary" disabled={busy} onClick={createContact}><Plus size={18} />添加客户</button></div>}{view === 'broadcasts' && !mail && <button className="nl-primary" onClick={() => { setMail({ subject: '', content_html: '', preview_text: '', source: 'nutriall', dirty: false }); setPreview(false); }}><Plus size={18} />新建邮件</button>}</header>
      {error && <div className="nl-error" role="alert">{error}<button onClick={() => setError('')} aria-label="关闭错误"><X size={17} /></button></div>}
      {notice && <div className="nl-notice" role="status">{notice}</div>}
      {loading && <div className="nl-progress" role="status">正在读取…</div>}
      {view === 'dashboard' && summary && <><section className="nl-metrics"><article><span>全部联系人</span><strong>{totalContacts.toLocaleString()}</strong><small>网站客户与 KIT 名单合并去重</small></article><article><span>已订阅电子报</span><strong>{subscribed.toLocaleString()}</strong><small>订阅与预约记录分别管理</small></article><article><span>历史群发</span><strong>{summary.broadcasts.filter((item) => item.source === 'kit').reduce((n, item) => n + item.count, 0)}</strong><small>保留 KIT 原始内容与统计</small></article><article><span>客户标签</span><strong>{summary.tagCount.count}</strong><small>来自 KIT 正式标签关系</small></article></section><section className="nl-grid"><article className="nl-panel"><h2>订阅状态</h2><p>每位客户保留自己的邮件接收状态。</p>{summary.contacts.map((item) => <div className="nl-stat-line" key={item.status}><span><i className={'nl-dot ' + item.status} />{statusNames[item.status]}</span><strong>{item.count.toLocaleString()}</strong></div>)}</article><article className="nl-panel"><h2>从这里开始</h2><button className="nl-launch" onClick={() => navigate('contacts')}><Users size={21} /><span><strong>查找和管理客户</strong><small>查看标签、预约来源和订阅状态</small></span>→</button><button className="nl-launch" onClick={() => navigate('broadcasts')}><Send size={21} /><span><strong>查看历史邮件或写新草稿</strong><small>历史邮件不会重新发送</small></span>→</button><button className="nl-launch" onClick={() => navigate('template')}><FileText size={21} /><span><strong>使用已迁移的模板</strong><small>保留原模板，复制后继续编辑</small></span>→</button></article></section><div className="nl-info"><strong>发送状态</strong><p>{summary.sending.reason}</p></div></>}
      {view === 'contacts' && <><div className="nl-toolbar"><label className="nl-search"><Search size={18} /><input placeholder="搜索姓名或邮箱" aria-label="搜索客户" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><select aria-label="订阅状态" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">全部订阅状态</option>{Object.entries(statusNames).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select><select aria-label="标签筛选" value={tag} onChange={(event) => { setTag(event.target.value); setPage(1); }}><option value="">全部标签</option>{tags.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></div><div className="nl-list-caption">共 {total.toLocaleString()} 位联系人 · 每页 50 位</div><div className="nl-table-wrap"><table><thead><tr><th>客户</th><th>订阅状态</th><th>标签</th><th>来源</th><th>原订阅日期</th><th /></tr></thead><tbody>{contacts.map((item) => <tr key={item.id}><td><button className="nl-person" onClick={() => openContact(item.id)}><span className="nl-avatar">{(item.name || item.email)[0].toUpperCase()}</span><span><strong>{item.name || '未填写姓名'}</strong><small>{item.email}</small></span></button></td><td><span className={'nl-badge ' + item.subscription_status}>{statusNames[item.subscription_status]}</span></td><td><span className="nl-tag-summary">{item.tags || '—'}</span></td><td>{(item.sources || '').split(',').map((source) => sourceNames[source] || source).join('、')}</td><td>{date(item.original_subscribed_at)}</td><td><button onClick={() => openContact(item.id)}>查看</button></td></tr>)}</tbody></table>{!loading && !contacts.length && <div className="nl-empty">没有符合条件的客户。</div>}</div><footer className="nl-pagination"><span>第 {page} / {Math.max(1, Math.ceil(total / 50))} 页</span><button disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} aria-label="上一页"><ChevronLeft size={18} /></button><button disabled={page * 50 >= total || loading} onClick={() => setPage(page + 1)} aria-label="下一页"><ChevronRight size={18} /></button></footer></>}
      {view === 'broadcasts' && !mail && <><div className="nl-toolbar"><div className="nl-tabs">{[['all', '全部'], ['kit', 'KIT 历史'], ['draft', '新草稿']].map(([id, label]) => <button className={mailFilter === id ? 'active' : ''} key={id} onClick={() => setMailFilter(id)}>{label}</button>)}</div><label className="nl-search"><Search size={17} /><input aria-label="搜索邮件" placeholder="搜索邮件主题" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div><div className="nl-table-wrap"><table><thead><tr><th>邮件主题</th><th>日期</th><th>收件人</th><th>打开率</th><th>点击率</th><th>退订</th><th /></tr></thead><tbody>{visibleMails.map((item) => { const stats = parse(item.stats_json); return <tr key={item.id}><td><button className="nl-mail-subject" onClick={() => openMail(item.id)}><strong>{item.subject || '无标题草稿'}</strong><small>{item.source === 'kit' ? 'KIT 历史邮件' : 'NutriAll 草稿'}</small></button></td><td>{date(item.source_send_at || item.created_at)}</td><td>{stats.recipients ?? '—'}</td><td>{stats.open_rate == null ? '—' : Number(stats.open_rate).toFixed(2) + '%'}</td><td>{stats.click_rate == null ? '—' : Number(stats.click_rate).toFixed(2) + '%'}</td><td>{stats.unsubscribes ?? '—'}</td><td><button onClick={() => openMail(item.id)}>打开</button></td></tr>; })}</tbody></table>{!loading && !visibleMails.length && <div className="nl-empty">还没有邮件。可以先保存一份草稿。</div>}</div></>}
      {view === 'broadcasts' && mail && <section className="nl-editor"><div className="nl-editor-head"><button onClick={() => { if (!mail.dirty || window.confirm('放弃未保存的修改？')) setMail(null); }}><ArrowLeft size={17} />返回列表</button><div className="nl-actions">{mail.source === 'kit' ? <button className="nl-primary" onClick={() => { setMail({ subject: mail.subject + '（副本）', preview_text: mail.preview_text, content_html: mail.content_html, source: 'nutriall', dirty: true }); setPreview(false); }}><Copy size={17} />复制为新草稿</button> : <><button onClick={() => setPreview(!preview)}>{preview ? '编辑正文' : '预览'}</button><button className="nl-primary" disabled={busy} onClick={saveMail}>保存草稿</button></>}</div></div><label>邮件主题<input readOnly={mail.source === 'kit'} value={mail.subject} onChange={(event) => setMail({ ...mail, subject: event.target.value, dirty: true })} /></label><label>预览文字<input readOnly={mail.source === 'kit'} value={mail.preview_text || ''} onChange={(event) => setMail({ ...mail, preview_text: event.target.value, dirty: true })} /></label>{mail.source === 'kit' && <p className="nl-muted">KIT 历史内容与统计保留原样。需要修改时，先复制为新草稿。</p>}{preview ? <Preview html={mail.content_html} /> : <label>邮件正文（HTML）<textarea className="nl-code" rows={20} value={mail.content_html} onChange={(event) => setMail({ ...mail, content_html: event.target.value, dirty: true })} /></label>}{mail.stats_json && mail.source === 'kit' && <div className="nl-detail-stats">{Object.entries(parse(mail.stats_json)).filter(([, value]) => typeof value === 'number').map(([key, value]) => <div key={key}><span>{({ recipients: '收件人', emails_opened: '打开人数', open_rate: '打开率', click_rate: '点击率', unsubscribes: '退订人数', total_clicks: '点击次数', unsubscribe_rate: '退订率' })[key] || key}</span><strong>{String(value)}{key.endsWith('_rate') ? '%' : ''}</strong></div>)}</div>}</section>}
      {view === 'tags' && <><div className="nl-section-actions"><p>标签名称和成员关系取自 KIT API，名称中的逗号会完整保留。</p><button className="nl-primary" onClick={async () => { const name = window.prompt('新标签名称'); if (!name) return; try { await api('/tags', { method: 'POST', body: JSON.stringify({ name }) }); await refresh(); } catch (error) { fail(error); } }}><Plus size={17} />添加标签</button></div><div className="nl-tag-grid">{tags.map((item) => <button key={item.id} onClick={() => { setTag(item.id); setView('contacts'); setPage(1); }}><Tags size={18} /><span>{item.name}</span><strong>{item.contact_count}</strong></button>)}</div></>}
      {['template', 'form', 'sequence', 'post'].includes(view) && !resource && <><div className="nl-section-actions"><p>{view === 'template' ? '保留 KIT 模板，复制到邮件草稿后继续使用。' : view === 'post' ? '查看已迁移的 KIT 公开文章副本。' : '已迁移 KIT 中可读取的配置，运行状态保持暂停。'}</p>{view === 'template' && <button className="nl-primary" onClick={() => setResource({ kind: 'template', name: '', definition: '', dirty: false })}><Plus size={17} />新模板</button>}</div><div className="nl-resource-grid">{resources.map((item) => { const data = parse(item.definition_json); return <article className="nl-panel" key={item.id}><span className="nl-resource-icon"><FileText size={25} /></span><h2>{item.name}</h2><p>{item.source === 'kit' ? '来自 KIT · 已保存副本' : 'NutriAll 自建'}</p>{view === 'sequence' && <p>{data.emails?.length || 0} 封邮件 · 暂未运行</p>}<button onClick={() => setResource({ ...item, definition: data.content || '', dirty: false })}>查看{view === 'template' ? '模板' : '详情'}</button></article>; })}</div>{!loading && !resources.length && <div className="nl-empty">还没有内容。</div>}</>}
      {resource && <section className="nl-editor"><div className="nl-editor-head"><button onClick={() => { if (!resource.dirty || window.confirm('放弃未保存的修改？')) setResource(null); }}><ArrowLeft size={17} />返回</button>{resource.source !== 'kit' && <button className="nl-primary" disabled={busy} onClick={saveResource}>保存</button>}</div><label>名称<input value={resource.name} readOnly={resource.source === 'kit'} onChange={(event) => setResource({ ...resource, name: event.target.value, dirty: true })} /></label>{['template', 'post'].includes(view) ? <><Preview html={resource.definition} /><button className="nl-primary" onClick={() => { setMail({ subject: resource.name, content_html: resource.definition, preview_text: '', source: 'nutriall', dirty: true }); setResource(null); setView('broadcasts'); }}>{view === 'post' ? '复制为邮件草稿' : '使用模板写邮件'}</button>{resource.source !== 'kit' && <label>模板正文（HTML）<textarea rows={18} className="nl-code" value={resource.definition} onChange={(event) => setResource({ ...resource, definition: event.target.value, dirty: true })} /></label>}</> : view === 'sequence' ? <>{(parse(resource.definition_json).emails || []).map((email, index) => <article className="nl-sequence-step" key={email.id || index}><span>第 {index + 1} 封 · 等待 {email.delay_value} {email.delay_unit}</span><h2>{email.subject}</h2><Preview html={email.content} /></article>)}</> : <dl className="nl-resource-details">{Object.entries(parse(resource.definition_json)).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value)).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl>}</section>}
      {view === 'settings' && summary && <><article className="nl-panel"><h2>发送配置</h2><p>{summary.sending.reason}</p><p>发信与预约通知使用不同配置，迁移历史内容不会发信。</p></article><article className="nl-panel nl-migration"><h2>迁移记录</h2>{summary.imports.length ? summary.imports.map((item) => <div key={item.id}><h3>{item.source}</h3><p>{date(item.created_at)}</p><dl>{Object.entries(parse(item.summary_json)).filter(([, value]) => typeof value === 'number').map(([key, value]) => <div key={key}><dt>{({ subscribers: 'KIT 联系人', active: '有效订阅', suppressed: '退订、退信或投诉', pending: '待确认', broadcasts: '历史群发', tags: '标签', templates: '邮件模板', forms: '表单', sequences: '序列', posts: '公开文章' })[key] || key}</dt><dd>{value}</dd></div>)}</dl></div>) : <p>尚未导入历史资料。</p>}</article></>}
    </main>
{contact && <div className="nl-modal" onMouseDown={(event) => { if (!busy && event.target === event.currentTarget && (!contact.dirty || window.confirm('放弃未保存的修改？'))) setContact(null); }}><section className="nl-drawer" role="dialog" aria-modal="true" aria-label="客户详情"><header><h2>客户资料</h2><button aria-label="关闭客户详情" disabled={busy} onClick={() => { if (!contact.dirty || window.confirm('放弃未保存的修改？')) setContact(null); }}><X size={22} /></button></header><p className="nl-contact-email">{contact.email}</p><span className={'nl-badge ' + contact.subscription_status}>{statusNames[contact.subscription_status]}</span><form onSubmit={saveContact}>{[['name', '姓名'], ['phone', '电话'], ['language', '首选语言']].map(([key, label]) => <label key={key}>{label}<input value={contact[key] || ''} onChange={(event) => setContact({ ...contact, [key]: event.target.value, dirty: true })} /></label>)}<label>内部备注<textarea rows={4} value={contact.notes || ''} onChange={(event) => setContact({ ...contact, notes: event.target.value, dirty: true })} /></label><button className="nl-primary" disabled={busy}>保存客户资料</button></form><section><h3>标签</h3><div className="nl-check-tags">{tags.map((item) => <label key={item.id}><input type="checkbox" checked={contact.tagIds?.includes(item.id) || false} onChange={(event) => setContact({ ...contact, tagIds: event.target.checked ? [...(contact.tagIds || []), item.id] : contact.tagIds.filter((id) => id !== item.id), dirty: true })} />{item.name}</label>)}</div><p className="nl-muted">修改标签后，点击上方“保存客户资料”。</p></section><section><h3>客户来源</h3>{contactExtra.sources?.map((item) => <p key={item.source + item.source_id}>{sourceNames[item.source] || item.source}{item.source === 'bookings' && <small> · 预约记录保留在原后台</small>}</p>)}</section><section><h3>订阅管理</h3><p className="nl-muted">预约和课程记录不受电子报状态影响。</p><div className="nl-actions"><button disabled={busy || contact.dirty} onClick={() => subscription('unsubscribed')}>设为退订</button><button disabled={busy || contact.dirty || ['bounced', 'complained', 'blocked'].includes(contact.subscription_status)} onClick={() => subscription('subscribed')}>记录订阅同意</button></div></section><section><h3>状态记录</h3>{contactExtra.events?.map((item, index) => <article className="nl-event" key={index}><strong>{statusNames[item.status]}</strong><small>{date(item.created_at)} · {item.source}</small><p>{item.reason}</p></article>)}</section></section></div>}
  </div>;
}
