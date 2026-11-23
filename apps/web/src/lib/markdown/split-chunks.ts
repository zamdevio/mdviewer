/** Bytes above which preview uses chunk virtualization. */
export const VIRTUALIZE_PREVIEW_BYTES = 100_000;

/** Prefer splitting before ATX h1/h2 so TOC-scale sections become rows. */
const HEADING_SPLIT = /^(#{1,2})\s+.+/;

/**
 * Split markdown into top-level chunks for virtualized preview.
 * Keeps fenced code intact (no split inside ``` … ```).
 * Returns a single chunk when there is nothing useful to split.
 */
export function splitMarkdownChunks(content: string): string[] {
  if (!content) return [""];

  const lines = content.split("\n");
  const chunks: string[] = [];
  let buf: string[] = [];
  let inFence = false;

  const flush = () => {
    const text = buf.join("\n");
    if (text.length > 0 || chunks.length === 0) {
      chunks.push(text);
    }
    buf = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const fence = line.trimStart().startsWith("```");
    if (fence) inFence = !inFence;

    const isHeading =
      !inFence && HEADING_SPLIT.test(line) && buf.some((l) => l.trim().length > 0);

    if (isHeading) {
      flush();
    }
    buf.push(line);
  }
  flush();

  // Drop a leading empty chunk if we somehow created one
  if (chunks.length > 1 && chunks[0] === "") {
    chunks.shift();
  }

  return chunks.length > 0 ? chunks : [content];
}

export function shouldVirtualizePreview(content: string): boolean {
  // Blob size matches previewDebounceMs tiers; avoid allocating Blob for tiny strings
  if (content.length < VIRTUALIZE_PREVIEW_BYTES) return false;
  return new Blob([content]).size >= VIRTUALIZE_PREVIEW_BYTES;
}
