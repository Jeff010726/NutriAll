import { useCallback, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BarChart3, Check, CheckCircle2,
  Clipboard, Copy, Download, ExternalLink, FilePlus2, GripVertical, LayoutList, LoaderCircle,
  LogOut, Menu, MoreHorizontal, Pencil, Plus, Search, Send, Settings2, Trash2, X,
} from "lucide-react";
import { surveyApi, surveyExportUrl } from "./api";

const typeLabels = {
  single: "Single choice",
  multiple: "Multiple choice",
  dropdown: "Dropdown",
  short_text: "Short answer",
  long_text: "Long answer",
  email: "Email",
  date: "Date",
  rating: "Rating scale",
  matrix: "Matrix",
  consent: "Consent",
};

const surveyLanguages = [
  { code: "en", label: "English", short: "EN" },
  { code: "zh-CN", label: "简体中文", short: "中" },
  { code: "es", label: "Español", short: "ES" },
];

const publicCopy = {
  en: {
    survey: "NUTRIALL SURVEY", page: "Page", of: "of", required: "Required", select: "Select an answer",
    agree: "I agree", answer: "Please answer this question.", agreeError: "Please agree before continuing.",
    matrixError: "Please answer every row.", empty: "There are no questions on this page.", back: "Back",
    next: "Next", submit: "Submit", saving: "Saving...", preview: "Preview mode", restart: "Restart preview",
    unavailable: "Survey unavailable", loading: "Loading survey",
    startError: "The response could not be started. Please refresh and try again.",
    privacy: "Your response is anonymous unless this survey asks you for identifying information. Do not include private health details unless the question specifically requests them.",
    language: "Language",
  },
  "zh-CN": {
    survey: "NUTRIALL 问卷", page: "第", of: "页，共", required: "必答", select: "请选择",
    agree: "我同意", answer: "请回答这个问题。", agreeError: "请先同意再继续。", matrixError: "请回答每一行。",
    empty: "这一页暂时没有问题。", back: "返回", next: "下一页", submit: "提交", saving: "正在保存...",
    preview: "预览模式", restart: "重新预览", unavailable: "问卷暂不可用", loading: "正在加载问卷",
    startError: "无法开始填写，请刷新页面后重试。",
    privacy: "除非问卷主动询问身份信息，否则回答默认匿名。请不要填写题目没有要求的个人健康隐私。",
    language: "语言",
  },
  es: {
    survey: "ENCUESTA NUTRIALL", page: "Página", of: "de", required: "Obligatoria", select: "Seleccione una respuesta",
    agree: "Acepto", answer: "Responda esta pregunta.", agreeError: "Debe aceptar antes de continuar.",
    matrixError: "Responda cada fila.", empty: "No hay preguntas en esta página.", back: "Atrás", next: "Siguiente",
    submit: "Enviar", saving: "Guardando...", preview: "Modo de vista previa", restart: "Reiniciar vista previa",
    unavailable: "Encuesta no disponible", loading: "Cargando encuesta",
    startError: "No se pudo iniciar la respuesta. Actualice la página e inténtelo de nuevo.",
    privacy: "Su respuesta es anónima salvo que la encuesta solicite información de identificación. No incluya datos médicos privados que la pregunta no solicite.",
    language: "Idioma",
  },
};

function ensureMultilingualDefinition(definition) {
  return {
    ...definition,
    language: "en",
    defaultLanguage: "en",
    languages: surveyLanguages.map((item) => item.code),
    translations: { "zh-CN": {}, es: {}, ...(definition.translations || {}) },
  };
}

function translatedValue(value, fallback) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function localizeDefinition(rawDefinition, language) {
  const definition = ensureMultilingualDefinition(rawDefinition);
  if (language === "en") return definition;
  const translation = definition.translations?.[language] || {};
  return {
    ...definition,
    title: translatedValue(translation.title, definition.title),
    description: translatedValue(translation.description, definition.description),
    thankYouTitle: translatedValue(translation.thankYouTitle, definition.thankYouTitle),
    thankYouMessage: translatedValue(translation.thankYouMessage, definition.thankYouMessage),
    pages: definition.pages.map((page) => {
      const translatedPage = translation.pages?.[page.id] || {};
      return {
        ...page,
        title: translatedValue(translatedPage.title, page.title),
        description: translatedValue(translatedPage.description, page.description),
        questions: page.questions.map((question) => {
          const translatedQuestion = translatedPage.questions?.[question.id] || {};
          const translateOptions = (items, labels) => items?.map((item) => ({ ...item, label: translatedValue(labels?.[item.id], item.label) }));
          return {
            ...question,
            title: translatedValue(translatedQuestion.title, question.title),
            description: translatedValue(translatedQuestion.description, question.description),
            options: translateOptions(question.options, translatedQuestion.options),
            rows: translateOptions(question.rows, translatedQuestion.rows),
            columns: translateOptions(question.columns, translatedQuestion.columns),
            scaleMinLabel: translatedValue(translatedQuestion.scaleMinLabel, question.scaleMinLabel),
            scaleMaxLabel: translatedValue(translatedQuestion.scaleMaxLabel, question.scaleMaxLabel),
          };
        }),
      };
    }),
  };
}

function translationEditorDefinition(rawDefinition, language) {
  const definition = ensureMultilingualDefinition(rawDefinition);
  if (language === "en") return definition;
  const translation = definition.translations?.[language] || {};
  return {
    ...definition,
    title: translation.title || "",
    description: translation.description || "",
    thankYouTitle: translation.thankYouTitle || "",
    thankYouMessage: translation.thankYouMessage || "",
    pages: definition.pages.map((page) => {
      const translatedPage = translation.pages?.[page.id] || {};
      return {
        ...page,
        title: translatedPage.title || "",
        description: translatedPage.description || "",
        questions: page.questions.map((question) => {
          const translatedQuestion = translatedPage.questions?.[question.id] || {};
          const editOptions = (items, labels) => items?.map((item) => ({ ...item, label: labels?.[item.id] || "" }));
          return {
            ...question,
            title: translatedQuestion.title || "",
            description: translatedQuestion.description || "",
            options: editOptions(question.options, translatedQuestion.options),
            rows: editOptions(question.rows, translatedQuestion.rows),
            columns: editOptions(question.columns, translatedQuestion.columns),
            scaleMinLabel: translatedQuestion.scaleMinLabel || "",
            scaleMaxLabel: translatedQuestion.scaleMaxLabel || "",
          };
        }),
      };
    }),
  };
}

