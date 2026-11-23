import {
  shouldVirtualizePreview,
  splitMarkdownChunks,
  VIRTUALIZE_PREVIEW_BYTES,
} from "@/lib/markdown/split-chunks";
import { sampleMemory, type MemorySample } from "@/lib/performance/memory-monitor";

export type PreviewPerfStatus = {
  bytes: number;
  virtualized: boolean;
  thresholdBytes: number;
  chunkCount: number;
  memory: MemorySample | null;
  /** Show badge when large enough or memory is under pressure */
  showBadge: boolean;
};

export function getPreviewPerfStatus(content: string): PreviewPerfStatus {
  const bytes = new Blob([content]).size;
  const virtualized = shouldVirtualizePreview(content);
  const chunkCount = virtualized ? splitMarkdownChunks(content).length : 1;
  const memory = sampleMemory();
  const memWarn = Boolean(memory && memory.usedRatio >= 0.75);
  return {
    bytes,
    virtualized,
    thresholdBytes: VIRTUALIZE_PREVIEW_BYTES,
    chunkCount,
    memory,
    showBadge: virtualized || memWarn || bytes >= VIRTUALIZE_PREVIEW_BYTES,
  };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}
