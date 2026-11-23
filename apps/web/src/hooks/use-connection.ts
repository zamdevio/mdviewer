import { useCallback, useState, useSyncExternalStore } from "react";
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

type Listener = () => void;

const RETRY_MS = 30_000;

const initialOnline =
  typeof navigator !== "undefined" ? navigator.onLine : true;

let state: ConnectionState = {
  status: initialOnline ? "online" : "offline",
  isOnline: initialOnline,
  isServerReachable: true,
  isCorsBlocked: false,
  lastChecked: null,
};

const listeners = new Set<Listener>();
let started = false;
let inFlight: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let bootTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function setState(next: ConnectionState) {
  state = next;
  emit();
}

function clearRetry() {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
}

function scheduleRetryIfUnhealthy() {
  clearRetry();
  if (state.status === "online" || state.status === "offline") {
    return;
  }
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void refreshConnection();
  }, RETRY_MS);
}

async function checkServerHealth(): Promise<"ok" | "cors" | "down" | "skip"> {
  const { API_URL } = getEffectiveApiConfig();
  if (!API_URL || !API_URL.trim()) {
    return "skip";
  }
  return probeApiHealth(`${API_URL}/health`);
}

async function refreshConnection(): Promise<void> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = (async () => {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    if (!isOnline) {
      setState({
        status: "offline",
        isOnline: false,
        isServerReachable: false,
        isCorsBlocked: false,
        lastChecked: Date.now(),
      });
      clearRetry();
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
    }

    setState({
      status,
      isOnline: true,
      isServerReachable,
      isCorsBlocked,
      lastChecked: Date.now(),
    });
    scheduleRetryIfUnhealthy();
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

function handleOnline() {
  void refreshConnection();
}

function handleOffline() {
  setState({
    ...state,
    status: "offline",
    isOnline: false,
    isServerReachable: false,
    isCorsBlocked: false,
    lastChecked: Date.now(),
  });
  clearRetry();
}

function ensureStarted() {
  if (started || typeof window === "undefined") {
    return;
  }
  started = true;
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  bootTimer = setTimeout(() => {
    bootTimer = null;
    void refreshConnection();
  }, 100);
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  ensureStarted();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConnectionState {
  return state;
}

function getServerSnapshot(): ConnectionState {
  return state;
}

/**
 * Shared connection status (network + share API + CORS).
 * One health probe on first mount, on Recheck, when the browser comes online,
 * and on a backoff timer only while the API looks unhealthy — never while Connected.
 */
export function useConnection() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      await refreshConnection();
    } finally {
      setChecking(false);
    }
  }, []);

  return {
    ...snapshot,
    checking,
    refresh,
  };
}
