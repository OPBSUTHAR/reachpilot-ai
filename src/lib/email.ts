import type { BrandProfile } from "./types";

export interface EmailConfigStatus {
  configured: boolean;
  sender: string | null;
  missing: string[];
  mode: "gmail" | "demo";
}

const GMAIL_ENV_KEYS = [
  "GMAIL_CLIENT_ID",
  "GMAIL_CLIENT_SECRET",
  "GMAIL_REFRESH_TOKEN",
  "GMAIL_SENDER_EMAIL",
] as const;

export function gmailConfig(): EmailConfigStatus {
  const missing = GMAIL_ENV_KEYS.filter((key) => !process.env[key]);
  return {
    configured: missing.length === 0,
    sender: process.env.GMAIL_SENDER_EMAIL ?? null,
    missing: [...missing],
    mode: missing.length === 0 ? "gmail" : "demo",
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.token;
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3500) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

function encodeHeader(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function mimeMessage(input: {
  from: string;
  to: string;
  subject: string;
  body: string;
  unsubscribe: string;
}): string {
  return [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${encodeHeader(input.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    `List-Unsubscribe: <mailto:${input.unsubscribe}?subject=unsubscribe>`,
    "",
    input.body.replace(/\r?\n/g, "\r\n"),
  ].join("\r\n");
}

export interface SendResult {
  provider: "demo" | "gmail";
  messageId: string;
  threadId: string;
}

export async function sendGmail(input: {
  to: string;
  subject: string;
  body: string;
  brand: BrandProfile;
  threadId?: string;
}): Promise<SendResult> {
  const token = await accessToken();
  const sender = process.env.GMAIL_SENDER_EMAIL;
  if (!token || !sender) throw new Error("Gmail is not configured");
  const raw = Buffer.from(
    mimeMessage({
      from: `${process.env.GMAIL_SENDER_NAME || input.brand.senderName} <${sender}>`,
      to: input.to,
      subject: input.subject,
      body: input.body,
      unsubscribe: sender,
    }),
  ).toString("base64url");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(input.threadId ? { raw, threadId: input.threadId } : { raw }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gmail send failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  const data = (await response.json()) as { id?: string; threadId?: string };
  return {
    provider: "gmail",
    messageId: data.id ?? `gmail_${Date.now()}`,
    threadId: data.threadId ?? `gmail_thread_${Date.now()}`,
  };
}

export interface InboundEmail {
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
  gmailMessageId: string;
  gmailThreadId: string;
  receivedAt: string;
}

function headerValue(
  headers: Array<{ name: string; value: string }> | undefined,
  name: string,
): string {
  return headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function emailFromHeader(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim().toLowerCase();
}

function decodeBase64(value: string): string {
  try {
    return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return "";
  }
}

function extractBody(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const node = payload as {
    mimeType?: string;
    body?: { data?: string };
    parts?: unknown[];
  };
  if (node.mimeType === "text/plain" && node.body?.data) return decodeBase64(node.body.data);
  if (Array.isArray(node.parts)) {
    for (const part of node.parts) {
      const body = extractBody(part);
      if (body) return body;
    }
  }
  if (node.body?.data) return decodeBase64(node.body.data);
  return "";
}

export async function fetchGmailReplies(knownEmails: string[]): Promise<InboundEmail[]> {
  const token = await accessToken();
  if (!token || knownEmails.length === 0) return [];
  const wanted = new Set(knownEmails.map((email) => email.toLowerCase()));
  try {
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
        "is:unread newer_than:14d -from:me",
      )}&maxResults=15`,
      {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!listResponse.ok) return [];
    const list = (await listResponse.json()) as { messages?: Array<{ id: string }> };
    const results: InboundEmail[] = [];
    for (const item of list.messages ?? []) {
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
        {
          headers: { authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(20_000),
        },
      );
      if (!messageResponse.ok) continue;
      const message = (await messageResponse.json()) as {
        id: string;
        threadId: string;
        internalDate?: string;
        snippet?: string;
        payload?: {
          headers?: Array<{ name: string; value: string }>;
          body?: { data?: string };
          parts?: unknown[];
        };
      };
      const headers = message.payload?.headers;
      const from = emailFromHeader(headerValue(headers, "From"));
      if (!wanted.has(from)) continue;
      results.push({
        fromEmail: from,
        fromName: headerValue(headers, "From").replace(/<[^>]+>/, "").replace(/"/g, "").trim(),
        subject: headerValue(headers, "Subject") || "(no subject)",
        body: extractBody(message.payload) || message.snippet || "",
        gmailMessageId: message.id,
        gmailThreadId: message.threadId,
        receivedAt: message.internalDate
          ? new Date(Number(message.internalDate)).toISOString()
          : new Date().toISOString(),
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function markGmailRead(messageId: string): Promise<void> {
  const token = await accessToken();
  if (!token) return;
  await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => undefined);
}