function translationFromEditor(currentTranslation, sourceDefinition, editedDefinition) {
  const translation = structuredClone(currentTranslation || {});
  translation.title = editedDefinition.title || "";
  translation.description = editedDefinition.description || "";
  translation.thankYouTitle = editedDefinition.thankYouTitle || "";
  translation.thankYouMessage = editedDefinition.thankYouMessage || "";
  translation.pages ||= {};
  for (let pageIndex = 0; pageIndex < sourceDefinition.pages.length; pageIndex += 1) {
    const sourcePage = sourceDefinition.pages[pageIndex];
    const editedPage = editedDefinition.pages[pageIndex];
    const translatedPage = translation.pages[sourcePage.id] || { questions: {} };
    translatedPage.title = editedPage.title || "";
    translatedPage.description = editedPage.description || "";
    translatedPage.questions ||= {};
    for (let questionIndex = 0; questionIndex < sourcePage.questions.length; questionIndex += 1) {
      const sourceQuestion = sourcePage.questions[questionIndex];
      const editedQuestion = editedPage.questions[questionIndex];
      translatedPage.questions[sourceQuestion.id] = {
        title: editedQuestion.title || "",
        description: editedQuestion.description || "",
        options: Object.fromEntries((editedQuestion.options || []).map((item) => [item.id, item.label || ""])),
        rows: Object.fromEntries((editedQuestion.rows || []).map((item) => [item.id, item.label || ""])),
        columns: Object.fromEntries((editedQuestion.columns || []).map((item) => [item.id, item.label || ""])),
        scaleMinLabel: editedQuestion.scaleMinLabel || "",
        scaleMaxLabel: editedQuestion.scaleMaxLabel || "",
      };
    }
    translation.pages[sourcePage.id] = translatedPage;
  }
  return translation;
}

function initialPublicLanguage(definition, search) {
  const requested = new URLSearchParams(search).get("lang") || new URLSearchParams(search).get("lng");
  if (surveyLanguages.some((item) => item.code === requested)) return requested;
  const stored = localStorage.getItem("nutriall-survey-language");
  if (surveyLanguages.some((item) => item.code === stored)) return stored;
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith("zh")) return "zh-CN";
  if (browserLanguage.startsWith("es")) return "es";
  return definition.defaultLanguage || "en";
}

const emptyQuestion = (type = "single") => ({
  id: crypto.randomUUID(), type, title: "New question", description: "", required: false,
  options: [
    { id: crypto.randomUUID(), label: "Option 1" },
    { id: crypto.randomUUID(), label: "Option 2" },
  ],
  rows: [{ id: crypto.randomUUID(), label: "Row 1" }],
  columns: [{ id: crypto.randomUUID(), label: "Column 1" }, { id: crypto.randomUUID(), label: "Column 2" }],
  scaleMin: 1, scaleMax: 5, scaleMinLabel: "Not at all", scaleMaxLabel: "Very much", logic: null,
});

function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function Spinner({ label = "Loading" }) {
  return <div className="survey-spinner" role="status"><LoaderCircle aria-hidden="true" /> <span>{label}</span></div>;
}

function ErrorNotice({ message }) {
  if (!message) return null;
  return <div className="survey-error" role="alert">{message}</div>;
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useDocumentTitle("Sign in | NutriAll Surveys");

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await surveyApi("/api/auth/login", { method: "POST", body: { email, password } });
      onLogin(data.admin);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="survey-login-page">
    <div className="survey-login-brand"><img src="/nutriall-logo.png" alt="NutriAll" /></div>
    <section className="survey-login-panel" aria-labelledby="login-title">
      <p className="survey-eyebrow">SURVEY WORKSPACE</p>
      <h1 id="login-title">Welcome back</h1>
      <p>Sign in with your NutriAll administrator account.</p>
      <form onSubmit={submit}>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <ErrorNotice message={error} />
        <button className="survey-button primary wide" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
      </form>
    </section>
  </main>;
}

