import { adminJson, requireAdmin } from "./admin";
import { randomId, sha256 } from "./crypto";
import { getDb } from "./db";
import { badRequest, json, readJson } from "./http";
import { checkRateLimit } from "./rateLimit";
import type { Env } from "./types";

type SurveyStatus = "draft" | "open" | "closed" | "archived";
type QuestionType =
  | "single"
  | "multiple"
  | "dropdown"
  | "short_text"
  | "long_text"
  | "email"
  | "date"
  | "rating"
  | "matrix"
  | "consent";

type SurveyOption = { id: string; label: string };
type SurveyLogic = { questionId: string; operator: "equals" | "not_equals" | "contains"; value: string };
type SurveyQuestion = {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  options?: SurveyOption[];
  rows?: SurveyOption[];
  columns?: SurveyOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  logic?: SurveyLogic | null;
};
type SurveyPage = { id: string; title: string; description?: string; questions: SurveyQuestion[] };
type SurveyQuestionTranslation = {
  title: string;
  description: string;
  options: Record<string, string>;
  rows: Record<string, string>;
  columns: Record<string, string>;
  scaleMinLabel: string;
  scaleMaxLabel: string;
};
type SurveyPageTranslation = {
  title: string;
  description: string;
  questions: Record<string, SurveyQuestionTranslation>;
};
type SurveyTranslation = {
  title: string;
  description: string;
  thankYouTitle: string;
  thankYouMessage: string;
  pages: Record<string, SurveyPageTranslation>;
};
type SurveyDefinition = {
  title: string;
  description?: string;
  language: string;
  defaultLanguage: string;
  languages: string[];
  translations: Record<string, SurveyTranslation>;
  pages: SurveyPage[];
  thankYouTitle: string;
  thankYouMessage: string;
};

type SurveyRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: SurveyStatus;
  language: string;
  draft_definition: string;
  published_version_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

type VersionRow = { id: string; survey_id: string; version_number: number; definition: string; created_at: string };
type ResponseRow = {
  id: string;
  survey_id: string;
  version_id: string;
  source: string | null;
  status: "in_progress" | "completed";
  answers: string;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
};

