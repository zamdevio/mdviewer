"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Service Worker Registration Component
 * 
 * Registers the service worker for offline functionality and handles updates.
 * Detects when new versions are available and notifies the user.
 */
export function ServiceWorkerRegister() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Check for updates and handle service worker lifecycle
  const checkForUpdates = useCallback(async (reg: ServiceWorkerRegistration) => {
    try {
      await reg.update();
    } catch (error) {
      console.warn("Service Worker update check failed:", error);
    }
  }, []);

  // Handle service worker updates
  const handleUpdate = useCallback((reg: ServiceWorkerRegistration) => {
    // Check if there's a waiting service worker (new version ready)
    if (reg.waiting) {
      setUpdateAvailable(true);
      return;
    }

    // Listen for new service worker installing
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed") {
            // New service worker installed and waiting
            if (navigator.serviceWorker.controller) {
              // There's an active service worker, so this is an update
              setUpdateAvailable(true);
              toast.info("New version available! Click to update.", {
                action: {
                  label: "Update",
                  onClick: () => {
                    // Send message to skip waiting
                    newWorker.postMessage({ type: "SKIP_WAITING" });
                    window.location.reload();
                  },
                },
                duration: 10000,
              });
            } else {
              // First install, no update needed
              console.log("[SW] Service worker installed for the first time");
            }
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register service worker
    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // Always check for updates
        });

        setRegistration(reg);
        handleUpdate(reg);

        // Check for updates on page load
        await checkForUpdates(reg);

        // Check for updates when page becomes visible (user returns to tab)
        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible" && reg) {
            checkForUpdates(reg);
          }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Periodic update check (every 5 minutes)
        const updateInterval = setInterval(() => {
          if (reg) {
            checkForUpdates(reg);
          }
        }, 5 * 60 * 1000);

        // Check for updates when online (in case we were offline)
        const handleOnline = () => {
          if (reg) {
            checkForUpdates(reg);
          }
        };

        window.addEventListener("online", handleOnline);

        return () => {
          document.removeEventListener("visibilitychange", handleVisibilityChange);
          window.removeEventListener("online", handleOnline);
          clearInterval(updateInterval);
        };
      } catch (error) {
        console.warn("Service Worker registration failed:", error);
      }
    };

    registerSW();
  }, [checkForUpdates, handleUpdate]);

  // Expose update function globally for manual refresh
  useEffect(() => {
    if (registration && updateAvailable) {
      // Store registration for update component
      (window as Window & { __swRegistration?: ServiceWorkerRegistration }).__swRegistration = registration;
    }
  }, [registration, updateAvailable]);

  return null;
}
