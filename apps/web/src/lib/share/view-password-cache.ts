/**
 * Session-scoped cache of unlocked view passwords, keyed by share id.
 * Survives navigation between /search, /share/:id and /editor?load= so an
 * unlock is only entered once per browser session.
 */
const KEY_PREFIX = "share-pw:";

function store(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

function keyFor(shareId: string): string | null {
  return shareId ? KEY_PREFIX + shareId : null;
}

export function setCachedViewPassword(shareId: string, password: string): void {
  const key = keyFor(shareId);
  const s = store();
  if (!key || !s || !password) return;
  try {
    s.setItem(key, password);
  } catch {
    // quota or private mode — cache is best effort
  }
}

export function getCachedViewPassword(shareId: string): string | null {
  const key = keyFor(shareId);
  const s = store();
  if (!key || !s) return null;
  try {
    return s.getItem(key);
  } catch {
    return null;
  }
}

export function clearCachedViewPassword(shareId: string): void {
  const key = keyFor(shareId);
  const s = store();
  if (!key || !s) return;
  try {
    s.removeItem(key);
  } catch {
    // best effort
  }
}
