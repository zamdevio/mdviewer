/**
 * Application configuration
 *
 * Required environment variables (Vite):
 * - VITE_API_URL (or API_URL via vite.config define)
 * - VITE_FRONTEND_URL (or FRONTEND_URL via vite.config define)
 *
 * Version comes from apps/web/package.json via Vite `define`
 * (same source as the emitted service worker cache name).
 */

export const APP_VERSION = __APP_VERSION__;
export const CACHE_VERSION = __CACHE_VERSION__;

// Remove trailing slash helper
function removeTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export const config = {
  /**
   * Cloudflare Workers API URL for the share feature
   * 
   * Must be set via API_URL environment variable.
   * No default is provided to prevent mismatches.
   */
  API_URL: (() => {
    // Vite injects VITE_* at build time (also accepts API_URL via vite.config define)
    const envUrl = import.meta.env.VITE_API_URL;

    if (!envUrl || !envUrl.trim()) {
      if (typeof window !== 'undefined') {
        console.warn('VITE_API_URL / API_URL is not set. Share feature will not work. Set it in .env.local or Cloudflare Pages.');
      }
      return '';
    }

    return removeTrailingSlash(envUrl.trim());
  })(),

  /**
   * Frontend website URL for share links
   *
   * Must be set via VITE_FRONTEND_URL / FRONTEND_URL.
   * No default is provided to prevent mismatches.
   */
  FRONTEND_URL: (() => {
    const envUrl = import.meta.env.VITE_FRONTEND_URL;

    if (!envUrl || !envUrl.trim()) {
      if (typeof window !== 'undefined') {
        console.warn('VITE_FRONTEND_URL / FRONTEND_URL is not set. Share feature will not work. Set it in .env.local or Cloudflare Pages.');
      }
      return '';
    }

    return removeTrailingSlash(envUrl.trim());
  })(),
} as const;

/**
 * Check if the API URL is localhost (for development)
 */
export function isLocalhostApi(): boolean {
  try {
    const url = config.API_URL;
    return url.includes('localhost') || url.includes('127.0.0.1');
  } catch {
    return false;
  }
}

/**
 * Check if the API is properly configured
 * Returns true if both API_URL and FRONTEND_URL are set and not empty
 */
export function isApiConfigured(): boolean {
  try {
    const apiUrl = config.API_URL;
    const frontendUrl = config.FRONTEND_URL;
    return Boolean(
      apiUrl && apiUrl.trim().length > 0 &&
      frontendUrl && frontendUrl.trim().length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Check if API configuration is missing
 * Returns object with details about what's missing
 */
export function getApiConfigStatus(): {
  isConfigured: boolean;
  missingApiUrl: boolean;
  missingFrontendUrl: boolean;
  apiUrl: string | null;
  frontendUrl: string | null;
} {
  try {
    const apiUrl = config.API_URL?.trim() || null;
    const frontendUrl = config.FRONTEND_URL?.trim() || null;
    
    return {
      isConfigured: Boolean(apiUrl && frontendUrl),
      missingApiUrl: !apiUrl,
      missingFrontendUrl: !frontendUrl,
      apiUrl,
      frontendUrl,
    };
  } catch {
    return {
      isConfigured: false,
      missingApiUrl: true,
      missingFrontendUrl: true,
      apiUrl: null,
      frontendUrl: null,
    };
  }
}
