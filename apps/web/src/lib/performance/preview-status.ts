import {
  shouldVirtualizePreview,
  splitMarkdownChunks,
  VIRTUALIZE_PREVIEW_BYTES,
} from "@/lib/markdown/split-chunks";
import { sampleMemory, type MemorySample } from "@/lib/performance/memory-monitor";

/** Preview load tiers for badge + panel chrome (site-fit, not editor virt). */
export type PreviewLoadLevel =
  | "sync"
  | "light"
  | "steady"
  | "elevated"
  | "heavy"
  | "critical";

export type PreviewPerfStatus = {
  bytes: number;
  virtualized: boolean;
  thresholdBytes: number;
  chunkCount: number;
  memory: MemorySample | null;
  level: PreviewLoadLevel;
  levelLabel: string;
  /** Show badge when large enough or memory is under pressure */
  showBadge: boolean;
};

const LEVEL_META: Record<
  PreviewLoadLevel,
  { label: string }
> = {
  sync: { label: "Sync" },
  light: { label: "Light" },
  steady: { label: "Steady" },
  elevated: { label: "Elevated" },
  heavy: { label: "Heavy" },
  critical: { label: "Critical" },
};

export function getPreviewLoadLevel(
  bytes: number,
  virtualized: boolean,
  memory: MemorySample | null,
): PreviewLoadLevel {
  const ratio = memory?.usedRatio ?? 0;
  if (ratio >= 0.85) return "critical";
  if (ratio >= 0.7 || bytes >= 2_000_000) return "heavy";
  if (ratio >= 0.55 || bytes >= 1_000_000) return "elevated";
  if (!virtualized && bytes < VIRTUALIZE_PREVIEW_BYTES) return "sync";
  if (bytes >= 500_000) return "steady";
  return "light";
}

export function getPreviewPerfStatus(content: string): PreviewPerfStatus {
  const bytes = new Blob([content]).size;
  const virtualized = shouldVirtualizePreview(content);
  const chunkCount = virtualized ? splitMarkdownChunks(content).length : 1;
  const memory = sampleMemory();
  const memWarn = Boolean(memory && memory.usedRatio >= 0.75);
  const level = getPreviewLoadLevel(bytes, virtualized, memory);
  return {
    bytes,
    virtualized,
    thresholdBytes: VIRTUALIZE_PREVIEW_BYTES,
    chunkCount,
    memory,
    level,
    levelLabel: LEVEL_META[level].label,
    showBadge: virtualized || memWarn || bytes >= VIRTUALIZE_PREVIEW_BYTES,
  };
}

/** Tailwind-ish class packs for badge + dialog chrome by load level. */
export function previewLoadTone(level: PreviewLoadLevel): {
  badge: string;
  panel: string;
  accent: string;
  dot: string;
} {
  switch (level) {
    case "sync":
      return {
        badge:
          "bg-muted/60 text-muted-foreground border-border hover:bg-muted",
        panel: "border-border bg-muted/20",
        accent: "text-muted-foreground",
        dot: "bg-muted-foreground/70",
      };
    case "light":
      return {
        badge:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15",
        panel:
          "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10",
        accent: "text-emerald-700 dark:text-emerald-400",
        dot: "bg-emerald-500",
      };
    case "steady":
      return {
        badge:
          "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25 hover:bg-sky-500/15",
        panel: "border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10",
        accent: "text-sky-700 dark:text-sky-400",
        dot: "bg-sky-500",
      };
    case "elevated":
      return {
        badge:
          "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/15",
        panel: "border-amber-500/35 bg-amber-500/5 dark:bg-amber-500/10",
        accent: "text-amber-800 dark:text-amber-400",
        dot: "bg-amber-500",
      };
    case "heavy":
      return {
        badge:
          "bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/15",
        panel: "border-orange-500/35 bg-orange-500/5 dark:bg-orange-500/10",
        accent: "text-orange-800 dark:text-orange-400",
        dot: "bg-orange-500",
      };
    case "critical":
      return {
        badge:
          "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/35 hover:bg-rose-500/15",
        panel: "border-rose-500/40 bg-rose-500/5 dark:bg-rose-500/10",
        accent: "text-rose-700 dark:text-rose-400",
        dot: "bg-rose-500",
      };
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