function Shell({ admin, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  return <div className="survey-shell">
    <header className="survey-mobile-header">
      <Link to="/manage" className="survey-wordmark"><img src="/nutriall-logo.png" alt="NutriAll" /><span>Surveys</span></Link>
      <button className="survey-icon-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Open navigation"><Menu /></button>
    </header>
    <aside className={`survey-sidebar ${mobileOpen ? "is-open" : ""}`}>
      <div className="survey-sidebar-top">
        <Link to="/manage" className="survey-wordmark" onClick={() => setMobileOpen(false)}><img src="/nutriall-logo.png" alt="NutriAll" /><span>Surveys</span></Link>
        <button className="survey-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X /></button>
      </div>
      <nav aria-label="Survey management">
        <Link className={location.pathname === "/manage" ? "active" : ""} to="/manage" onClick={() => setMobileOpen(false)}><LayoutList /> Surveys</Link>
        <Link className={location.pathname === "/manage/new" ? "active" : ""} to="/manage/new" onClick={() => setMobileOpen(false)}><FilePlus2 /> Create survey</Link>
      </nav>
      <div className="survey-sidebar-account">
        <span>{admin.email}</span>
        <button onClick={onLogout}><LogOut /> Sign out</button>
      </div>
    </aside>
    {mobileOpen && <button className="survey-sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="survey-main">{children}</div>
  </div>;
}

function Manager({ admin, onLogout }) {
  return <Shell admin={admin} onLogout={onLogout}>
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="new" element={<NewSurvey />} />
      <Route path=":id/design" element={<EditorPage />} />
      <Route path=":id/results" element={<ResultsPage />} />
      <Route path="*" element={<Navigate replace to="/manage" />} />
    </Routes>
  </Shell>;
}

function statusLabel(status) {
  return { draft: "Draft", open: "Open", closed: "Closed", archived: "Archived" }[status] || status;
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function Dashboard() {
  const [surveys, setSurveys] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const navigate = useNavigate();
  useDocumentTitle("Surveys | NutriAll");

  const load = useCallback(async function loadSurveys() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const data = await surveyApi(`/api/manage/surveys?${params}`);
      setSurveys(data.surveys);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(load, 200);
    return () => clearTimeout(timer);
  }, [load]);

  async function action(survey, name) {
    try {
      if (name === "copy-link") {
        await copyText(survey.publicUrl);
        setCopied(survey.id);
        setTimeout(() => setCopied(""), 1800);
      } else if (name === "duplicate") {
        const data = await surveyApi(`/api/manage/surveys/${survey.id}/duplicate`, { method: "POST" });
        navigate(`/manage/${data.survey.id}/design`);
      } else if (name === "archive" && window.confirm(`Archive “${survey.title}”?`)) {
        await surveyApi(`/api/manage/surveys/${survey.id}`, { method: "DELETE" });
        await load();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return <main className="survey-admin-page">
    <header className="survey-page-header">
      <div><p className="survey-eyebrow">WORKSPACE</p><h1>Surveys</h1><p>Create, share, and review all of your questionnaires.</p></div>
      <Link className="survey-button primary" to="/manage/new"><Plus /> Create survey</Link>
    </header>
    <div className="survey-toolbar">
      <label className="survey-search"><Search /><span className="sr-only">Search surveys</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search surveys" /></label>
      <label className="survey-filter"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All active</option><option value="open">Open</option><option value="draft">Draft</option><option value="closed">Closed</option><option value="archived">Archived</option></select></label>
    </div>
    <ErrorNotice message={error} />
    {loading ? <Spinner label="Loading surveys" /> : surveys.length ? <div className="survey-list">
      {surveys.map((survey) => <article className="survey-list-row" key={survey.id}>
        <div className="survey-list-status"><span className={`survey-status ${survey.status}`}>{statusLabel(survey.status)}</span></div>
        <div className="survey-list-copy">
          <Link to={`/manage/${survey.id}/design`}>{survey.title}</Link>
          <div className="survey-share-line">
            <span>{survey.publicUrl}</span>
            <button disabled={survey.status === "draft"} onClick={() => action(survey, "copy-link")} aria-label={`Copy link for ${survey.title}`}>
              {copied === survey.id ? <Check /> : <Copy />} {copied === survey.id ? "Copied" : "Copy link"}
            </button>
          </div>
          <small>Updated {new Date(survey.updatedAt).toLocaleDateString()}</small>
        </div>
        <div className="survey-response-count"><strong>{survey.completedCount}</strong><span>completed</span></div>
        <div className="survey-list-actions">
          <Link className="survey-button secondary" to={`/manage/${survey.id}/results`}><BarChart3 /> Results</Link>
          <details>
            <summary aria-label={`More actions for ${survey.title}`}><MoreHorizontal /></summary>
            <div className="survey-action-menu">
              <Link to={`/manage/${survey.id}/design`}><Pencil /> Edit</Link>
              <button onClick={() => action(survey, "duplicate")}><Clipboard /> Duplicate</button>
              <button className="danger" onClick={() => action(survey, "archive")}><Archive /> Archive</button>
            </div>
          </details>
        </div>
      </article>)}
    </div> : <section className="survey-empty"><FilePlus2 /><h2>No surveys yet</h2><p>Create your first survey now. You can add the real questionnaire content later.</p><Link className="survey-button primary" to="/manage/new">Create survey</Link></section>}
  </main>;
}

function NewSurvey() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle("Create survey | NutriAll");

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const data = await surveyApi("/api/manage/surveys", { method: "POST", body: { title } });
      navigate(`/manage/${data.survey.id}/design`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return <main className="survey-admin-page narrow">
    <Link className="survey-back-link" to="/manage"><ArrowLeft /> Back to surveys</Link>
    <header className="survey-page-header"><div><p className="survey-eyebrow">NEW SURVEY</p><h1>Name your survey</h1><p>English · 简体中文 · Español</p></div></header>
    <form className="survey-form-panel" onSubmit={submit}>
      <label>Survey title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="For example: Pre-class survey" required autoFocus /></label>
      <ErrorNotice message={error} />
      <div className="survey-form-actions"><Link className="survey-button tertiary" to="/manage">Cancel</Link><button className="survey-button primary" disabled={submitting}>{submitting ? "Creating..." : "Create and edit"}<ArrowRight /></button></div>
    </form>
  </main>;
}

function QuestionEditor({ question, fallbackQuestion = question, index, priorQuestions, onChange, onMove, onDuplicate, onDelete, isTranslation = false }) {
  const choiceType = ["single", "multiple", "dropdown"].includes(question.type);
  const logicSource = priorQuestions.find((item) => item.id === question.logic?.questionId);
  function patch(updates) { onChange({ ...question, ...updates }); }
  function updateList(key, itemIndex, value) {
    patch({ [key]: question[key].map((item, current) => current === itemIndex ? { ...item, label: value } : item) });
  }
  function removeList(key, itemIndex) { patch({ [key]: question[key].filter((_, current) => current !== itemIndex) }); }
  function addList(key, label) { patch({ [key]: [...(question[key] || []), { id: crypto.randomUUID(), label }] }); }

  return <article className="survey-question-editor">
    <div className="survey-question-head">
      <span className="survey-drag-label"><GripVertical /> Q{index + 1}</span>
      {!isTranslation ? <div className="survey-question-actions">
        <button type="button" onClick={() => onMove(-1)} aria-label="Move question up"><ArrowUp /></button>
        <button type="button" onClick={() => onMove(1)} aria-label="Move question down"><ArrowDown /></button>
        <button type="button" onClick={onDuplicate} aria-label="Duplicate question"><Copy /></button>
        <button type="button" className="danger" onClick={onDelete} aria-label="Delete question"><Trash2 /></button>
      </div> : <span className="survey-translation-badge">Translation</span>}
    </div>
    <div className="survey-question-grid">
      <label className="wide">Question<input value={question.title} placeholder={isTranslation ? fallbackQuestion.title : ""} onChange={(event) => patch({ title: event.target.value })} /></label>
      <label>Answer type<select value={question.type} disabled={isTranslation} onChange={(event) => patch({ type: event.target.value })}>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label className="wide">Help text <span className="optional">optional</span><input value={question.description || ""} onChange={(event) => patch({ description: event.target.value })} placeholder={isTranslation ? fallbackQuestion.description || "English help text" : "Add context without making the question longer"} /></label>
    </div>
    {choiceType && <div className="survey-option-editor"><span>Answer choices</span>{(question.options || []).map((option, optionIndex) => <div key={option.id}><input aria-label={`Option ${optionIndex + 1}`} value={option.label} placeholder={isTranslation ? fallbackQuestion.options?.[optionIndex]?.label : ""} onChange={(event) => updateList("options", optionIndex, event.target.value)} />{!isTranslation && <button type="button" onClick={() => removeList("options", optionIndex)} aria-label={`Remove option ${optionIndex + 1}`}><X /></button>}</div>)}{!isTranslation && <button type="button" className="survey-text-button" onClick={() => addList("options", `Option ${(question.options?.length || 0) + 1}`)}><Plus /> Add choice</button>}</div>}
    {question.type === "rating" && <div className="survey-rating-editor"><label>From<input type="number" min="0" max="9" disabled={isTranslation} value={question.scaleMin} onChange={(event) => patch({ scaleMin: Number(event.target.value) })} /></label><label>To<input type="number" min="2" max="10" disabled={isTranslation} value={question.scaleMax} onChange={(event) => patch({ scaleMax: Number(event.target.value) })} /></label><label>Low label<input value={question.scaleMinLabel || ""} placeholder={isTranslation ? fallbackQuestion.scaleMinLabel : ""} onChange={(event) => patch({ scaleMinLabel: event.target.value })} /></label><label>High label<input value={question.scaleMaxLabel || ""} placeholder={isTranslation ? fallbackQuestion.scaleMaxLabel : ""} onChange={(event) => patch({ scaleMaxLabel: event.target.value })} /></label></div>}
    {question.type === "matrix" && <div className="survey-matrix-editor">
      <div><span>Rows</span>{(question.rows || []).map((row, rowIndex) => <div key={row.id}><input value={row.label} placeholder={isTranslation ? fallbackQuestion.rows?.[rowIndex]?.label : ""} onChange={(event) => updateList("rows", rowIndex, event.target.value)} />{!isTranslation && <button type="button" onClick={() => removeList("rows", rowIndex)} aria-label="Remove row"><X /></button>}</div>)}{!isTranslation && <button type="button" className="survey-text-button" onClick={() => addList("rows", `Row ${(question.rows?.length || 0) + 1}`)}><Plus /> Add row</button>}</div>
      <div><span>Columns</span>{(question.columns || []).map((column, columnIndex) => <div key={column.id}><input value={column.label} placeholder={isTranslation ? fallbackQuestion.columns?.[columnIndex]?.label : ""} onChange={(event) => updateList("columns", columnIndex, event.target.value)} />{!isTranslation && <button type="button" onClick={() => removeList("columns", columnIndex)} aria-label="Remove column"><X /></button>}</div>)}{!isTranslation && <button type="button" className="survey-text-button" onClick={() => addList("columns", `Column ${(question.columns?.length || 0) + 1}`)}><Plus /> Add column</button>}</div>
    </div>}
    {!isTranslation && <div className="survey-question-footer">
      <label className="survey-check"><input type="checkbox" checked={Boolean(question.required)} onChange={(event) => patch({ required: event.target.checked })} /> Required</label>
      <details className="survey-logic" open={Boolean(question.logic)}>
        <summary><Settings2 /> Display logic</summary>
        <div>
          {!priorQuestions.length ? <p>Add logic after another question exists.</p> : <>
            <label className="survey-check"><input type="checkbox" checked={Boolean(question.logic)} onChange={(event) => patch({ logic: event.target.checked ? { questionId: priorQuestions[0].id, operator: "equals", value: "" } : null })} /> Only show this question when...</label>
            {question.logic && <div className="survey-logic-controls"><select value={question.logic.questionId} onChange={(event) => { const nextSource = priorQuestions.find((item) => item.id === event.target.value); patch({ logic: { ...question.logic, questionId: event.target.value, value: nextSource?.options?.[0]?.id || "" } }); }}>{priorQuestions.map((prior) => <option key={prior.id} value={prior.id}>{prior.title}</option>)}</select><select value={question.logic.operator} onChange={(event) => patch({ logic: { ...question.logic, operator: event.target.value } })}><option value="equals">is equal to</option><option value="not_equals">is not equal to</option><option value="contains">contains</option></select>{logicSource?.options?.length ? <select aria-label="Conditional answer" value={question.logic.value} onChange={(event) => patch({ logic: { ...question.logic, value: event.target.value } })}><option value="">Select an answer</option>{logicSource.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select> : <input value={question.logic.value} onChange={(event) => patch({ logic: { ...question.logic, value: event.target.value } })} placeholder="Answer value" />}</div>}
          </>}
        </div>
      </details>
    </div>}
  </article>;
}

function EditorPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [definition, setDefinition] = useState(null);
  const [activePage, setActivePage] = useState(0);
  const [contentLanguage, setContentLanguage] = useState("en");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useDocumentTitle(`${definition?.title || "Edit survey"} | NutriAll`);

  useEffect(() => {
    surveyApi(`/api/manage/surveys/${id}`).then((data) => {
      setSurvey(data.survey); setDefinition(ensureMultilingualDefinition(data.survey.definition)); setSlug(data.survey.slug);
    }).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    function warnBeforeLeaving(event) {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  function changeDefinition(updater) {
    setDefinition((current) => typeof updater === "function" ? updater(current) : updater);
    setDirty(true);
    setNotice("");
  }

  async function save(statusOverride) {
    setSaving(true); setError("");
    try {
      const data = await surveyApi(`/api/manage/surveys/${id}`, { method: "PUT", body: { definition, slug, status: statusOverride || survey.status } });
      setSurvey(data.survey); setDefinition(ensureMultilingualDefinition(data.survey.definition)); setSlug(data.survey.slug); setDirty(false); setNotice("Draft saved");
      return data.survey;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally { setSaving(false); }
  }

  async function publish() {
    try {
      await save();
      const data = await surveyApi(`/api/manage/surveys/${id}/publish`, { method: "POST" });
      setSurvey(data.survey); setNotice(`Published version ${data.version.versionNumber}`);
    } catch (err) { setError(err.message); }
  }

  async function preview() {
    try { await save(); navigate(`/preview/${id}`); } catch { /* Save displays the error. */ }
  }

  async function changeStatus(nextStatus) {
    try { await save(nextStatus); } catch { /* Error is already displayed. */ }
  }

  function changeEditingDefinition(updater) {
    if (contentLanguage === "en") {
      changeDefinition(updater);
      return;
    }
    changeDefinition((current) => {
      const source = ensureMultilingualDefinition(current);
      const editorDefinition = translationEditorDefinition(source, contentLanguage);
      const edited = typeof updater === "function" ? updater(editorDefinition) : updater;
      return {
        ...source,
        translations: {
          ...source.translations,
          [contentLanguage]: translationFromEditor(source.translations?.[contentLanguage], source, edited),
        },
      };
    });
  }

  function updatePage(updates) {
    changeEditingDefinition((current) => ({ ...current, pages: current.pages.map((page, index) => index === activePage ? { ...page, ...updates } : page) }));
  }

  function updateQuestion(questionIndex, question) {
    const page = translationEditorDefinition(definition, contentLanguage).pages[activePage];
    updatePage({ questions: page.questions.map((item, index) => index === questionIndex ? question : item) });
  }

  function moveQuestion(questionIndex, direction) {
    const questions = [...definition.pages[activePage].questions];
    const target = questionIndex + direction;
    if (target < 0 || target >= questions.length) return;
    [questions[questionIndex], questions[target]] = [questions[target], questions[questionIndex]];
    updatePage({ questions });
  }

  function deleteQuestion(questionIndex) {
    if (!window.confirm("Delete this question?")) return;
    updatePage({ questions: definition.pages[activePage].questions.filter((_, index) => index !== questionIndex) });
  }

  function duplicateQuestion(questionIndex) {
    const questions = [...definition.pages[activePage].questions];
    const clone = structuredClone(questions[questionIndex]);
    clone.id = crypto.randomUUID();
    questions.splice(questionIndex + 1, 0, clone);
    updatePage({ questions });
  }

  function addPage() {
    const page = { id: crypto.randomUUID(), title: `Page ${definition.pages.length + 1}`, description: "", questions: [] };
    changeDefinition({ ...definition, pages: [...definition.pages, page] });
    setActivePage(definition.pages.length);
  }

  function deletePage() {
    if (definition.pages.length === 1 || !window.confirm("Delete this page and all of its questions?")) return;
    changeDefinition({ ...definition, pages: definition.pages.filter((_, index) => index !== activePage) });
    setActivePage(Math.max(0, activePage - 1));
  }

  if (loading) return <main className="survey-admin-page"><Spinner label="Loading editor" /></main>;
  if (!definition || !survey) return <main className="survey-admin-page"><ErrorNotice message={error || "Survey not found"} /></main>;
  const page = definition.pages[activePage];
  const editingDefinition = translationEditorDefinition(definition, contentLanguage);
  const editingPage = editingDefinition.pages[activePage];
  const isTranslation = contentLanguage !== "en";
  const priorPagesQuestions = definition.pages.slice(0, activePage).flatMap((item) => item.questions);

  return <main className="survey-editor-page">
    <header className="survey-editor-header">
      <div className="survey-editor-title"><Link to="/manage" aria-label="Back to surveys"><ArrowLeft /></Link><div><span className={`survey-status ${survey.status}`}>{statusLabel(survey.status)}</span><strong>{definition.title}</strong><small>{dirty ? "Unsaved changes" : notice || "All changes saved"}</small></div></div>
      <div className="survey-editor-actions">
        {survey.publishedVersionId && <a className="survey-button tertiary" href={survey.publicUrl} target="_blank" rel="noreferrer">Open survey <ExternalLink /></a>}
        <button className="survey-button secondary" onClick={preview}>Preview</button>
        <button className="survey-button secondary" onClick={() => save()} disabled={saving}>{saving ? "Saving..." : "Save draft"}</button>
        <button className="survey-button primary" onClick={publish} disabled={saving}><Send /> {survey.publishedVersionId ? "Publish updates" : "Publish"}</button>
      </div>
    </header>
    <ErrorNotice message={error} />
    <div className="survey-editor-layout">
      <aside className="survey-page-nav">
        <div><span>Pages</span>{!isTranslation && <button onClick={addPage} aria-label="Add page"><Plus /></button>}</div>
        {definition.pages.map((item, index) => <button className={activePage === index ? "active" : ""} onClick={() => setActivePage(index)} key={item.id}><span>{index + 1}</span><span>{item.title}</span><small>{item.questions.length}</small></button>)}
        <div className="survey-settings-links">
          <button onClick={() => document.getElementById("survey-details")?.scrollIntoView()}><Settings2 /> Survey details</button>
          <button onClick={() => navigate(`/manage/${id}/results`)}><BarChart3 /> View results</button>
        </div>
      </aside>
      <div className="survey-editor-content">
        <section className="survey-language-panel" aria-label="Survey content language">
          <div><p className="survey-eyebrow">CONTENT LANGUAGE</p><strong>Survey wording</strong></div>
          <div className="survey-language-tabs" role="tablist">{surveyLanguages.map((language) => <button type="button" role="tab" aria-selected={contentLanguage === language.code} className={contentLanguage === language.code ? "active" : ""} onClick={() => setContentLanguage(language.code)} key={language.code}><span>{language.short}</span>{language.label}</button>)}</div>
        </section>
        <section id="survey-details" className="survey-details-panel">
          <div className="survey-section-heading"><div><p className="survey-eyebrow">SURVEY DETAILS</p><h1>Edit survey</h1></div>{survey.publishedVersionId && <label className="survey-inline-status">Collection<select value={survey.status} onChange={(event) => changeStatus(event.target.value)}><option value="open">Open</option><option value="closed">Closed</option></select></label>}</div>
          <div className="survey-question-grid">
            <label className="wide">Title<input value={editingDefinition.title} placeholder={isTranslation ? definition.title : ""} onChange={(event) => changeEditingDefinition({ ...editingDefinition, title: event.target.value })} /></label>
            <label className="wide">Introduction<textarea rows="3" value={editingDefinition.description || ""} placeholder={isTranslation ? definition.description : ""} onChange={(event) => changeEditingDefinition({ ...editingDefinition, description: event.target.value })} /></label>
            {!isTranslation && <label>Share link<div className="survey-slug-input"><span>/s/</span><input value={slug} onChange={(event) => { setSlug(event.target.value); setDirty(true); }} /></div></label>}
          </div>
        </section>
        <section className="survey-page-editor">
          <div className="survey-page-editor-head"><div><p className="survey-eyebrow">PAGE {activePage + 1}</p><input className="survey-page-title-input" value={editingPage.title} placeholder={isTranslation ? page.title : ""} onChange={(event) => updatePage({ title: event.target.value })} aria-label="Page title" /><input className="survey-page-description-input" value={editingPage.description || ""} onChange={(event) => updatePage({ description: event.target.value })} placeholder={isTranslation ? page.description || "English page introduction" : "Optional page introduction"} aria-label="Page introduction" /></div>{!isTranslation && definition.pages.length > 1 && <button className="survey-text-button danger" onClick={deletePage}><Trash2 /> Delete page</button>}</div>
          <div className="survey-question-stack">
            {editingPage.questions.map((question, questionIndex) => <QuestionEditor key={question.id} question={question} fallbackQuestion={page.questions[questionIndex]} isTranslation={isTranslation} index={questionIndex} priorQuestions={[...priorPagesQuestions, ...page.questions.slice(0, questionIndex)]} onChange={(value) => updateQuestion(questionIndex, value)} onMove={(direction) => moveQuestion(questionIndex, direction)} onDuplicate={() => duplicateQuestion(questionIndex)} onDelete={() => deleteQuestion(questionIndex)} />)}
          </div>
          {!isTranslation && <div className="survey-add-question"><select defaultValue="single" id="new-question-type"><option value="single">Single choice</option><option value="multiple">Multiple choice</option><option value="dropdown">Dropdown</option><option value="short_text">Short answer</option><option value="long_text">Long answer</option><option value="email">Email</option><option value="date">Date</option><option value="rating">Rating scale</option><option value="matrix">Matrix</option><option value="consent">Consent</option></select><button className="survey-button secondary" onClick={() => { const type = document.getElementById("new-question-type").value; updatePage({ questions: [...page.questions, emptyQuestion(type)] }); }}><Plus /> Add question</button></div>}
        </section>
        <section className="survey-details-panel">
          <p className="survey-eyebrow">COMPLETION PAGE</p>
          <div className="survey-question-grid"><label className="wide">Heading<input value={editingDefinition.thankYouTitle} placeholder={isTranslation ? definition.thankYouTitle : ""} onChange={(event) => changeEditingDefinition({ ...editingDefinition, thankYouTitle: event.target.value })} /></label><label className="wide">Message<textarea rows="3" value={editingDefinition.thankYouMessage} placeholder={isTranslation ? definition.thankYouMessage : ""} onChange={(event) => changeEditingDefinition({ ...editingDefinition, thankYouMessage: event.target.value })} /></label></div>
        </section>
      </div>
    </div>
  </main>;
}

function answerLabel(question, value) {
  if (Array.isArray(value)) return value.map((item) => question.options?.find((option) => option.id === item)?.label || item).join(", ");
  if (value && typeof value === "object") return Object.entries(value).map(([rowId, columnId]) => `${question.rows?.find((row) => row.id === rowId)?.label || rowId}: ${question.columns?.find((column) => column.id === columnId)?.label || columnId}`).join("; ");
  if (typeof value === "boolean") return value ? "Agreed" : "Not agreed";
  return question.options?.find((option) => option.id === value)?.label || String(value ?? "No answer");
}

function QuestionResult({ question, responses }) {
  const values = responses.map((response) => response.answers[question.id]).filter((value) => value !== undefined && value !== "" && (!Array.isArray(value) || value.length));
  const choices = question.type === "matrix" ? [] : question.options || [];
  if (["single", "multiple", "dropdown"].includes(question.type)) {
    const counts = choices.map((choice) => ({ choice, count: values.filter((value) => Array.isArray(value) ? value.includes(choice.id) : value === choice.id).length }));
    const maximum = Math.max(1, ...counts.map((item) => item.count));
    return <div className="survey-result-bars">{counts.map(({ choice, count }) => <div key={choice.id}><div><span>{choice.label}</span><strong>{count}</strong></div><span className="survey-result-bar"><i style={{ width: `${(count / maximum) * 100}%` }} /></span></div>)}</div>;
  }
  if (question.type === "rating") {
    const numbers = values.map(Number).filter(Number.isFinite);
    const average = numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : 0;
    return <div className="survey-rating-result"><strong>{average.toFixed(1)}</strong><span>average rating from {numbers.length} answers</span></div>;
  }
  return <div className="survey-text-results">{values.length ? values.slice(0, 50).map((value, index) => <p key={`${question.id}-${index}`}>{answerLabel(question, value)}</p>) : <p className="muted">No answers yet.</p>}</div>;
}

function ResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("summary");
  const [selectedResponse, setSelectedResponse] = useState(null);
  useDocumentTitle(`${data?.survey?.title || "Results"} | NutriAll`);
  useEffect(() => { surveyApi(`/api/manage/surveys/${id}/results`).then(setData).catch((err) => setError(err.message)); }, [id]);
  if (!data) return <main className="survey-admin-page">{error ? <ErrorNotice message={error} /> : <Spinner label="Loading results" />}</main>;
  const questionMap = new Map();
  for (const version of data.versions || []) {
    for (const question of version.definition.pages.flatMap((page) => page.questions)) questionMap.set(question.id, question);
  }
  for (const question of data.survey.definition.pages.flatMap((page) => page.questions)) questionMap.set(question.id, question);
  const questions = [...questionMap.values()];
  const completed = data.responses.filter((response) => response.status === "completed");
  const chosen = selectedResponse || completed[0];
  return <main className="survey-admin-page results-page">
    <Link className="survey-back-link" to="/manage"><ArrowLeft /> Back to surveys</Link>
    <header className="survey-page-header"><div><p className="survey-eyebrow">RESULTS</p><h1>{data.survey.title}</h1><p>Responses are anonymous unless the survey itself asks for identifying details.</p></div><a className="survey-button secondary" href={surveyExportUrl(id)}><Download /> Export CSV</a></header>
    <div className="survey-metrics"><div><span>Started</span><strong>{data.metrics.started}</strong></div><div><span>Completed</span><strong>{data.metrics.completed}</strong></div><div><span>Completion rate</span><strong>{data.metrics.completionRate}%</strong></div><div><span>Average time</span><strong>{data.metrics.averageDurationSeconds ? `${Math.max(1, Math.round(data.metrics.averageDurationSeconds / 60))} min` : "-"}</strong></div></div>
    <div className="survey-tabs" role="tablist"><button className={tab === "summary" ? "active" : ""} onClick={() => setTab("summary")} role="tab">Question summary</button><button className={tab === "individual" ? "active" : ""} onClick={() => setTab("individual")} role="tab">Individual responses</button></div>
    {tab === "summary" ? <div className="survey-question-results">{questions.map((question, index) => <section key={question.id}><header><span>Q{index + 1}</span><div><h2>{question.title}</h2><p>{valuesCount(question, completed)} answered</p></div></header><QuestionResult question={question} responses={completed} /></section>)}</div> : <div className="survey-individual-layout">
      <aside>{completed.length ? completed.map((response, index) => <button className={chosen?.id === response.id ? "active" : ""} onClick={() => setSelectedResponse(response)} key={response.id}><strong>Response {completed.length - index}</strong><span>{new Date(response.completedAt).toLocaleString()}</span><small>{response.source}</small></button>) : <p>No completed responses yet.</p>}</aside>
      <section>{chosen ? <><div className="survey-response-meta"><h2>Individual response</h2><span>Completed {new Date(chosen.completedAt).toLocaleString()}</span></div>{questions.map((question, index) => <div className="survey-response-answer" key={question.id}><span>Q{index + 1}</span><div><strong>{question.title}</strong><p>{answerLabel(question, chosen.answers[question.id])}</p></div></div>)}</> : <div className="survey-empty small"><p>Select a completed response.</p></div>}</section>
    </div>}
  </main>;
}

function valuesCount(question, responses) {
  return responses.filter((response) => {
    const value = response.answers[question.id];
    return value !== undefined && value !== "" && (!Array.isArray(value) || value.length);
  }).length;
}

function shouldShow(question, answers) {
  if (!question.logic) return true;
  const answer = answers[question.logic.questionId];
  if (question.logic.operator === "contains") return Array.isArray(answer) ? answer.includes(question.logic.value) : String(answer || "").includes(question.logic.value);
  if (question.logic.operator === "not_equals") return String(answer ?? "") !== question.logic.value;
  return String(answer ?? "") === question.logic.value;
}

function PublicQuestion({ question, index, value, onChange, error, copy }) {
  const id = `question-${question.id}`;
  return <fieldset className={`public-question ${error ? "has-error" : ""}`} aria-describedby={error ? `${id}-error` : undefined}>
    <legend><span>{index + 1}.</span> {question.title} {question.required && <em>{copy.required}</em>}</legend>
    {question.description && <p className="public-question-help">{question.description}</p>}
    {["single", "multiple"].includes(question.type) && <div className="public-choice-list">{(question.options || []).map((option) => <label key={option.id}><input type={question.type === "multiple" ? "checkbox" : "radio"} name={id} checked={question.type === "multiple" ? (value || []).includes(option.id) : value === option.id} onChange={(event) => { if (question.type === "multiple") onChange(event.target.checked ? [...(value || []), option.id] : (value || []).filter((item) => item !== option.id)); else onChange(option.id); }} /><span>{option.label}</span></label>)}</div>}
    {question.type === "dropdown" && <select id={id} aria-label={question.title} value={value || ""} onChange={(event) => onChange(event.target.value)}><option value="">{copy.select}</option>{(question.options || []).map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select>}
    {["short_text", "email", "date"].includes(question.type) && <input id={id} aria-label={question.title} type={question.type === "email" ? "email" : question.type === "date" ? "date" : "text"} value={value || ""} onChange={(event) => onChange(event.target.value)} />}
    {question.type === "long_text" && <textarea id={id} aria-label={question.title} rows="5" value={value || ""} onChange={(event) => onChange(event.target.value)} />}
    {question.type === "rating" && <div className="public-rating"><div className="public-rating-labels"><span>{question.scaleMinLabel}</span><span>{question.scaleMaxLabel}</span></div><div>{Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, offset) => question.scaleMin + offset).map((rating) => <label key={rating}><input type="radio" name={id} checked={String(value) === String(rating)} onChange={() => onChange(String(rating))} /><span>{rating}</span></label>)}</div></div>}
    {question.type === "matrix" && <div className="public-matrix"><table><thead><tr><th></th>{question.columns.map((column) => <th key={column.id}>{column.label}</th>)}</tr></thead><tbody>{question.rows.map((row) => <tr key={row.id}><th>{row.label}</th>{question.columns.map((column) => <td key={column.id}><input type="radio" name={`${id}-${row.id}`} aria-label={`${row.label}: ${column.label}`} checked={value?.[row.id] === column.id} onChange={() => onChange({ ...(value || {}), [row.id]: column.id })} /></td>)}</tr>)}</tbody></table></div>}
    {question.type === "consent" && <label className="public-consent"><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} /><span>{copy.agree}</span></label>}
    {error && <p className="public-question-error" id={`${id}-error`}>{error}</p>}
  </fieldset>;
}

function validatePage(page, answers, copy) {
  const errors = {};
  for (const question of page.questions) {
    if (!question.required || !shouldShow(question, answers)) continue;
    const value = answers[question.id];
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) errors[question.id] = copy.answer;
    if (question.type === "consent" && value !== true) errors[question.id] = copy.agreeError;
    if (question.type === "matrix" && question.rows.some((row) => !value?.[row.id])) errors[question.id] = copy.matrixError;
  }
  return errors;
}

function PublicLanguageSwitcher({ language, onChange }) {
  const copy = publicCopy[language] || publicCopy.en;
  return <label className="public-language-switcher"><span>{copy.language}</span><select aria-label={copy.language} value={language} onChange={(event) => onChange(event.target.value)}>{surveyLanguages.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>;
}

function SurveyRunner({ survey, preview = false }) {
  const location = useLocation();
  const [language, setLanguage] = useState(() => initialPublicLanguage(survey.definition, location.search));
  const definition = useMemo(() => localizeDefinition(survey.definition, language), [language, survey.definition]);
  const copy = publicCopy[language] || publicCopy.en;
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [response, setResponse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [complete, setComplete] = useState(false);
  useDocumentTitle(`${definition.title} | NutriAll`);
  const page = definition.pages[pageIndex];
  const visibleQuestions = page.questions.filter((question) => shouldShow(question, answers));
  const totalQuestionsBefore = definition.pages.slice(0, pageIndex).reduce((sum, item) => sum + item.questions.length, 0);

  useEffect(() => {
    if (preview) return;
    const params = new URLSearchParams(location.search);
    surveyApi(`/api/public/surveys/${encodeURIComponent(survey.slug)}/start`, { method: "POST", body: { source: params.get("source") || "Direct link" } })
      .then(setResponse).catch((err) => setServerError(err.message));
  }, [location.search, preview, survey.slug]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem("nutriall-survey-language", language);
  }, [language]);

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLanguage);
    window.history.replaceState(null, "", url);
  }

  async function next() {
    const currentErrors = validatePage(page, answers, copy);
    setErrors(currentErrors);
    if (Object.keys(currentErrors).length) {
      document.querySelector(".public-question.has-error")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true); setServerError("");
    try {
      if (!preview && response) await surveyApi(`/api/public/responses/${response.responseId}`, { method: "PUT", token: response.token, body: { answers } });
      if (pageIndex < definition.pages.length - 1) {
        setPageIndex((value) => value + 1); setErrors({}); window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (preview) setComplete(true);
      else if (response) {
        await surveyApi(`/api/public/responses/${response.responseId}/submit`, { method: "POST", token: response.token, body: { answers } });
        setComplete(true); window.scrollTo({ top: 0, behavior: "smooth" });
      } else throw new Error(copy.startError);
    } catch (err) { setServerError(err.message); } finally { setSubmitting(false); }
  }

  if (complete) return <main className="public-survey-page"><div className="public-survey-brand"><img src="/nutriall-logo.png" alt="NutriAll" /><PublicLanguageSwitcher language={language} onChange={changeLanguage} /></div><section className="public-complete"><CheckCircle2 /><h1>{definition.thankYouTitle}</h1><p>{definition.thankYouMessage}</p>{preview && <button className="survey-button secondary" onClick={() => { setPageIndex(0); setAnswers({}); setComplete(false); }}>{copy.restart}</button>}</section></main>;

  return <main className="public-survey-page">
    <header className="public-survey-brand"><img src="/nutriall-logo.png" alt="NutriAll" /><div className="public-survey-brand-actions">{preview && <span>{copy.preview}</span>}<PublicLanguageSwitcher language={language} onChange={changeLanguage} /></div></header>
    <div className="public-survey-progress"><span style={{ width: `${((pageIndex + 1) / definition.pages.length) * 100}%` }} /></div>
    <section className="public-survey-form">
      {pageIndex === 0 && <div className="public-survey-intro"><p className="survey-eyebrow">{copy.survey}</p><h1>{definition.title}</h1>{definition.description && <p>{definition.description}</p>}</div>}
      <div className="public-page-heading"><span>{copy.page} {pageIndex + 1} {copy.of} {definition.pages.length}</span><h2>{page.title}</h2>{page.description && <p>{page.description}</p>}</div>
      {visibleQuestions.map((question, index) => <PublicQuestion key={question.id} question={question} copy={copy} index={totalQuestionsBefore + index} value={answers[question.id]} onChange={(value) => { setAnswers((current) => ({ ...current, [question.id]: value })); setErrors((current) => ({ ...current, [question.id]: "" })); }} error={errors[question.id]} />)}
      {!visibleQuestions.length && <p className="public-empty-page">{copy.empty}</p>}
      <ErrorNotice message={serverError} />
      <div className="public-survey-actions">{pageIndex > 0 && <button className="survey-button tertiary" onClick={() => { setPageIndex((value) => value - 1); window.scrollTo(0, 0); }}><ArrowLeft /> {copy.back}</button>}<button className="survey-button primary" onClick={next} disabled={submitting || (!preview && !response)}>{submitting ? copy.saving : pageIndex === definition.pages.length - 1 ? copy.submit : copy.next}<ArrowRight /></button></div>
      <p className="public-survey-privacy">{copy.privacy}</p>
    </section>
  </main>;
}

function PublicSurveyPage() {
  const { slug } = useParams();
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { surveyApi(`/api/public/surveys/${encodeURIComponent(slug)}`).then((data) => setSurvey(data.survey)).catch((err) => setError(err.message)); }, [slug]);
  if (!survey) return <main className="public-survey-page"><div className="public-survey-brand"><img src="/nutriall-logo.png" alt="NutriAll" /></div>{error ? <section className="public-unavailable"><h1>Survey unavailable</h1><p>{error}</p></section> : <Spinner label="Loading survey" />}</main>;
  return <SurveyRunner survey={survey} />;
}

function PreviewPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { surveyApi(`/api/manage/surveys/${id}`).then((data) => setSurvey(data.survey)).catch((err) => setError(err.message)); }, [id]);
  if (!survey) return <main className="public-survey-page">{error ? <ErrorNotice message={error} /> : <Spinner label="Loading preview" />}</main>;
  return <><Link className="survey-preview-return" to={`/manage/${id}/design`}><ArrowLeft /> Return to editor</Link><SurveyRunner survey={survey} preview /></>;
}

function AppRoutes() {
  const [admin, setAdmin] = useState(undefined);
  useEffect(() => { surveyApi("/api/auth/me").then((data) => setAdmin(data.admin)).catch(() => setAdmin(null)); }, []);
  async function logout() { await surveyApi("/api/auth/logout", { method: "POST" }).catch(() => {}); setAdmin(null); }
  if (admin === undefined) return <Spinner label="Opening NutriAll Surveys" />;
  return <Routes>
    <Route path="/s/:slug" element={<PublicSurveyPage />} />
    <Route path="/manage/*" element={admin ? <Manager admin={admin} onLogout={logout} /> : <LoginPage onLogin={setAdmin} />} />
    <Route path="/preview/:id" element={admin ? <PreviewPage /> : <Navigate replace to="/manage" />} />
    <Route path="*" element={<Navigate replace to="/manage" />} />
  </Routes>;
}

export function SurveyApp() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
