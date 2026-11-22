import { useEffect, useCallback } from "react";
import { toast } from "sonner";

const RELOAD_GUARD_KEY = "mdviewer-sw-reloading";

function activateWaiting(worker: ServiceWorker) {
  worker.postMessage({ type: "SKIP_WAITING" });
}

/**
 * Registers the service worker and activates updates so a normal reload
 * (Ctrl+R) is enough — no hard refresh required.
 */
export function ServiceWorkerRegister() {
  const checkForUpdates = useCallback(async (reg: ServiceWorkerRegistration) => {
    try {
      await reg.update();
    } catch (error) {
      console.warn("Service Worker update check failed:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    const onControllerChange = () => {
      // Avoid reload loops when multiple tabs claim
      if (sessionStorage.getItem(RELOAD_GUARD_KEY)) {
        sessionStorage.removeItem(RELOAD_GUARD_KEY);
        return;
      }
      sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (cancelled) return;

        // Waiting worker from a previous visit — activate immediately
        if (reg.waiting) {
          activateWaiting(reg.waiting);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state !== "installed") return;
            if (navigator.serviceWorker.controller) {
              toast.info("Update ready — applying…", { duration: 2500 });
              activateWaiting(newWorker);
            }
          });
        });

        await checkForUpdates(reg);

        const handleVisibilityChange = () => {
          if (document.visibilityState === "visible") {
            checkForUpdates(reg);
          }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        const updateInterval = setInterval(() => checkForUpdates(reg), 5 * 60 * 1000);

        const handleOnline = () => checkForUpdates(reg);
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

    const cleanupPromise = registerSW();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      void cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [checkForUpdates]);

  return null;
}
