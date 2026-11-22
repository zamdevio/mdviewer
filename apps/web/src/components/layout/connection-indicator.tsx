import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useConnection, type ConnectionStatus } from "@/hooks/use-connection";
import { isApiConfigured } from "@/lib/config";
import { ModalShell } from "@/components/ui/modal-shell";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Settings,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";

type DisplayStatus = ConnectionStatus | "api-unset";

interface StatusConfig {
  icon: typeof WifiOff;
  dot: string;
  label: string;
  labelClass: string;
  description: string;
  detail: string;
  shareSettingsCta?: boolean;
}

function getStatusConfig(status: DisplayStatus): StatusConfig {
  switch (status) {
    case "offline":
      return {
        icon: WifiOff,
        dot: "bg-red-500",
        label: "Offline",
        labelClass: "text-red-600 dark:text-red-400",
        description: "No internet. Editing still works locally.",
        detail:
          "Your browser reports no network. Markdown editing, local files, and preview keep working. Share needs a connection.",
      };
    case "cors-blocked":
      return {
        icon: ShieldAlert,
        dot: "bg-orange-500",
        label: "CORS block",
        labelClass: "text-orange-600 dark:text-orange-400",
        description:
          "API is up but this origin is not allowed. Add it to worker ALLOWED_ORIGINS.",
        detail:
          "The share worker answered, but the browser blocked the request. Add this page origin to ALLOWED_ORIGINS on the worker (include http://localhost:3000 for local Vite), then redeploy.",
        shareSettingsCta: true,
      };
    case "server-down":
      return {
        icon: AlertCircle,
        dot: "bg-amber-500",
        label: "API down",
        labelClass: "text-amber-600 dark:text-amber-400",
        description: "Share server unreachable. Local editing still works.",
        detail:
          "Health check failed for the configured share API. Check the URL in Settings, that the worker is deployed, and that you’re online.",
        shareSettingsCta: true,
      };
    case "api-unset":
      return {
        icon: Settings,
        dot: "bg-muted-foreground/70",
        label: "Share off",
        labelClass: "text-muted-foreground",
        description: "API URL not set. Configure in Settings to enable share.",
        detail:
          "No share API URL is configured for this browser. Set a worker URL under Settings → Share (or rely on build-time VITE_API_URL / VITE_FRONTEND_URL).",
        shareSettingsCta: true,
      };
    case "online":
      return {
        icon: CheckCircle2,
        dot: "bg-emerald-500",
        label: "Connected",
        labelClass: "text-emerald-600 dark:text-emerald-400",
        description: "Share API is reachable from this origin.",
        detail:
          "The share worker is reachable. You can upload and open share links. Local files never leave this device unless you share.",
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/**
 * Navbar connection cue — status only (no timers/counters). Click opens details.
 */
export function ConnectionIndicator() {
  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { status, refresh } = useConnection();

  const displayStatus: DisplayStatus =
    status === "online" && !isApiConfigured() ? "api-unset" : status;
  const config = getStatusConfig(displayStatus);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  const Icon = config.icon;
  const title = `${config.label}: ${config.description}`;

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2 py-1 transition-colors hover:bg-muted/70"
        title={title}
        aria-label={`${config.label}. Open details.`}
        onClick={() => setDialogOpen(true)}
      >
        <span className="relative flex h-2.5 w-2.5">
          {displayStatus !== "online" && (
            <span
              className={`absolute inset-0 rounded-full ${config.dot} opacity-40 animate-ping`}
            />
          )}
          <span className={`relative h-2.5 w-2.5 rounded-full ${config.dot}`} />
        </span>
        <Icon
          className={`hidden h-3.5 w-3.5 sm:block ${
            displayStatus === "online" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
          }`}
        />
        <span
          className={`hidden text-xs font-medium sm:inline ${config.labelClass}`}
        >
          {config.label}
        </span>
      </button>

      <ModalShell
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={config.label}
      >
        <div className="flex items-start gap-3 mb-4 pr-8">
          <Icon
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              displayStatus === "online"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            }`}
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-lg mb-1 ${config.labelClass}`}>
              {config.label}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{config.detail}</p>
            <div className="flex flex-col gap-2">
              {config.shareSettingsCta && (
                <Button asChild variant="default" size="sm" className="w-full">
                  <Link
                    to="/settings#share"
                    onClick={() => setDialogOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Open share settings
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  void refresh();
                }}
              >
                <Wifi className="w-4 h-4" />
                Recheck now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </ModalShell>
    </>
  );
}
