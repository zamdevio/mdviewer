/**
 * Application configuration
 * 
 * This file contains all configuration constants for the application.
 *
 * Required environment variables:
 * - API_URL: API URL (e.g., https://mdviewer-api.your-domain.com)
 * - FRONTEND_URL: Frontend website URL (e.g., https://your-domain.com)
 */

export const config = {
  /**
   * Cloudflare Workers API URL for the share feature
   * 
   * Must be set via API_URL environment variable.
   * No default is provided to prevent mismatches.
   */
  API_URL: (() => {
    // For static export, env vars are injected at build time via next.config.ts
    // Fallback to window.__ENV__ for runtime injection if needed
    const envUrl = process.env.API_URL || (typeof window !== 'undefined' ? (window as any).__ENV__?.API_URL : undefined);
    
    if (!envUrl || !envUrl.trim()) {
      const error = 'API_URL environment variable is required but not set. Please set it in your deployment platform (Cloudflare Pages) or .env.local file.';
      if (typeof window !== 'undefined') {
        console.error(error);
      }
      throw new Error(error);
    }
    
    return envUrl.trim();
  })(),
  
  /**
   * Frontend website URL for share links
   * 
   * Must be set via FRONTEND_URL environment variable.
   * No default is provided to prevent mismatches.
   */
  FRONTEND_URL: (() => {
    // For static export, env vars are injected at build time via next.config.ts
    // Fallback to window.__ENV__ for runtime injection if needed
    const envUrl = process.env.FRONTEND_URL || (typeof window !== 'undefined' ? (window as any).__ENV__?.FRONTEND_URL : undefined);
    
    if (!envUrl || !envUrl.trim()) {
      const error = 'FRONTEND_URL environment variable is required but not set. Please set it in your deployment platform (Cloudflare Pages) or .env.local file.';
      if (typeof window !== 'undefined') {
        console.error(error);
      }
      throw new Error(error);
    }
    
    return envUrl.trim();
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
 * Returns true if API_URL is set and not empty
 */
export function isApiConfigured(): boolean {
  try {
    const url = config.API_URL;
    return Boolean(url && url.trim().length > 0);
  } catch {
    return false;
  }
}