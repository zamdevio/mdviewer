/** Fixed TTL rules (Phase C) — expiresAt set once at create, never slid. */
export const TTL_DEFAULT_SECONDS = 7 * 24 * 60 * 60;
export const TTL_MAX_SECONDS = 30 * 24 * 60 * 60;
export const TTL_MIN_SECONDS = 60;

export function clampTtlSeconds(raw: number | null | undefined): number {
  if (raw == null || !Number.isFinite(raw)) return TTL_DEFAULT_SECONDS;
  const n = Math.floor(raw);
  if (n < TTL_MIN_SECONDS) return TTL_MIN_SECONDS;
  if (n > TTL_MAX_SECONDS) return TTL_MAX_SECONDS;
  return n;
}

export function parseTtlHeader(request: Request): number {
  const raw = request.headers.get("X-Share-TTL-Seconds");
  if (!raw) return TTL_DEFAULT_SECONDS;
  return clampTtlSeconds(parseInt(raw, 10));
}

export function expiresAtFromTtl(ttlSeconds: number, from = new Date()): string {
  return new Date(from.getTime() + ttlSeconds * 1000).toISOString();
}

export function isExpired(expiresAt: string, now = new Date()): boolean {
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return true;
  return t <= now.getTime();
}
