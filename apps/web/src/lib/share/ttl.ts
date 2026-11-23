export const SHARE_TTL_DEFAULT = 7 * 24 * 60 * 60;
export const SHARE_TTL_MIN = 60;
export const SHARE_TTL_MAX = 30 * 24 * 60 * 60;

export const SHARE_TTL_PRESETS = [
  { label: "1 hour", seconds: 60 * 60 },
  { label: "1 day", seconds: 24 * 60 * 60 },
  { label: "7 days", seconds: SHARE_TTL_DEFAULT },
  { label: "30 days", seconds: SHARE_TTL_MAX },
] as const;

export function clampShareTtl(seconds: number): number {
  if (!Number.isFinite(seconds)) return SHARE_TTL_DEFAULT;
  const n = Math.floor(seconds);
  if (n < SHARE_TTL_MIN) return SHARE_TTL_MIN;
  if (n > SHARE_TTL_MAX) return SHARE_TTL_MAX;
  return n;
}

export function formatWipeTime(expiresAt: string): string {
  try {
    return new Date(expiresAt).toLocaleString();
  } catch {
    return expiresAt;
  }
}

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
