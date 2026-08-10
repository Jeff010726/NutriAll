import type { Env } from "./types";

export function getDb(env: Env) {
  if (!env.DB) {
    throw new Error("D1 database binding DB is not configured");
  }
  return env.DB;
}
