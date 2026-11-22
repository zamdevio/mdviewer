/**
 * Best-effort heap sampling (Chromium `performance.memory` only).
 * Used to warn on large-doc edit sessions — not a hard limit.
 */

export type MemorySample = {
  usedJSHeapBytes: number;
  totalJSHeapBytes: number;
  jsHeapLimitBytes: number;
  usedRatio: number;
};

type PerformanceMemory = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};

function getMemory(): PerformanceMemory | null {
  if (typeof performance === "undefined") return null;
  const mem = (performance as Performance & { memory?: PerformanceMemory }).memory;
  if (!mem || !mem.jsHeapSizeLimit) return null;
  return mem;
}

export function isMemoryMonitorAvailable(): boolean {
  return getMemory() != null;
}

export function sampleMemory(): MemorySample | null {
  const mem = getMemory();
  if (!mem) return null;
  return {
    usedJSHeapBytes: mem.usedJSHeapSize,
    totalJSHeapBytes: mem.totalJSHeapSize,
    jsHeapLimitBytes: mem.jsHeapSizeLimit,
    usedRatio: mem.usedJSHeapSize / mem.jsHeapSizeLimit,
  };
}

/** Default warn when used heap exceeds this fraction of the limit. */
export const MEMORY_WARN_RATIO = 0.75;

export function shouldWarnMemory(
  sample: MemorySample | null,
  threshold = MEMORY_WARN_RATIO,
): boolean {
  if (!sample) return false;
  return sample.usedRatio >= threshold;
}

/**
 * Poll memory while `enabled`. Calls `onWarn` at most once until ratio drops
 * below `threshold - resetSlack`.
 */
export function startMemoryMonitor(options: {
  enabled: boolean;
  intervalMs?: number;
  threshold?: number;
  resetSlack?: number;
  onSample?: (sample: MemorySample) => void;
  onWarn?: (sample: MemorySample) => void;
}): () => void {
  const {
    enabled,
    intervalMs = 5000,
    threshold = MEMORY_WARN_RATIO,
    resetSlack = 0.1,
    onSample,
    onWarn,
  } = options;

  if (!enabled || typeof window === "undefined" || !isMemoryMonitorAvailable()) {
    return () => undefined;
  }

  let warned = false;
  const tick = () => {
    const sample = sampleMemory();
    if (!sample) return;
    onSample?.(sample);
    if (shouldWarnMemory(sample, threshold)) {
      if (!warned) {
        warned = true;
        onWarn?.(sample);
      }
    } else if (sample.usedRatio < threshold - resetSlack) {
      warned = false;
    }
  };

  tick();
  const id = window.setInterval(tick, intervalMs);
  return () => window.clearInterval(id);
}
