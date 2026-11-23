/**
 * Application configuration
 *
 * Build-time (Vite):
 * - VITE_API_URL (or API_URL via vite.config define) — absolute or same-origin path (`/api`)
 * - VITE_FRONTEND_URL (or FRONTEND_URL via vite.config define) — absolute, `/`, `.`, or `same-origin`
 *
 * Runtime overlay: localStorage `mdviewer_api_override` (Settings → Share).
 * Version comes from apps/web/package.json via Vite `define`.
 */

export const APP_VERSION = __APP_VERSION__;

const API_OVERRIDE_KEY = "mdviewer_api_override";

function removeTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function readEnvUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return removeTrailingSlash(value.trim());
}

/** Build-time defaults from env (never mutated). */
export const buildTimeConfig = {
  API_URL: readEnvUrl(import.meta.env.VITE_API_URL),
  FRONTEND_URL: readEnvUrl(import.meta.env.VITE_FRONTEND_URL),
} as const;

export interface ApiOverride {
  apiUrl?: string;
  frontendUrl?: string;
}

/** Same-origin path like `/api` (not protocol-relative `//…`). */
export function isRelativeAppPath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/** Empty / `.` / `/` / `same-origin` → use `window.location.origin`. */
export function isSameOriginFrontendToken(url: string): boolean {
  const t = url.trim().toLowerCase();
  return t === "" || t === "." || t === "/" || t === "same-origin";
}

/** Absolute http(s) only (no javascript:). */
export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** Absolute http(s) or same-origin app path (`/api`). */
export function isSafeApiEndpoint(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (isRelativeAppPath(t)) return true;
  return isSafeHttpUrl(t);
}

function currentOrigin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

/** Resolve stored/build value to an absolute URL for fetch + share links. */
export function resolveApiEndpoint(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (isRelativeAppPath(t)) {
    const origin = currentOrigin();
    if (!origin) return removeTrailingSlash(t);
    return removeTrailingSlash(`${origin}${t}`);
  }
  return removeTrailingSlash(t);
}

function resolveFrontendUrl(frontendRaw: string, apiRaw: string): string {
  const trimmed = frontendRaw.trim();
  if (trimmed.toLowerCase() === "same-origin" || trimmed === "." || trimmed === "/") {
    return currentOrigin();
  }
  if (!trimmed) {
    // Empty frontend + relative API → same Worker / Appflare install
    return isRelativeAppPath(apiRaw) ? currentOrigin() : "";
  }
  return resolveApiEndpoint(trimmed);
}

export function getApiOverride(): ApiOverride | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(API_OVERRIDE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ApiOverride;
    return {
      apiUrl: parsed.apiUrl?.trim() ? removeTrailingSlash(parsed.apiUrl.trim()) : undefined,
      frontendUrl: parsed.frontendUrl?.trim()
        ? removeTrailingSlash(parsed.frontendUrl.trim())
        : undefined,
    };
  } catch {
    return null;
  }
}

export function setApiOverride(override: ApiOverride): void {
  if (typeof window === "undefined") return;
  const next: ApiOverride = {};
  if (override.apiUrl?.trim()) {
    const apiUrl = removeTrailingSlash(override.apiUrl.trim());
    if (!isSafeApiEndpoint(apiUrl)) {
      throw new Error("API URL must be http(s) or a path like /api");
    }
    next.apiUrl = apiUrl;
  }
  if (override.frontendUrl?.trim()) {
    const frontendUrl = removeTrailingSlash(override.frontendUrl.trim());
    if (isSameOriginFrontendToken(frontendUrl) || frontendUrl.toLowerCase() === "same-origin") {
      next.frontendUrl = "same-origin";
    } else if (!isSafeApiEndpoint(frontendUrl)) {
      throw new Error("Frontend URL must be http(s), /api-style path, or same-origin");
    } else {
      next.frontendUrl = frontendUrl;
    }
  }
  localStorage.setItem(API_OVERRIDE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("storage"));
}

export function clearApiOverride(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(API_OVERRIDE_KEY);
  window.dispatchEvent(new Event("storage"));
}

export function hasApiOverride(): boolean {
  const o = getApiOverride();
  return Boolean(o?.apiUrl || o?.frontendUrl);
}

export function getEffectiveApiConfig(): {
  API_URL: string;
  FRONTEND_URL: string;
  usingOverride: boolean;
} {
  const override = getApiOverride();
  const apiRaw = override?.apiUrl || buildTimeConfig.API_URL;
  const frontendRaw = override?.frontendUrl || buildTimeConfig.FRONTEND_URL;
  return {
    API_URL: resolveApiEndpoint(apiRaw),
    FRONTEND_URL: resolveFrontendUrl(frontendRaw, apiRaw),
    usingOverride: Boolean(override?.apiUrl || override?.frontendUrl),
  };
}

export function isApiConfigured(): boolean {
  try {
    const { API_URL, FRONTEND_URL } = getEffectiveApiConfig();
    return Boolean(API_URL && FRONTEND_URL);
  } catch {
    return false;
  }
}

export function getApiConfigStatus(): {
  isConfigured: boolean;
  missingApiUrl: boolean;
  missingFrontendUrl: boolean;
  apiUrl: string | null;
  frontendUrl: string | null;
  usingOverride: boolean;
} {
  try {
    const { API_URL, FRONTEND_URL, usingOverride } = getEffectiveApiConfig();
    const apiUrl = API_URL || null;
    const frontendUrl = FRONTEND_URL || null;
    return {
      isConfigured: Boolean(apiUrl && frontendUrl),
      missingApiUrl: !apiUrl,
      missingFrontendUrl: !frontendUrl,
      apiUrl,
      frontendUrl,
      usingOverride,
    };
  } catch {
    return {
      isConfigured: false,
      missingApiUrl: true,
      missingFrontendUrl: true,
      apiUrl: null,
      frontendUrl: null,
      usingOverride: false,
    };
  }
}