const questionTypes = new Set<QuestionType>([
  "single", "multiple", "dropdown", "short_text", "long_text", "email", "date", "rating", "matrix", "consent",
]);
const statuses = new Set<SurveyStatus>(["draft", "open", "closed", "archived"]);
const surveyLanguages = ["en", "zh-CN", "es"];
const maxDefinitionBytes = 300_000;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeOptions(value: unknown, limit = 60): SurveyOption[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map((item, index) => {
    const source = item && typeof item === "object" ? item as Record<string, unknown> : {};
    return {
      id: cleanText(source.id, 80) || randomId("opt_"),
      label: cleanText(source.label, 300) || `Option ${index + 1}`,
    };
  });
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeLabelMap(value: unknown, options: SurveyOption[]) {
  const source = objectValue(value);
  const result: Record<string, string> = {};
  for (const option of options) result[option.id] = cleanText(source[option.id], 300);
  return result;
}

function normalizeTranslation(value: unknown, pages: SurveyPage[]): SurveyTranslation {
  const source = objectValue(value);
  const pageSource = objectValue(source.pages);
  const translatedPages: Record<string, SurveyPageTranslation> = {};
  for (const page of pages) {
    const translatedPageSource = objectValue(pageSource[page.id]);
    const questionSource = objectValue(translatedPageSource.questions);
    const translatedQuestions: Record<string, SurveyQuestionTranslation> = {};
    for (const question of page.questions) {
      const translatedQuestionSource = objectValue(questionSource[question.id]);
      translatedQuestions[question.id] = {
        title: cleanText(translatedQuestionSource.title, 500),
        description: cleanText(translatedQuestionSource.description, 1_500),
        options: normalizeLabelMap(translatedQuestionSource.options, question.options || []),
        rows: normalizeLabelMap(translatedQuestionSource.rows, question.rows || []),
        columns: normalizeLabelMap(translatedQuestionSource.columns, question.columns || []),
        scaleMinLabel: cleanText(translatedQuestionSource.scaleMinLabel, 100),
        scaleMaxLabel: cleanText(translatedQuestionSource.scaleMaxLabel, 100),
      };
    }
    translatedPages[page.id] = {
      title: cleanText(translatedPageSource.title, 220),
      description: cleanText(translatedPageSource.description, 1_500),
      questions: translatedQuestions,
    };
  }
  return {
    title: cleanText(source.title, 180),
    description: cleanText(source.description, 2_000),
    thankYouTitle: cleanText(source.thankYouTitle, 220),
    thankYouMessage: cleanText(source.thankYouMessage, 1_500),
    pages: translatedPages,
  };
}

function normalizeDefinition(value: unknown): { definition?: SurveyDefinition; error?: string } {
  if (!value || typeof value !== "object") return { error: "Survey definition is required" };
  if (JSON.stringify(value).length > maxDefinitionBytes) return { error: "Survey is too large" };
  const source = value as Record<string, unknown>;
  const title = cleanText(source.title, 180);
  if (!title) return { error: "Survey title is required" };
  if (!Array.isArray(source.pages) || !source.pages.length) return { error: "Add at least one page" };
  if (source.pages.length > 40) return { error: "A survey can have up to 40 pages" };

  let totalQuestions = 0;
  const knownQuestionIds = new Set<string>();
  const pages: SurveyPage[] = [];
  for (let pageIndex = 0; pageIndex < source.pages.length; pageIndex += 1) {
    const pageSource = source.pages[pageIndex] && typeof source.pages[pageIndex] === "object"
      ? source.pages[pageIndex] as Record<string, unknown>
      : {};
    if (!Array.isArray(pageSource.questions)) return { error: `Page ${pageIndex + 1} has invalid questions` };
    const questions: SurveyQuestion[] = [];
    for (let questionIndex = 0; questionIndex < pageSource.questions.length; questionIndex += 1) {
      totalQuestions += 1;
      if (totalQuestions > 250) return { error: "A survey can have up to 250 questions" };
      const questionSource = pageSource.questions[questionIndex] && typeof pageSource.questions[questionIndex] === "object"
        ? pageSource.questions[questionIndex] as Record<string, unknown>
        : {};
      const type = cleanText(questionSource.type, 30) as QuestionType;
      const questionTitle = cleanText(questionSource.title, 500);
      if (!questionTypes.has(type)) return { error: `Question ${totalQuestions} has an unsupported type` };
      if (!questionTitle) return { error: `Question ${totalQuestions} needs a title` };
      let id = cleanText(questionSource.id, 80) || randomId("q_");
      if (knownQuestionIds.has(id)) id = randomId("q_");
      knownQuestionIds.add(id);
      const question: SurveyQuestion = {
        id,
        type,
        title: questionTitle,
        description: cleanText(questionSource.description, 1_500),
        required: Boolean(questionSource.required),
      };
      if (["single", "multiple", "dropdown"].includes(type)) {
        question.options = normalizeOptions(questionSource.options);
        if (!question.options.length) return { error: `Question ${totalQuestions} needs at least one option` };
      }
      if (type === "matrix") {
        question.rows = normalizeOptions(questionSource.rows, 30);
        question.columns = normalizeOptions(questionSource.columns, 20);
        if (!question.rows.length || !question.columns.length) return { error: `Question ${totalQuestions} needs matrix rows and columns` };
      }
      if (type === "rating") {
        question.scaleMin = Math.max(0, Math.min(10, Number(questionSource.scaleMin) || 1));
        question.scaleMax = Math.max(question.scaleMin + 1, Math.min(10, Number(questionSource.scaleMax) || 5));
        question.scaleMinLabel = cleanText(questionSource.scaleMinLabel, 100);
        question.scaleMaxLabel = cleanText(questionSource.scaleMaxLabel, 100);
      }
      if (questionSource.logic && typeof questionSource.logic === "object") {
        const logicSource = questionSource.logic as Record<string, unknown>;
        const operator = cleanText(logicSource.operator, 30) as SurveyLogic["operator"];
        const questionId = cleanText(logicSource.questionId, 80);
        if (questionId && ["equals", "not_equals", "contains"].includes(operator)) {
          question.logic = { questionId, operator, value: cleanText(logicSource.value, 300) };
        }
      }
      questions.push(question);
    }
    pages.push({
      id: cleanText(pageSource.id, 80) || randomId("page_"),
      title: cleanText(pageSource.title, 220) || `Page ${pageIndex + 1}`,
      description: cleanText(pageSource.description, 1_500),
      questions,
    });
  }

  const translationSource = objectValue(source.translations);
  const translations: Record<string, SurveyTranslation> = {};
  for (const language of surveyLanguages.filter((item) => item !== "en")) {
    translations[language] = normalizeTranslation(translationSource[language], pages);
  }

  return {
    definition: {
      title,
      description: cleanText(source.description, 2_000),
      language: "en",
      defaultLanguage: "en",
      languages: [...surveyLanguages],
      translations,
      pages,
      thankYouTitle: cleanText(source.thankYouTitle, 220) || "Thank you",
      thankYouMessage: cleanText(source.thankYouMessage, 1_500) || "Your response has been recorded.",
    },
  };
}

function defaultDefinition(title: string): SurveyDefinition {
  return {
    title,
    description: "",
    language: "en",
    defaultLanguage: "en",
    languages: [...surveyLanguages],
    translations: {
      "zh-CN": normalizeTranslation({}, []),
      es: normalizeTranslation({}, []),
    },
    pages: [{ id: randomId("page_"), title: "Page 1", description: "", questions: [] }],
    thankYouTitle: "Thank you",
    thankYouMessage: "Your response has been recorded.",
  };
}

async function uniqueSlug(env: Env, preferred: string, excludeId?: string) {
  const db = getDb(env);
  const base = slugify(preferred) || `survey-${Date.now().toString(36)}`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = attempt ? `${base}-${attempt + 1}` : base;
    const row = await db.prepare("SELECT id FROM surveys WHERE slug = ? LIMIT 1").bind(candidate).first<{ id: string }>();
    if (!row || row.id === excludeId) return candidate;
  }
  return `${base}-${randomId().slice(0, 8)}`;
}

