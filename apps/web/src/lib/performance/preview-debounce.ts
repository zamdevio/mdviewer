/** Debounce delay for markdown preview based on payload size (Phase 04 P1). */
export function previewDebounceMs(content: string): number {
  const bytes = new Blob([content]).size;
  if (bytes > 1_000_000) return 1200;
  if (bytes > 100_000) return 600;
  return 120;
}

/** Mermaid re-render debounce — longer for big diagrams. */
export function mermaidDebounceMs(code: string): number {
  const len = code.length;
  if (len > 4000) return 1500;
  if (len > 1500) return 1000;
  return 500;
}

/** Auto-save interval — longer for large docs. */
export function autoSaveDebounceMs(content: string): number {
  const bytes = new Blob([content]).size;
  if (bytes > 1_000_000) return 5000;
  if (bytes > 100_000) return 3000;
  return 2000;
}

/** Throttle helper for scroll sync on large files. */
export function throttle(fn: () => void, waitMs: number): () => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return () => {
    const now = Date.now();
    const remaining = waitMs - (now - last);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn();
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn();
      }, remaining);
    }
  };
}
