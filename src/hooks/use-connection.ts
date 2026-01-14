import { useState, useEffect, useCallback } from "react";
import { config, isApiConfigured } from "@/lib/config";

export type ConnectionStatus = "online" | "offline" | "server-down";

interface ConnectionState {
  status: ConnectionStatus;
  isOnline: boolean;
  isServerReachable: boolean;
  lastChecked: number | null;
}

/**
 * Hook to monitor connection status (network + server)
 * 
 * Checks:
 * 1. Browser online/offline status
 * 2. API server health endpoint (if configured)
 * 
 * Returns current connection status and methods to manually check
 */
export function useConnection() {
  const [state, setState] = useState<ConnectionState>(() => {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    return {
      status: isOnline ? "online" : "offline",
      isOnline,
      isServerReachable: true,
      lastChecked: null,
    };
  });

  // Check API server health
  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    // If API is not configured, assume server is "reachable" (no server needed)
    if (!isApiConfigured() || !config.API_URL) {
      return true;
    }

    try {
      const healthUrl = `${config.API_URL}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal,
        cache: "no-cache",
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      // Network error, timeout, or server unreachable
      return false;
    }
  }, []);

  // Update connection status
  const updateStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    const isServerReachable = isOnline ? await checkServerHealth() : false;

    let status: ConnectionStatus;
    if (!isOnline) {
      status = "offline";
    } else if (!isServerReachable) {
      status = "server-down";
    } else {
      status = "online";
    }

    setState({
      status,
      isOnline,
      isServerReachable,
      lastChecked: Date.now(),
    });
  }, [checkServerHealth]);

  // Setup listeners and initial check
  useEffect(() => {
    // Use setTimeout to avoid calling setState synchronously in effect
    const initialCheck = setTimeout(() => {
      updateStatus();
    }, 0);

    // Listen to browser online/offline events
    const handleOnline = () => {
      updateStatus();
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        status: "offline",
        isOnline: false,
        lastChecked: Date.now(),
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Periodic health check (every 30 seconds when online)
    const healthCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        updateStatus();
      }
    }, 30000);

    return () => {
      clearTimeout(initialCheck);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(healthCheckInterval);
    };
  }, [updateStatus]);

  return {
    ...state,
    refresh: updateStatus,
  };
}