function serializeSurvey(row: SurveyRow, extra: Record<string, unknown> = {}) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description || "",
    status: row.status,
    language: row.language,
    definition: parseJson<SurveyDefinition>(row.draft_definition, defaultDefinition(row.title)),
    publishedVersionId: row.published_version_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    ...extra,
  };
}

async function getSurvey(env: Env, id: string) {
  return getDb(env).prepare("SELECT * FROM surveys WHERE id = ? LIMIT 1").bind(id).first<SurveyRow>();
}

function publicUrl(request: Request, slug: string) {
  const url = new URL(request.url);
  const origin = url.hostname === "localhost" || url.hostname === "127.0.0.1"
    ? url.origin
    : "https://survey.nutriallwellness.org";
  return `${origin}/s/${slug}`;
}

export async function manageSurveyList(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const url = new URL(request.url);
  const search = cleanText(url.searchParams.get("search"), 100);
  const status = cleanText(url.searchParams.get("status"), 20);
  const conditions: string[] = [];
  const values: string[] = [];
  if (search) {
    conditions.push("(s.title LIKE ? OR s.slug LIKE ?)");
    values.push(`%${search}%`, `%${search}%`);
  }
  if (statuses.has(status as SurveyStatus)) {
    conditions.push("s.status = ?");
    values.push(status);
  } else {
    conditions.push("s.status != 'archived'");
  }
  const rows = await getDb(env).prepare(
    `SELECT s.*, COUNT(r.id) AS response_count,
      SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) AS completed_count
     FROM surveys s LEFT JOIN survey_responses r ON r.survey_id = s.id
     ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
     GROUP BY s.id ORDER BY s.updated_at DESC LIMIT 200`,
  ).bind(...values).all<SurveyRow & { response_count: number; completed_count: number }>();
  return adminJson(request, env, {
    surveys: (rows.results || []).map((row) => serializeSurvey(row, {
      responseCount: Number(row.response_count || 0),
      completedCount: Number(row.completed_count || 0),
      publicUrl: publicUrl(request, row.slug),
    })),
  });
}

