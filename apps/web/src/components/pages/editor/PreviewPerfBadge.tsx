import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  formatBytes,
  getPreviewPerfStatus,
  previewLoadTone,
} from "@/lib/performance/preview-status";
import { cn } from "@/lib/utils";

/** Editor-tools Virtualization control — only rendered in the expanded toolbar. */
export function PreviewPerfBadge({ markdown }: { markdown: string }) {
  const [open, setOpen] = useState(false);
  const status = useMemo(() => getPreviewPerfStatus(markdown), [markdown]);
  const tone = previewLoadTone(status.level);

  if (!status.showBadge) return null;

  const modeLabel = status.virtualized ? "Virtualization" : "Sync preview";
  const title = `${modeLabel} · ${status.levelLabel}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={title}
        className={cn(
          "inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors",
          tone.badge,
        )}
      >
        <Layers className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="hidden text-xs font-medium sm:inline">Virtualization</span>
        <span className="hidden text-[10px] font-semibold uppercase tracking-wide opacity-80 md:inline">
          {status.levelLabel}
        </span>
      </button>

      <ModalShell
        open={open}
        onClose={() => setOpen(false)}
        title="Virtualization"
        className="max-w-sm"
      >
        <div className={cn("space-y-3 pr-6 rounded-lg border p-3 -mx-1", tone.panel)}>
          <div className="flex items-start gap-2">
            <span
              className={cn(
                "mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0",
                tone.dot,
              )}
            />
            <div className="min-w-0">
              <h3 className={cn("font-semibold text-lg", tone.accent)}>
                Virtualization
              </h3>
              <p className="text-sm text-muted-foreground">
                Load:{" "}
                <span className={cn("font-medium", tone.accent)}>
                  {status.levelLabel}
                </span>
                {" · "}
                {status.virtualized ? "virtual preview on" : "sync preview"}
              </p>
            </div>
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Mode</dt>
              <dd className="font-medium">
                {status.virtualized ? "Virtualized preview" : "Sync preview"}
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
