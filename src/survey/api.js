const remoteBase = "https://survey.nutriallwellness.org";

function apiBase() {
  if (import.meta.env.VITE_SURVEY_API_BASE_URL) return import.meta.env.VITE_SURVEY_API_BASE_URL;
  if (window.location.hostname === "survey.nutriallwellness.org") return "";
  return remoteBase;
}

export async function surveyApi(path, options = {}) {
  const response = await fetch(`${apiBase()}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { "X-Survey-Token": options.token } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });
  const contentType = response.headers.get("Content-Type") || "";
  const data = contentType.includes("application/json") ? await response.json().catch(() => ({})) : {};
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

export function surveyExportUrl(id) {
  return `${apiBase()}/api/manage/surveys/${encodeURIComponent(id)}/export.csv`;
}
