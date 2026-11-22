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

export function generateSharePassword(length = 16): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
