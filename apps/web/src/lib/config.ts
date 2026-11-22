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
export const CACHE_VERSION = __CACHE_VERSION__;

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

/**
 * @deprecated Prefer getEffectiveApiConfig() for share/health calls.
 * Kept as build-time snapshot for Default reset UI.
 */
export const config = {
  API_URL: buildTimeConfig.API_URL,
  FRONTEND_URL: buildTimeConfig.FRONTEND_URL,
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

export function setApiOverride(override: ApiOverride): void {
  if (typeof window === "undefined") return;
  const next: ApiOverride = {};
  if (override.apiUrl?.trim()) {
    next.apiUrl = removeTrailingSlash(override.apiUrl.trim());
  }
  if (override.frontendUrl?.trim()) {
    next.frontendUrl = removeTrailingSlash(override.frontendUrl.trim());
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

export function isLocalhostApi(): boolean {
  try {
    const url = getEffectiveApiConfig().API_URL;
    return url.includes("localhost") || url.includes("127.0.0.1");
  } catch {
    return false;
  }
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
