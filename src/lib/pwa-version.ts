/**
 * PWA Version Utilities
 * 
 * Functions to get app version and cache information
 */

import { APP_VERSION } from "@/lib/config";

/**
 * Get the current app version
 */
export function getAppVersion(): string {
  return APP_VERSION;
}

/**
 * Get the service worker cache version
 * Returns the cache version if service worker is active, null otherwise
 */
export async function getCacheVersion(): Promise<string | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.active) {
      return null;
    }

    // Try to get cache version from service worker
    // We'll check the cache name by listing caches
    const cacheNames = await caches.keys();
    const mdviewerCache = cacheNames.find(name => name.startsWith('mdviewer-'));
    
    if (mdviewerCache) {
      // Extract version from cache name (format: mdviewer-v3.1)
      const version = mdviewerCache.replace('mdviewer-', '');
      return version;
    }

    return null;
  } catch (error) {
    console.warn("Failed to get cache version:", error);
    return null;
  }
}

/**
 * Check if a new service worker update is available
 */
export async function checkForUpdate(): Promise<{
  hasUpdate: boolean;
  waiting: boolean;
  installing: boolean;
}> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { hasUpdate: false, waiting: false, installing: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return { hasUpdate: false, waiting: false, installing: false };
    }

    // Check for updates
    await registration.update();

    return {
      hasUpdate: Boolean(registration.waiting || registration.installing),
      waiting: Boolean(registration.waiting),
      installing: Boolean(registration.installing),
    };
  } catch (error) {
    console.warn("Failed to check for updates:", error);
    return { hasUpdate: false, waiting: false, installing: false };
  }
}

/**
 * Trigger service worker update
 */
export async function triggerUpdate(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    // If there's a waiting worker, activate it
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
      return true;
    }

    // Otherwise, check for updates
    await registration.update();
    return true;
  } catch (error) {
    console.warn("Failed to trigger update:", error);
    return false;
  }
}

