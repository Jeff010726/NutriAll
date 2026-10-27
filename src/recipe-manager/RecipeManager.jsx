import { useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Search, Upload, Image, ArrowLeft, Eye, LogOut, X, Copy, ExternalLink } from "lucide-react";
import { RecipeBody } from "../components/RecipeBody";
import manifest from "../../assets/recipe-import-manifest.json";

const base = "/api/recipe-manage";
const localeNames = { en: "English", "zh-CN": "简体中文", "zh-TW": "繁體中文", es: "Español" };
const emptyText = () => ({ title: "", category: "", excerpt: "", tags: [], prepTime: "", cookTime: "", servings: "", ingredients: [], instructions: [], nutrition: [], diabetesNote: "", carbAwareness: "" });
const newRecipe = () => ({ id: null, slug: "", revision: 0, status: "draft", document: { image: "", originalCard: "", date: new Date().toISOString().slice(0,10), translations: { en: emptyText() } } });
async function api(url, options = {}) {
  const response = await fetch(base + url, { credentials: "same-origin", ...options, headers: { ...(options.body && typeof options.body === "string" ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "请求失败，请重试。");
    error.status = response.status; throw error;
  }
  return data;
}
const list = (value) => value.split("\n");

export function RecipeManager() {
  const [admin, setAdmin] = useState(undefined);
  const [recipes, setRecipes] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [locale, setLocale] = useState("en");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const [picker, setPicker] = useState(null);
  const [uploaded, setUploaded] = useState([]);
  const dirtyRef = useRef(false);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  function showError(error) { setError(error.message); if (error.status === 401) setAdmin(null); }
  async function refresh() { setRecipes((await api("/recipes")).recipes); }
  useEffect(() => {
    api("/auth/me").then(async (data) => { setAdmin(data.admin); if (data.admin) setRecipes((await api("/recipes")).recipes); }).catch((error) => { setAdmin(null); showError(error); });
    const leave = (event) => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, []);
  async function login(event) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try { const data = await api("/auth/login", { method: "POST", body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) }); setAdmin(data.admin); await refresh(); }
    catch (error) { showError(error); } finally { setBusy(false); }
  }
  function leaveEditor() {
    if (dirty && !window.confirm("修改尚未保存，确定离开？")) return false;
    setEditing(null); setDirty(false); setPreview(false); setError(""); return true;
  }
  function openEditor(recipe) {
    setEditing(structuredClone(recipe)); setLocale("en"); setDirty(false); setPreview(false); setError(""); setNotice(""); window.scrollTo(0,0);
  }
  function updateDocument(field, value) { setEditing((current) => ({ ...current, document: { ...current.document, [field]: value } })); setDirty(true); }
  function updateText(field, value) {
    setEditing((current) => ({ ...current, document: { ...current.document, translations: { ...current.document.translations, [locale]: { ...(current.document.translations[locale] || emptyText()), [field]: value } } } })); setDirty(true);
  }
  async function save(publish) {
    setBusy(true); setError(""); setNotice("");
    let current = editing;
    try {
      if (!current.id) {
        current = (await api("/recipes", { method: "POST", body: JSON.stringify(current) })).recipe;
        setEditing(current); setDirty(false);
      } else if (!publish) {
        current = (await api(`/recipes/${current.id}`, { method: "PUT", body: JSON.stringify(current) })).recipe;
      }
      if (publish) current = (await api(`/recipes/${current.id}/publish`, { method: "POST", body: JSON.stringify(current) })).recipe;
      setEditing(current); setDirty(false); await refresh(); setNotice(publish ? "食谱已发布，网站已更新。" : "草稿已保存，网站内容尚未更新。");
    } catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function unpublish() {
    if (!window.confirm("下架后，访客将无法查看这份食谱。确定下架？")) return;
    setBusy(true); setError("");
    try { const data = await api(`/recipes/${editing.id}/unpublish`, { method: "POST", headers: { "If-Match": String(editing.revision) } }); setEditing({ ...editing, revision: data.recipe.revision, status: "draft", hasUnpublishedChanges: false }); await refresh(); setNotice("食谱已下架，草稿和图片仍可继续编辑。"); }
    catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function remove() {
    if (!window.confirm(`删除「${editing.document.translations.en.title}」？网站将移除该食谱。`)) return;
    setBusy(true); setError("");
    try { await api(`/recipes/${editing.id}`, { method: "DELETE", headers: { "If-Match": String(editing.revision) } }); setEditing(null); setDirty(false); await refresh(); setNotice("食谱已删除。"); }
    catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function upload(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 8 * 1024 * 1024) { setError("请选择 8 MB 以内的 JPEG、PNG 或 WebP 图片。"); return; }
    setBusy(true); setError("");
    try {
      const data = await api("/images", { method: "POST", headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) }, body: file });
      updateDocument(picker, data.image.url); setUploaded((items) => [data.image, ...items]); setPicker(null);
    } catch (error) { showError(error); } finally { setBusy(false); }
  }
  async function openPicker(field) { setPicker(field); try { setUploaded((await api("/images")).images); } catch (error) { showError(error); } }
  async function copyLink(recipe) {
    try { await navigator.clipboard.writeText(recipe.publicUrl || `https://nutriallwellness.org/recipes/${recipe.slug}`); setNotice("食谱链接已复制。"); } catch { setError("无法复制，请打开食谱后复制地址栏链接。"); }
  }
  if (admin === undefined) return <div className="rm-loading">正在连接食谱管理…</div>;
  if (!admin) return <main className="rm-login"><form onSubmit={login}><img src="/nutriall-logo.png" alt="NutriAll" /><p className="rm-kicker">RECIPE MANAGER</p><h1>登录食谱管理</h1><p>使用 NutriAll 管理后台的同一账号和密码。</p><label>邮箱<input name="email" type="email" required autoComplete="username" /></label><label>密码<input name="password" type="password" required autoComplete="current-password" /></label>{error && <p className="rm-error" role="alert">{error}</p>}<button className="rm-primary" disabled={busy}>{busy ? "正在登录…" : "登录"}</button></form></main>;
  const text = editing?.document.translations[locale] || emptyText();
  const visible = recipes.filter((recipe) => (filter === "all" || recipe.status === filter) && [recipe.slug, ...Object.values(recipe.document.translations).map((item) => item.title)].join(" ").toLowerCase().includes(query.toLowerCase()));
  const originals = Object.keys(manifest.media).map((file) => ({ url: "/" + file, original_name: file.split("/").pop() }));
  return <div className="rm-app">
    <header className="rm-header"><a href="https://nutriallwellness.org/" target="_blank" rel="noreferrer"><img src="/nutriall-logo.png" alt="NutriAll" /></a><span><BookOpen size={19} /> 食谱管理</span><button type="button" onClick={async () => { if (dirty && !window.confirm("修改尚未保存，确定退出？")) return; try { await api("/auth/logout", { method: "POST" }); setAdmin(null); setEditing(null); setDirty(false); } catch (error) { showError(error); } }}><LogOut size={17} />退出</button></header>
    <main className="rm-main">
      {error && <div className="rm-error" role="alert">{error}<button type="button" aria-label="关闭错误" onClick={() => setError("")}><X size={16} /></button></div>}
      {notice && <div className="rm-notice" role="status">{notice}</div>}
      {!editing ? <>
        <div className="rm-title"><div><p className="rm-kicker">NUTRIALL CONTENT</p><h1>食谱</h1><p>{recipes.filter((item) => item.status === "published").length} 已发布 · {recipes.filter((item) => item.status === "draft").length} 草稿</p></div><button type="button" className="rm-primary" onClick={() => openEditor(newRecipe())}><Plus size={19} />创建食谱</button></div>
        <div className="rm-toolbar"><label className="rm-search"><Search size={18} /><input aria-label="搜索食谱" placeholder="搜索食谱名称或网址" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="筛选状态" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option></select><a href="https://nutriallwellness.org/recipes" target="_blank" rel="noreferrer">查看网站 <ExternalLink size={15} /></a></div>
        <div className="rm-list">{visible.map((recipe) => <article className="rm-list-item" key={recipe.id}><img src={recipe.document.image || "/nutriall-logo.png"} alt="" /><div><span className={`rm-badge ${recipe.status}`}>{recipe.status === "published" ? "已发布" : "草稿"}{recipe.hasUnpublishedChanges ? " · 有未发布修改" : ""}</span><h2>{recipe.document.translations["zh-CN"]?.title || recipe.document.translations.en.title}</h2><p>{recipe.document.translations.en.title}</p><small>/recipes/{recipe.slug}</small></div><div className="rm-row-actions"><button type="button" onClick={() => openEditor(recipe)}>编辑</button>{recipe.status === "published" && <button type="button" aria-label={`复制 ${recipe.slug} 链接`} onClick={() => copyLink(recipe)}><Copy size={17} /></button>}</div></article>)}</div>
        {!visible.length && <div className="rm-empty">暂无符合条件的食谱。</div>}
      </> : <>
        <div className="rm-editor-heading"><button type="button" onClick={leaveEditor}><ArrowLeft size={17} />全部食谱</button><span>{dirty ? "有未保存修改" : editing.status === "published" ? "已发布" : "草稿"}</span></div>
        <div className="rm-editor-actions"><h1>{editing.id ? "编辑食谱" : "创建食谱"}</h1><button type="button" onClick={() => setPreview(!preview)}><Eye size={18} />{preview ? "继续编辑" : "预览"}</button><button type="button" disabled={busy} onClick={() => save(false)}>保存草稿</button><button type="button" className="rm-primary" disabled={busy} onClick={() => save(true)}>{busy ? "处理中…" : "发布到网站"}</button></div>
        <div className="rm-editor-options"><label>食谱网址名称<input aria-label="食谱网址名称" value={editing.slug} disabled={editing.status === "published"} placeholder="例如 cucumber-tomato-salad" onChange={(event) => { setEditing({ ...editing, slug: event.target.value }); setDirty(true); }} /></label><label>食谱日期<input type="date" value={editing.document.date} onChange={(event) => updateDocument("date", event.target.value)} /></label></div>
        <div className="rm-languages" aria-label="食谱语言">{Object.entries(localeNames).map(([id, label]) => <button type="button" className={locale === id ? "active" : ""} key={id} onClick={() => setLocale(id)}>{label}{editing.document.translations[id]?.title ? " •" : ""}</button>)}</div>
        {locale !== "en" && <p className="rm-help">未添加的语言会在前台显示英文。添加翻译后，请填写标题、简介、食材和步骤，再发布。<button type="button" onClick={() => { if (!window.confirm("移除此语言的翻译？保存并发布后生效。")) return; const translations = { ...editing.document.translations }; delete translations[locale]; updateDocument("translations", translations); }}>移除此语言翻译</button></p>}
        {preview ? <div className="rm-preview"><p className="rm-preview-label">草稿预览 · 尚未更新网站</p><RecipeBody language={locale} preview recipe={{ ...editing.document, ...(editing.document.translations[locale] || editing.document.translations.en), contentLanguage: editing.document.translations[locale] ? locale : "en" }} /></div> : <div className="rm-editor-grid"><div className="rm-fields">
          <label>标题 · {localeNames[locale]}<input aria-label="食谱标题" value={text.title} onChange={(event) => updateText("title", event.target.value)} /></label>
          <label>简介<textarea aria-label="食谱简介" rows={3} value={text.excerpt} onChange={(event) => updateText("excerpt", event.target.value)} /></label>
          <div className="rm-two"><label>分类<input value={text.category} onChange={(event) => updateText("category", event.target.value)} /></label><label>标签（逗号分隔）<input value={text.tags.join(",")} onChange={(event) => updateText("tags", event.target.value.split(/[,，]/))} /></label></div>
          <div className="rm-three">{[["prepTime", "准备时间"], ["cookTime", "烹调时间"], ["servings", "份量"]].map(([id,label]) => <label key={id}>{label}<input value={text[id]} onChange={(event) => updateText(id, event.target.value)} /></label>)}</div>
          {[["ingredients", "食材（每行一项）"], ["instructions", "做法（每行一个步骤）"], ["nutrition", "营养信息（每行一项）"]].map(([id,label]) => <label key={id}>{label}<textarea aria-label={label} rows={id === "nutrition" ? 4 : 8} value={text[id].join("\n")} onChange={(event) => updateText(id, list(event.target.value))} /></label>)}
          <label>饮食提示<textarea rows={3} value={text.diabetesNote} onChange={(event) => updateText("diabetesNote", event.target.value)} /></label><label>份量与搭配说明<textarea rows={3} value={text.carbAwareness} onChange={(event) => updateText("carbAwareness", event.target.value)} /></label>
        </div><aside className="rm-image-fields">{[["image", "封面照片"], ["originalCard", "原始食谱卡（选填）"]].map(([field,label]) => <section key={field}><h2>{label}</h2>{editing.document[field] ? <img src={editing.document[field]} alt={label} /> : <div className="rm-image-empty"><Image size={30} /></div>}<button type="button" disabled={busy} onClick={() => openPicker(field)}>选择 / 上传图片</button>{field === "originalCard" && editing.document[field] && <button type="button" onClick={() => updateDocument(field, "")}>移除食谱卡</button>}</section>)}<p className="rm-help">图片支持 JPEG、PNG、WebP，最大 8 MB。请使用有授权的图片。修改封面会保存在草稿中，发布后生效。</p></aside></div>}
        {editing.id && <div className="rm-danger-zone">{editing.status === "published" && <button type="button" disabled={busy} onClick={unpublish}>下架食谱</button>}<button type="button" className="rm-delete" disabled={busy} onClick={remove}>删除食谱</button></div>}
      </>}
    </main>
    {picker && <div className="rm-modal" role="dialog" aria-modal="true" aria-label="选择食谱图片"><div className="rm-modal-panel"><header><h2>选择图片</h2><button type="button" aria-label="关闭图片库" disabled={busy} onClick={() => setPicker(null)}><X /></button></header><label className="rm-upload"><Upload size={20} />{busy ? "正在上传…" : "上传图片"}<input aria-label="上传图片" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} /></label><div className="rm-image-library">{[...uploaded, ...originals].map((image) => <button type="button" key={image.url} disabled={busy} onClick={() => { updateDocument(picker, image.url); setPicker(null); }}><img src={image.url} alt={image.original_name} loading="lazy" /></button>)}</div></div></div>}
  </div>;
}