export async function manageSurveyCreate(request: Request, env: Env) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const payload = await readJson<{ title?: string }>(request);
  const title = cleanText(payload?.title, 180) || "Untitled survey";
  const language = "en";
  const definition = defaultDefinition(title);
  const survey: SurveyRow = {
    id: randomId("srv_"), title, slug: await uniqueSlug(env, title), description: "", status: "draft", language,
    draft_definition: JSON.stringify(definition), published_version_id: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), published_at: null,
  };
  await getDb(env).prepare(
    `INSERT INTO surveys (id, title, slug, description, status, language, draft_definition, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
  ).bind(survey.id, survey.title, survey.slug, survey.description, survey.language, survey.draft_definition, survey.created_at, survey.updated_at).run();
  return adminJson(request, env, { survey: serializeSurvey(survey, { publicUrl: publicUrl(request, survey.slug) }) }, { status: 201 });
}

export async function manageSurveyGet(request: Request, env: Env, id: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const survey = await getSurvey(env, id);
  if (!survey) return adminJson(request, env, { error: "Survey not found" }, { status: 404 });
  const versions = await getDb(env).prepare(
    "SELECT id, version_number, created_at FROM survey_versions WHERE survey_id = ? ORDER BY version_number DESC",
  ).bind(id).all<{ id: string; version_number: number; created_at: string }>();
  return adminJson(request, env, {
    survey: serializeSurvey(survey, { publicUrl: publicUrl(request, survey.slug), versions: versions.results || [] }),
  });
}

export async function manageSurveyUpdate(request: Request, env: Env, id: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const current = await getSurvey(env, id);
  if (!current) return adminJson(request, env, { error: "Survey not found" }, { status: 404 });
  const payload = await readJson<{ definition?: unknown; slug?: string; status?: string }>(request);
  if (!payload) return badRequest(request, env, "Invalid JSON body");
  const normalized = normalizeDefinition(payload.definition);
  if (!normalized.definition) return badRequest(request, env, normalized.error || "Invalid survey");
  const requestedStatus = cleanText(payload.status, 20) as SurveyStatus;
  const status = statuses.has(requestedStatus) ? requestedStatus : current.status;
  if (status === "open" && !current.published_version_id) return badRequest(request, env, "Publish the survey before opening it");
  const slug = await uniqueSlug(env, cleanText(payload.slug, 72) || current.slug || normalized.definition.title, id);
  const now = new Date().toISOString();
  await getDb(env).prepare(
    `UPDATE surveys SET title = ?, slug = ?, description = ?, status = ?, language = ?, draft_definition = ?, updated_at = ? WHERE id = ?`,
  ).bind(
    normalized.definition.title, slug, normalized.definition.description || "", status,
    normalized.definition.language, JSON.stringify(normalized.definition), now, id,
  ).run();
  const updated = await getSurvey(env, id);
  return adminJson(request, env, { survey: serializeSurvey(updated!, { publicUrl: publicUrl(request, slug) }) });
}

export async function manageSurveyPublish(request: Request, env: Env, id: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const survey = await getSurvey(env, id);
  if (!survey) return adminJson(request, env, { error: "Survey not found" }, { status: 404 });
  const normalized = normalizeDefinition(parseJson(survey.draft_definition, null));
  if (!normalized.definition) return badRequest(request, env, normalized.error || "Invalid survey");
  const count = await getDb(env).prepare("SELECT MAX(version_number) AS version_number FROM survey_versions WHERE survey_id = ?")
    .bind(id).first<{ version_number: number | null }>();
  const version: VersionRow = {
    id: randomId("svv_"), survey_id: id, version_number: Number(count?.version_number || 0) + 1,
    definition: JSON.stringify(normalized.definition), created_at: new Date().toISOString(),
  };
  const db = getDb(env);
  await db.prepare(
    "INSERT INTO survey_versions (id, survey_id, version_number, definition, created_at) VALUES (?, ?, ?, ?, ?)",
  ).bind(version.id, id, version.version_number, version.definition, version.created_at).run();
  await db.prepare(
    "UPDATE surveys SET published_version_id = ?, status = 'open', published_at = ?, updated_at = ? WHERE id = ?",
  ).bind(version.id, version.created_at, version.created_at, id).run();
  const updated = await getSurvey(env, id);
  return adminJson(request, env, {
    survey: serializeSurvey(updated!, { publicUrl: publicUrl(request, updated!.slug) }),
    version: { id: version.id, versionNumber: version.version_number, createdAt: version.created_at },
  });
}

export async function manageSurveyDuplicate(request: Request, env: Env, id: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const source = await getSurvey(env, id);
  if (!source) return adminJson(request, env, { error: "Survey not found" }, { status: 404 });
  const definition = parseJson<SurveyDefinition>(source.draft_definition, defaultDefinition(source.title));
  definition.title = `${definition.title} (copy)`;
  const now = new Date().toISOString();
  const duplicateId = randomId("srv_");
  const slug = await uniqueSlug(env, definition.title);
  await getDb(env).prepare(
    `INSERT INTO surveys (id, title, slug, description, status, language, draft_definition, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?)`,
  ).bind(duplicateId, definition.title, slug, definition.description || "", definition.language, JSON.stringify(definition), now, now).run();
  const duplicate = await getSurvey(env, duplicateId);
  return adminJson(request, env, { survey: serializeSurvey(duplicate!, { publicUrl: publicUrl(request, slug) }) }, { status: 201 });
}

export async function manageSurveyArchive(request: Request, env: Env, id: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const survey = await getSurvey(env, id);
  if (!survey) return adminJson(request, env, { error: "Survey not found" }, { status: 404 });
  await getDb(env).prepare("UPDATE surveys SET status = 'archived', updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), id).run();
  return adminJson(request, env, { ok: true });
}

export async function manageSurveyResults(request: Request, env: Env, id: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const survey = await getSurvey(env, id);
  if (!survey) return adminJson(request, env, { error: "Survey not found" }, { status: 404 });
  const db = getDb(env);
  const [rows, versions] = await Promise.all([
    db.prepare(
    `SELECT id, survey_id, version_id, source, status, answers, started_at, updated_at, completed_at, duration_seconds
     FROM survey_responses WHERE survey_id = ? ORDER BY started_at DESC LIMIT 1000`,
    ).bind(id).all<ResponseRow>(),
    db.prepare("SELECT id, version_number, definition, created_at FROM survey_versions WHERE survey_id = ? ORDER BY version_number ASC")
      .bind(id).all<VersionRow>(),
  ]);
  const responses = (rows.results || []).map((row) => ({
    id: row.id, versionId: row.version_id, source: row.source || "Direct link", status: row.status,
    answers: parseJson<Record<string, unknown>>(row.answers, {}), startedAt: row.started_at,
    updatedAt: row.updated_at, completedAt: row.completed_at, durationSeconds: row.duration_seconds,
  }));
  const completed = responses.filter((response) => response.status === "completed");
  const durations = completed.map((response) => Number(response.durationSeconds || 0)).filter((value) => value > 0);
  return adminJson(request, env, {
    survey: serializeSurvey(survey, { publicUrl: publicUrl(request, survey.slug) }),
    metrics: {
      started: responses.length,
      completed: completed.length,
      completionRate: responses.length ? Math.round((completed.length / responses.length) * 1000) / 10 : 0,
      averageDurationSeconds: durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0,
    },
    versions: (versions.results || []).map((version) => ({
      id: version.id,
      versionNumber: version.version_number,
      definition: parseJson<SurveyDefinition>(version.definition, defaultDefinition(survey.title)),
      createdAt: version.created_at,
    })),
    responses,
  });
}

function csvCell(value: unknown) {
  const text = Array.isArray(value) ? value.join("; ") : value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function manageSurveyExport(request: Request, env: Env, id: string) {
  const unauthorized = await requireAdmin(request, env);
  if (unauthorized) return unauthorized;
  const survey = await getSurvey(env, id);
  if (!survey) return adminJson(request, env, { error: "Survey not found" }, { status: 404 });
  const db = getDb(env);
  const [versions, rows] = await Promise.all([
    db.prepare("SELECT definition FROM survey_versions WHERE survey_id = ? ORDER BY version_number ASC").bind(id).all<{ definition: string }>(),
    db.prepare(
    `SELECT id, source, status, answers, started_at, completed_at, duration_seconds
     FROM survey_responses WHERE survey_id = ? ORDER BY started_at DESC`,
    ).bind(id).all<ResponseRow>(),
  ]);
  const questionMap = new Map<string, SurveyQuestion>();
  for (const version of versions.results || []) {
    const definition = parseJson<SurveyDefinition>(version.definition, defaultDefinition(survey.title));
    for (const question of definition.pages.flatMap((page) => page.questions)) questionMap.set(question.id, question);
  }
  const draftDefinition = parseJson<SurveyDefinition>(survey.draft_definition, defaultDefinition(survey.title));
  for (const question of draftDefinition.pages.flatMap((page) => page.questions)) questionMap.set(question.id, question);
  const questions = [...questionMap.values()];
  const header = ["response_id", "status", "source", "started_at", "completed_at", "duration_seconds", ...questions.map((question) => question.title)];
  const lines = [header.map(csvCell).join(",")];
  for (const row of rows.results || []) {
    const answers = parseJson<Record<string, unknown>>(row.answers, {});
    lines.push([
      row.id, row.status, row.source || "Direct link", row.started_at, row.completed_at || "", row.duration_seconds || "",
      ...questions.map((question) => answers[question.id]),
    ].map(csvCell).join(","));
  }
  const filename = `${survey.slug}-responses.csv`;
  return new Response(`\uFEFF${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function visibleQuestion(question: SurveyQuestion, answers: Record<string, unknown>) {
  if (!question.logic) return true;
  const answer = answers[question.logic.questionId];
  const expected = question.logic.value;
  if (question.logic.operator === "contains") return Array.isArray(answer) ? answer.map(String).includes(expected) : String(answer || "").includes(expected);
  if (question.logic.operator === "not_equals") return String(answer ?? "") !== expected;
  return String(answer ?? "") === expected;
}

function missingRequired(definition: SurveyDefinition, answers: Record<string, unknown>) {
  for (const question of definition.pages.flatMap((page) => page.questions)) {
    if (!question.required || !visibleQuestion(question, answers)) continue;
    const answer = answers[question.id];
    if (answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && !answer.length)) return question.title;
    if (question.type === "consent" && answer !== true) return question.title;
    if (question.type === "matrix" && question.rows?.some((row) => !(answer as Record<string, unknown>)?.[row.id])) return question.title;
  }
  return null;
}

function cleanAnswers(definition: SurveyDefinition, value: unknown) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const answers: Record<string, unknown> = {};
  for (const question of definition.pages.flatMap((page) => page.questions)) {
    const answer = source[question.id];
    if (answer === undefined) continue;
    if (question.type === "multiple") answers[question.id] = Array.isArray(answer) ? answer.map((item) => cleanText(item, 300)).slice(0, 60) : [];
    else if (question.type === "matrix" && answer && typeof answer === "object") {
      const matrix: Record<string, string> = {};
      for (const row of question.rows || []) matrix[row.id] = cleanText((answer as Record<string, unknown>)[row.id], 300);
      answers[question.id] = matrix;
    } else if (question.type === "consent") answers[question.id] = answer === true;
    else answers[question.id] = cleanText(answer, question.type === "long_text" ? 8_000 : 1_000);
  }
  return answers;
}

