"use client";

import { useState, useEffect } from "react";
import { useConnection, type ConnectionStatus } from "@/hooks/use-connection";
import { WifiOff, AlertCircle } from "lucide-react";

interface StatusConfig {
  icon: typeof WifiOff;
  color: string;
  text: string;
  description: string;
}

function getStatusConfig(status: ConnectionStatus): StatusConfig | null {
  switch (status) {
    case "offline":
      return {
        icon: WifiOff,
        color: "bg-red-500",
        text: "Offline",
        description: "No internet connection. App is running in offline mode.",
      };
    case "server-down":
      return {
        icon: AlertCircle,
        color: "bg-orange-500",
        text: "Server Unavailable",
        description: "Internet is connected but the server is unreachable. App is running in offline mode.",
      };
    case "online":
    default:
      return null;
  }
}

/**
 * Connection Status Indicator Component
 * 
 * Shows a colored dot indicator in the navbar that reflects:
 * - Orange: Online but server down
 * - Red: Offline
 * 
 * Only shows when there's an issue (hides when online)
 */
export function ConnectionIndicator() {
  const [mounted, setMounted] = useState(false);
  const { status, lastChecked } = useConnection();
  const [timeAgo, setTimeAgo] = useState<number | null>(null);
  const config = getStatusConfig(status);

  // Wait for component to mount to prevent hydration mismatch
  useEffect(() => {
    // Use setTimeout to avoid calling setState synchronously in effect
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Calculate time ago in a useEffect to avoid calling Date.now() during render
  useEffect(() => {
    if (!lastChecked) {
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => setTimeAgo(null), 0);
      return;
    }

    const updateTimeAgo = () => {
      setTimeAgo(Math.floor((Date.now() - lastChecked) / 1000));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastChecked]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Don't show indicator when online
  if (!config) {
    return null;
  }

  const Icon = config.icon;
  const tooltipText = timeAgo !== null
    ? `${config.text}: ${config.description} (Checked ${timeAgo < 60 ? `${timeAgo}s` : `${Math.floor(timeAgo / 60)}m`} ago)`
    : `${config.text}: ${config.description}`;

  return (
    <div 
      className="flex items-center gap-2 cursor-help group"
      title={tooltipText}
    >
      <div className="relative">
        <div className={`w-2.5 h-2.5 ${config.color} rounded-full animate-pulse`} />
        <div
          className={`absolute inset-0 ${config.color} rounded-full opacity-50 animate-ping`}
        />
      </div>
      <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </div>
  );
}

