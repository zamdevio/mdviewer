export const SHARE_TTL_DEFAULT = 7 * 24 * 60 * 60;
export const SHARE_TTL_MIN = 60;
export const SHARE_TTL_MAX = 30 * 24 * 60 * 60;

/** Quick picks for the share dialog (all within min/max). */
export const SHARE_TTL_PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "1 hour", seconds: 60 * 60 },
  { label: "1 day", seconds: 24 * 60 * 60 },
  { label: "1 week", seconds: SHARE_TTL_DEFAULT },
  { label: "30 days", seconds: SHARE_TTL_MAX },
] as const;

export function clampShareTtl(seconds: number): number {
  if (!Number.isFinite(seconds)) return SHARE_TTL_DEFAULT;
  const n = Math.floor(seconds);
  if (n < SHARE_TTL_MIN) return SHARE_TTL_MIN;
  if (n > SHARE_TTL_MAX) return SHARE_TTL_MAX;
  return n;
}

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  sec: 1,
  secs: 1,
  seconds: 1,
  m: 60,
  min: 60,
  mins: 60,
  minutes: 60,
  h: 3600,
  hr: 3600,
  hrs: 3600,
  hours: 3600,
  d: 86400,
  day: 86400,
  days: 86400,
  w: 7 * 86400,
  wk: 7 * 86400,
  wks: 7 * 86400,
  week: 7 * 86400,
  weeks: 7 * 86400,
};

const TOKEN_RE =
  /(\d+(?:\.\d+)?)\s*(s|sec|secs|seconds|m|min|mins|minutes|h|hr|hrs|hours|d|day|days|w|wk|wks|week|weeks)?/gi;

/**
 * Parse human durations. Sums every token so `1d 1d 1d` → 3 days,
 * `1h 30m` → 90 minutes. A lone number is seconds. Returns null if nothing parses.
 */
export function parseDurationToSeconds(raw: string): number | null {
  const t = raw.trim().toLowerCase().replace(/,/g, " ");
  if (!t) return null;

  // Single bare number → seconds
  if (/^\d+(?:\.\d+)?$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }

  let total = 0;
  let matched = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(t)) !== null) {
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n < 0) continue;
    const unitKey = (m[2] || "").toLowerCase();
    // Require an explicit unit when summing tokens (avoids "1 1 1" → 3 seconds noise).
    // Exception: whole-string bare number handled above.
    if (!unitKey) continue;
    const mult = UNIT_SECONDS[unitKey];
    if (mult == null) continue;
    total += n * mult;
    matched += 1;
  }

  return matched > 0 ? total : null;
}

/**
 * Human label from preset-sized units (week → day → hour → minute).
 * e.g. 6d+2h+1m → "6 days, 2 hours, 1 minute" — no decimals.
 */
export function formatDurationHuman(seconds: number): string {
  let rem = clampShareTtl(seconds);
  const parts: string[] = [];

  const push = (n: number, one: string, many: string) => {
    if (n <= 0) return;
    parts.push(n === 1 ? one : `${n} ${many}`);
  };

  const weeks = Math.floor(rem / (7 * 86400));
  rem -= weeks * 7 * 86400;
  const days = Math.floor(rem / 86400);
  rem -= days * 86400;
  const hours = Math.floor(rem / 3600);
  rem -= hours * 3600;
  const minutes = Math.floor(rem / 60);

  push(weeks, "1 week", "weeks");
  push(days, "1 day", "days");
  push(hours, "1 hour", "hours");
  push(minutes, "1 minute", "minutes");

  if (parts.length === 0) return "1 minute";
  return parts.join(", ");
}

export type ParsedTtl = {
  seconds: number;
  label: string;
  capped: boolean;
  rawSeconds: number;
};

/** Parse + clamp; `capped` when input was outside min/max. */
export function resolveShareTtlInput(raw: string, fallback = SHARE_TTL_DEFAULT): ParsedTtl {
  const parsed = parseDurationToSeconds(raw);
  const rawSeconds = parsed == null ? fallback : parsed;
  const seconds = clampShareTtl(rawSeconds);
  return {
    seconds,
    label: formatDurationHuman(seconds),
    capped: parsed != null && seconds !== Math.floor(rawSeconds),
    rawSeconds,
  };
}

export function formatWipeTime(expiresAt: string): string {
  try {
    return new Date(expiresAt).toLocaleString();
  } catch {
    return expiresAt;
  }
}

/** Client-side wipe preview — same formula as Worker `expiresAtFromTtl` (now + ttl). */
export function previewExpiresAt(ttlSeconds: number): string {
  return new Date(Date.now() + clampShareTtl(ttlSeconds) * 1000).toISOString();
}

/** Ambiguous-char-free alphabet (no 0/O/1/I/l). Length must stay < 256. */
const SECRET_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * Unbiased random secret for manage tokens / disposable view passwords.
 * Uses rejection sampling so `byte % alphabet.length` does not skew.
 */
export function generateSharePassword(length = 16): string {
  const n = SECRET_ALPHABET.length;
  const limit = Math.floor(256 / n) * n;
  let out = "";
  while (out.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    for (const b of bytes) {
      if (b >= limit) continue;
      out += SECRET_ALPHABET[b % n];
      if (out.length >= length) break;
    }
  }
  return out;
}
