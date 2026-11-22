import { useEffect } from "react";

/**
 * Legacy banner removed — ServiceWorkerRegister auto-activates waiting
 * workers so a normal reload picks up the new build. Kept as a no-op
 * mount point for App shell compatibility.
 */
export function UpdatePrompt() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const kickWaiting = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch {
        /* ignore */
      }
    };

    void kickWaiting();
  }, []);

  return null;
}
