import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConnection, type ConnectionStatus } from "@/hooks/use-connection";
import { isApiConfigured } from "@/lib/config";
import { AlertCircle, Settings, WifiOff } from "lucide-react";

type DisplayStatus = ConnectionStatus | "api-unset";

interface StatusConfig {
  icon: typeof WifiOff;
  dot: string;
  label: string;
  description: string;
  href?: string;
}

function getStatusConfig(status: DisplayStatus): StatusConfig | null {
  switch (status) {
    case "offline":
      return {
        icon: WifiOff,
        dot: "bg-red-500",
        label: "Offline",
        description: "No internet. Editing still works locally.",
      };
    case "server-down":
      return {
        icon: AlertCircle,
        dot: "bg-amber-500",
        label: "API down",
        description: "Share server unreachable. Local editing still works.",
      };
    case "api-unset":
      return {
        icon: Settings,
        dot: "bg-muted-foreground/70",
        label: "Share off",
        description: "API URL not set. Configure in Settings to enable share.",
        href: "/settings",
      };
    case "online":
      return null;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/**
 * Navbar connection cue — only when something needs attention.
 */
export function ConnectionIndicator() {
  const [mounted, setMounted] = useState(false);
  const { status, lastChecked } = useConnection();
  const [timeAgo, setTimeAgo] = useState<number | null>(null);

  const displayStatus: DisplayStatus =
    status === "online" && !isApiConfigured() ? "api-unset" : status;
  const config = getStatusConfig(displayStatus);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!lastChecked || displayStatus === "api-unset") {
      setTimeAgo(null);
      return;
    }
    const tick = () => setTimeAgo(Math.floor((Date.now() - lastChecked) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastChecked, displayStatus]);

  if (!mounted || !config) return null;

  const Icon = config.icon;
  const checked =
    timeAgo !== null
      ? ` · checked ${timeAgo < 60 ? `${timeAgo}s` : `${Math.floor(timeAgo / 60)}m`} ago`
      : "";
  const title = `${config.label}: ${config.description}${checked}`;

  const inner = (
    <>
      <span className="relative flex h-2.5 w-2.5">
        <span className={`absolute inset-0 rounded-full ${config.dot} opacity-40 animate-ping`} />
        <span className={`relative h-2.5 w-2.5 rounded-full ${config.dot}`} />
      </span>
      <Icon className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
      <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
        {config.label}
      </span>
    </>
  );

  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2 py-1 transition-colors hover:bg-muted/70";

  if (config.href) {
    return (
      <Link to={config.href} className={className} title={title}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} title={title}>
      {inner}
    </div>
  );
}