async function publishedSurvey(env: Env, slug: string) {
  const survey = await getDb(env).prepare(
    "SELECT * FROM surveys WHERE slug = ? AND status = 'open' AND published_version_id IS NOT NULL LIMIT 1",
  ).bind(slug).first<SurveyRow>();
  if (!survey) return null;
  const version = await getDb(env).prepare("SELECT * FROM survey_versions WHERE id = ? LIMIT 1")
    .bind(survey.published_version_id).first<VersionRow>();
  if (!version) return null;
  return { survey, version, definition: parseJson<SurveyDefinition>(version.definition, defaultDefinition(survey.title)) };
}

export async function publicSurveyGet(request: Request, env: Env, slug: string) {
  const published = await publishedSurvey(env, slug);
  if (!published) return json(request, env, { error: "This survey is not available" }, { status: 404 });
  return json(request, env, {
    survey: {
      id: published.survey.id, slug: published.survey.slug, versionId: published.version.id,
      definition: published.definition,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function publicSurveyStart(request: Request, env: Env, slug: string) {
  const limited = checkRateLimit(request, env, "survey_start", 30, 60);
  if (limited) return limited;
  const published = await publishedSurvey(env, slug);
  if (!published) return json(request, env, { error: "This survey is not available" }, { status: 404 });
  const payload = await readJson<{ source?: string }>(request);
  const token = randomId("srt_");
  const now = new Date().toISOString();
  const responseId = randomId("srp_");
  await getDb(env).prepare(
    `INSERT INTO survey_responses (id, survey_id, version_id, response_token_hash, source, status, answers, started_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'in_progress', '{}', ?, ?)`,
  ).bind(
    responseId, published.survey.id, published.version.id, await sha256(token), cleanText(payload?.source, 100), now, now,
  ).run();
  return json(request, env, { responseId, token, startedAt: now }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

async function authorizedResponse(request: Request, env: Env, responseId: string) {
  const token = request.headers.get("X-Survey-Token") || "";
  if (!token) return null;
  return getDb(env).prepare(
    `SELECT r.*, v.definition FROM survey_responses r JOIN survey_versions v ON v.id = r.version_id
     WHERE r.id = ? AND r.response_token_hash = ? LIMIT 1`,
  ).bind(responseId, await sha256(token)).first<ResponseRow & { definition: string }>();
}

export async function publicSurveySave(request: Request, env: Env, responseId: string, complete = false) {
  const limited = checkRateLimit(request, env, complete ? "survey_submit" : "survey_save", complete ? 20 : 120, 60);
  if (limited) return limited;
  const row = await authorizedResponse(request, env, responseId);
  if (!row) return json(request, env, { error: "Response not found" }, { status: 404 });
  if (row.status === "completed") return json(request, env, { error: "This response has already been submitted" }, { status: 409 });
  const payload = await readJson<{ answers?: unknown }>(request);
  if (!payload) return badRequest(request, env, "Invalid JSON body");
  const definition = parseJson<SurveyDefinition>(row.definition, defaultDefinition("Survey"));
  const answers = cleanAnswers(definition, payload.answers);
  if (complete) {
    const missing = missingRequired(definition, answers);
    if (missing) return badRequest(request, env, `Please answer: ${missing}`);
  }
  const now = new Date().toISOString();
  const duration = Math.max(0, Math.round((Date.parse(now) - Date.parse(row.started_at)) / 1000));
  await getDb(env).prepare(
    `UPDATE survey_responses SET answers = ?, status = ?, updated_at = ?, completed_at = ?, duration_seconds = ? WHERE id = ?`,
  ).bind(JSON.stringify(answers), complete ? "completed" : "in_progress", now, complete ? now : null, complete ? duration : null, responseId).run();
  return json(request, env, { ok: true, status: complete ? "completed" : "in_progress" }, { headers: { "Cache-Control": "no-store" } });
}
