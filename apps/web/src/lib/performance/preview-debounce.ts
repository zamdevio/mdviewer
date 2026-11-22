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
