/**
 * Application configuration
 * 
 * This file contains all configuration constants for the application.
 *
 * Required environment variables:
 * - API_URL: API URL (e.g., https://mdviewer-api.your-domain.com)
 * - FRONTEND_URL: Frontend website URL (e.g., https://your-domain.com)
 */

// App version - shared across Service Worker and UI
// Update this when releasing a new version
export const APP_VERSION = "3.2.0";

// Cache version for Service Worker - should match major.minor of APP_VERSION
// This is automatically injected into public/sw.js during build by scripts/inject-sw-version.cjs
// You only need to update this value - the build script handles the rest!
export const CACHE_VERSION = "v3.2";

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
    // For static export, env vars are injected at build time via next.config.ts
    const envUrl = process.env.API_URL;
    
    if (!envUrl || !envUrl.trim()) {
      if (typeof window !== 'undefined') {
        console.warn('API_URL environment variable is not set. Share feature will not work. Please set it in your deployment platform (Cloudflare Pages) or .env.local file.');
      }
      return '';
    }
    
    return removeTrailingSlash(envUrl.trim());
  })(),
  
  /**
   * Frontend website URL for share links
   * 
   * Must be set via FRONTEND_URL environment variable.
   * No default is provided to prevent mismatches.
   */
  FRONTEND_URL: (() => {
    // For static export, env vars are injected at build time via next.config.ts
    const envUrl = process.env.FRONTEND_URL;

    if (!envUrl || !envUrl.trim()) {
      if (typeof window !== 'undefined') {
        console.warn('FRONTEND_URL environment variable is not set. Share feature will not work. Please set it in your deployment platform (Cloudflare Pages) or .env.local file.');
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
