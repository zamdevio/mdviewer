import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import { getEffectiveApiConfig } from "@/lib/config";

export function CorsWarningDialog({
  show,
  onClose,
  detail,
}: {
  show: boolean;
  onClose: () => void;
  detail?: string | null;
}) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const { API_URL } = getEffectiveApiConfig();

  return (
    <ModalShell open={show} onClose={onClose} title="Share blocked by CORS">
      <div className="flex items-start gap-3 mb-4 pr-8">
        <ShieldAlert className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-orange-600 dark:text-orange-400 mb-1">
            CORS Block
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            The share API answered, but the browser blocked the request because this page origin
            is not in the worker&apos;s allowlist.
          </p>
          {detail && (
            <p className="text-xs text-muted-foreground mb-3 rounded-md border border-border bg-muted/40 px-3 py-2">
              {detail}
            </p>
          )}
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <p>
              Current origin:{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{origin}</code>
            </p>
            <p>
              API:{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono break-all">
                {API_URL || "(unset)"}
              </code>
            </p>
            <p>
              Fix: add that origin to{" "}
              <code className="bg-muted px-1 rounded text-xs">ALLOWED_ORIGINS</code> in{" "}
              <code className="bg-muted px-1 rounded text-xs">apps/worker/wrangler.jsonc</code>, then
              redeploy the worker. Local share needs{" "}
              <code className="bg-muted px-1 rounded text-xs">http://localhost:3000</code>.
            </p>
          </div>
          <Button variant="default" size="sm" onClick={onClose} className="w-full">
            Got it
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
