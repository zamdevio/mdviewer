import { useEffect, useCallback } from "react";
import { toast } from "sonner";

const RELOAD_GUARD_KEY = "mdviewer-sw-reloading";

function activateWaiting(worker: ServiceWorker) {
  worker.postMessage({ type: "SKIP_WAITING" });
}

/**
 * Production only — Vite HMR + a SW fighting over modules breaks normal reloads.
 * On localhost we unregister any existing SW and clear mdviewer caches so Ctrl+R works.
 */
async function disableServiceWorkerInDev() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("mdviewer-") || k.startsWith("workbox-") || k.startsWith("next-"))
          .map((k) => caches.delete(k))
      );
    }
    console.info("[SW] Dev mode: unregistered service workers and cleared app caches");
  } catch (error) {
    console.warn("[SW] Dev cleanup failed:", error);
  }
}

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

    // Dev / localhost: never control the page
    if (import.meta.env.DEV) {
      void disableServiceWorkerInDev();
      return;
    }

    let cancelled = false;

    const onControllerChange = () => {
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

        if (reg.waiting) {
          activateWaiting(reg.waiting);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state !== "installed") return;
            if (navigator.serviceWorker.controller) {
              toast.info("Update ready — applying…", { duration: 2000 });
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
