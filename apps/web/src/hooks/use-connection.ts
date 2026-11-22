import { useState, useEffect, useCallback } from "react";
import { getEffectiveApiConfig } from "@/lib/config";
import { probeApiHealth } from "@/lib/api-errors";

export type ConnectionStatus = "online" | "offline" | "server-down" | "cors-blocked";

interface ConnectionState {
  status: ConnectionStatus;
  isOnline: boolean;
  isServerReachable: boolean;
  isCorsBlocked: boolean;
  lastChecked: number | null;
}

/**
 * Hook to monitor connection status (network + server + CORS).
 */
export function useConnection() {
  const [state, setState] = useState<ConnectionState>(() => {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    return {
      status: isOnline ? "online" : "offline",
      isOnline,
      isServerReachable: true,
      isCorsBlocked: false,
      lastChecked: null,
    };
  });

  const checkServerHealth = useCallback(async (): Promise<"ok" | "cors" | "down" | "skip"> => {
    const { API_URL } = getEffectiveApiConfig();
    if (!API_URL || !API_URL.trim()) {
      return "skip";
    }
    return probeApiHealth(`${API_URL}/health`);
  }, []);

  const updateStatus = useCallback(async () => {
    const isOnline = navigator.onLine;
    if (!isOnline) {
      setState({
        status: "offline",
        isOnline: false,
        isServerReachable: false,
        isCorsBlocked: false,
        lastChecked: Date.now(),
      });
      return;
    }

    const health = await checkServerHealth();
    let status: ConnectionStatus = "online";
    let isServerReachable = true;
    let isCorsBlocked = false;

    if (health === "cors") {
      status = "cors-blocked";
      isServerReachable = true;
      isCorsBlocked = true;
    } else if (health === "down") {
      status = "server-down";
      isServerReachable = false;
    } else {
      // ok | skip
      status = "online";
      isServerReachable = true;
    }

    setState({
      status,
      isOnline: true,
      isServerReachable,
      isCorsBlocked,
      lastChecked: Date.now(),
    });
  }, [checkServerHealth]);

  useEffect(() => {
    const initialCheck = setTimeout(() => {
      updateStatus();
    }, 100);

    const handleOnline = () => {
      updateStatus();
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        status: "offline",
        isOnline: false,
        isServerReachable: false,
        isCorsBlocked: false,
        lastChecked: Date.now(),
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

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
