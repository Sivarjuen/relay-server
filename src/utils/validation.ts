import type { Envelope, IncomingMessage } from "../types.js";

const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB

// Rate limit: max messages per window
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 10_000; // 10 seconds

export function parseMessage(raw: string): IncomingMessage | null {
  if (Buffer.byteLength(raw, "utf8") > MAX_PAYLOAD_BYTES) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || !("type" in parsed)) {
    return null;
  }

  const envelope = parsed as Envelope;
  if (typeof envelope.type !== "string") {
    return null;
  }

  return parsed as IncomingMessage;
}

export function isRateLimited(
  messageCount: number,
  rateLimitResetAt: Date
): boolean {
  const now = new Date();
  if (now >= rateLimitResetAt) return false; // window expired, not limited
  return messageCount >= RATE_LIMIT_MAX;
}

export function nextRateLimitWindow(): Date {
  return new Date(Date.now() + RATE_LIMIT_WINDOW_MS);
}
