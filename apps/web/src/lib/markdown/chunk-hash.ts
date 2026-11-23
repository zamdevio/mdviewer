/** Fast non-crypto hash for content-addressed chunk cache keys. */
export function hashChunkMarkdown(markdown: string): string {
  let h = 5381;
  for (let i = 0; i < markdown.length; i++) {
    h = ((h << 5) + h) ^ markdown.charCodeAt(i);
  }
  // unsigned 32-bit hex
  return (h >>> 0).toString(16).padStart(8, "0");
}
