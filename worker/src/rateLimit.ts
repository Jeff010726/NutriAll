import { json } from "./http";
import type { Env } from "./types";

const buckets = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: Request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

export function checkRateLimit(request: Request, env: Env, scope: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const key = `${scope}:${clientIp(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return null;
  }

  if (current.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return json(
      request,
      env,
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  current.count += 1;
  return null;
}
