export interface Env {
  APP_ENV: string;
  APP_ORIGIN?: string;
  ALLOWED_ORIGINS?: string;
  BRAND_NAME?: string;
  ADMIN_HOST?: string;
  ADMIN_URL?: string;
  GOOGLE_SHEETS_SPREADSHEET_ID?: string;
  GOOGLE_SHEETS_CLIENT_EMAIL?: string;
  GOOGLE_SHEETS_PRIVATE_KEY?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_PASSWORD_HASH?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;
  SMTP_EHLO_DOMAIN?: string;
  BOOKING_NOTIFY_TO?: string;
  DB?: D1Database;
  ASSETS?: Fetcher;
  INSURANCE_CARDS?: R2Bucket;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
