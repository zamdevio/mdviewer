import { useMemo, useState } from "react";
import { Activity, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  formatBytes,
  getPreviewPerfStatus,
} from "@/lib/performance/preview-status";

export function PreviewPerfBadge({
  markdown,
  variant = "icon",
}: {
  markdown: string;
  /** icon = toolbar; chip = status bar next to Auto */
  variant?: "icon" | "chip";
}) {
  const [open, setOpen] = useState(false);
  const status = useMemo(() => getPreviewPerfStatus(markdown), [markdown]);

  if (!status.showBadge) return null;

  const label = status.virtualized ? "Virt" : "Sync";

  return (
    <>
      {variant === "chip" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex-shrink-0"
          title="Preview performance"
        >
          <Activity className="w-3 h-3 flex-shrink-0" />
          <span className="font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">
            {label}
          </span>
        </button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-8 w-8 p-0 flex-shrink-0"
          title={`Preview: ${label}`}
        >
          <Info className="w-4 h-4" />
        </Button>
      )}

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        title="Preview performance"
        className="max-w-sm"
      >
        <div className="space-y-3 pr-6">
          <h3 className="font-semibold text-lg">Preview performance</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Mode</dt>
              <dd className="font-medium">
                {status.virtualized ? "Virtual preview" : "Sync preview"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Doc size</dt>
              <dd className="font-mono">{formatBytes(status.bytes)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Virt threshold</dt>
              <dd className="font-mono">{formatBytes(status.thresholdBytes)}</dd>
            </div>
            {status.virtualized && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Chunks (h1/h2)</dt>
                <dd className="font-mono">{status.chunkCount}</dd>
              </div>
            )}
            {status.memory && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">JS heap</dt>
                <dd className="font-mono">
                  {formatBytes(status.memory.usedJSHeapBytes)} /{" "}
                  {formatBytes(status.memory.jsHeapLimitBytes)} (
                  {Math.round(status.memory.usedRatio * 100)}%)
                </dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-muted-foreground">
            Large previews virtualize off-screen chunks and parse via a Web Worker.
            The editor textarea is <strong>not</strong> virtualized — very large files
            can still feel heavy while typing.
          </p>
          <Button type="button" className="w-full" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </ModalShell>
    </>
  );
}
