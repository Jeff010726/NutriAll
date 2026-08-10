import { connect } from "cloudflare:sockets";
import type { Env } from "./types";

type EmailParams = {
  subject: string;
  text: string;
  replyTo?: string;
  to?: string;
};

const requiredConfig = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "BOOKING_NOTIFY_TO"] as const;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function smtpConfigStatus(env: Env) {
  const values = {
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    SMTP_USER: env.SMTP_USER,
    SMTP_PASSWORD: env.SMTP_PASSWORD,
    BOOKING_NOTIFY_TO: env.BOOKING_NOTIFY_TO,
  };
  const missing = requiredConfig.filter((key) => !values[key]);

  return {
    configured: missing.length === 0,
    missing,
    host: env.SMTP_HOST || "",
    port: env.SMTP_PORT || "",
    userConfigured: Boolean(env.SMTP_USER),
    passwordConfigured: Boolean(env.SMTP_PASSWORD),
    from: env.SMTP_FROM || env.SMTP_USER || "",
    to: env.BOOKING_NOTIFY_TO || "",
  };
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function cleanHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function dotStuff(value: string) {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function parseCode(response: string) {
  const match = response.match(/^(\d{3})/m);
  return match ? Number(match[1]) : 0;
}

async function readSmtp(reader: ReadableStreamDefaultReader<Uint8Array>) {
  let response = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) throw new Error("SMTP connection closed");
    response += decoder.decode(value, { stream: true });
    const lines = response.split(/\r?\n/).filter(Boolean);
    const last = lines[lines.length - 1] || "";
    if (/^\d{3} /.test(last)) return response;
  }
}

async function sendCommand(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  writer: WritableStreamDefaultWriter<Uint8Array>,
  command: string,
  expected: number[],
) {
  await writer.write(encoder.encode(command + "\r\n"));
  const response = await readSmtp(reader);
  const code = parseCode(response);
  if (!expected.includes(code)) {
    throw new Error(`SMTP command failed (${code}): ${response.slice(0, 300)}`);
  }
  return response;
}

function buildMessage(env: Env, params: EmailParams) {
  const from = cleanHeader(env.SMTP_FROM || env.SMTP_USER || "");
  const to = cleanHeader(params.to || env.BOOKING_NOTIFY_TO || "");
  const subject = cleanHeader(params.subject);
  const replyTo = params.replyTo ? cleanHeader(params.replyTo) : "";
  const headers = [
    `From: ${cleanHeader(env.BRAND_NAME || "NutriAll")} <${from}>`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : "",
    `Subject: =?UTF-8?B?${encodeBase64(subject)}?=`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
  ].filter(Boolean);

  return `${headers.join("\r\n")}\r\n\r\n${dotStuff(params.text)}\r\n.`;
}

export async function sendSmtpEmail(env: Env, params: EmailParams) {
  const status = smtpConfigStatus(env);
  if (!status.configured) {
    console.error("SMTP email skipped; missing config", status.missing.join(", "));
    return { skipped: true, missing: status.missing };
  }

  const host = env.SMTP_HOST || "smtp.qq.com";
  const port = Number(env.SMTP_PORT || 465);
  const from = env.SMTP_FROM || env.SMTP_USER || "";
  const to = params.to || env.BOOKING_NOTIFY_TO || "";
  const socket = connect(
    { hostname: host, port },
    { secureTransport: port === 465 ? "on" : "starttls", allowHalfOpen: false },
  );
  const reader = socket.readable.getReader();
  const writer = socket.writable.getWriter();

  try {
    const greeting = await readSmtp(reader);
    if (parseCode(greeting) !== 220) throw new Error(`SMTP greeting failed: ${greeting.slice(0, 300)}`);

    await sendCommand(reader, writer, `EHLO ${env.SMTP_EHLO_DOMAIN || "nutriallwellness.org"}`, [250]);
    await sendCommand(reader, writer, "AUTH LOGIN", [334]);
    await sendCommand(reader, writer, encodeBase64(env.SMTP_USER || ""), [334]);
    await sendCommand(reader, writer, encodeBase64(env.SMTP_PASSWORD || ""), [235]);
    await sendCommand(reader, writer, `MAIL FROM:<${from}>`, [250]);
    await sendCommand(reader, writer, `RCPT TO:<${to}>`, [250, 251]);
    await sendCommand(reader, writer, "DATA", [354]);
    await sendCommand(reader, writer, buildMessage(env, params), [250]);
    await sendCommand(reader, writer, "QUIT", [221]);
    return { skipped: false };
  } finally {
    reader.releaseLock();
    writer.releaseLock();
    await socket.close().catch(() => undefined);
  }
}
