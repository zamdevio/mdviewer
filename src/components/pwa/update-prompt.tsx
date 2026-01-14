"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";


/**
 * PWA Update Prompt Component
 * 
 * Shows a prompt when a new version of the app is available.
 * Allows users to update immediately or dismiss the notification.
 */
export function UpdatePrompt() {
  // Initialize showPrompt based on sessionStorage to avoid setState in effect
  const [showPrompt, setShowPrompt] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("sw-update-dismissed");
  });
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const checkForWaitingWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.waiting) {
          setRegistration(reg);
          setShowPrompt(true);
        }
      } catch (error) {
        console.warn("Failed to check for waiting service worker:", error);
      }
    };

    // Check on mount
    checkForWaitingWorker();

    // Listen for service worker updates
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Service worker updated, reload to get new version
      window.location.reload();
    });

    // Check periodically
    const interval = setInterval(checkForWaitingWorker, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    if (!registration || !registration.waiting) {
      return;
    }

    // Tell the waiting service worker to skip waiting and activate
    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // The controllerchange event will trigger a reload
    // But we'll also reload manually after a short delay as fallback
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in sessionStorage to avoid showing again this session
    sessionStorage.setItem("sw-update-dismissed", "true");
  };

  if (!showPrompt || !registration) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-card border border-primary/20 rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Update Available</h3>
          <p className="text-xs text-muted-foreground">
            A new version of MD Viewer is available. Update now to get the latest features.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleUpdate}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Update
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

