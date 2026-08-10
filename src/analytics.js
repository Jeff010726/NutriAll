const analyticsUrl = `${import.meta.env.VITE_API_BASE_URL || "https://nutriall-api.xtdiabetescare.com"}/api/analytics/collect`;

function randomId(prefix) {
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}${value}`;
}

function storedId(storage, key, prefix) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const value = randomId(prefix);
    storage.setItem(key, value);
    return value;
  } catch {
    return randomId(prefix);
  }
}

export function trackEvent(eventType, eventName = "", metadata = {}) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const payload = {
    eventType,
    eventName,
    path: `${window.location.pathname}${window.location.search}`,
    pageTitle: document.title,
    referrer: document.referrer,
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    device: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop",
    language: navigator.language || "",
    sessionId: storedId(window.sessionStorage, "nutriall_session_id", "ses_"),
    visitorId: storedId(window.localStorage, "nutriall_visitor_id", "vis_"),
    metadata,
  };
  fetch(analyticsUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}
