/**
 * Application configuration
 *
 * Build-time (Vite):
 * - VITE_API_URL (or API_URL via vite.config define)
 * - VITE_FRONTEND_URL (or FRONTEND_URL via vite.config define)
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

/** Only allow http(s) absolute URLs for share API overrides (no javascript:). */
export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function setApiOverride(override: ApiOverride): void {
  if (typeof window === "undefined") return;
  const next: ApiOverride = {};
  if (override.apiUrl?.trim()) {
    const apiUrl = removeTrailingSlash(override.apiUrl.trim());
    if (!isSafeHttpUrl(apiUrl)) {
      throw new Error("API URL must be an http(s) URL");
    }
    next.apiUrl = apiUrl;
  }
  if (override.frontendUrl?.trim()) {
    const frontendUrl = removeTrailingSlash(override.frontendUrl.trim());
    if (!isSafeHttpUrl(frontendUrl)) {
      throw new Error("Frontend URL must be an http(s) URL");
    }
    next.frontendUrl = frontendUrl;
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
  const API_URL = override?.apiUrl || buildTimeConfig.API_URL;
  const FRONTEND_URL = override?.frontendUrl || buildTimeConfig.FRONTEND_URL;
  return {
    API_URL,
    FRONTEND_URL,
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
