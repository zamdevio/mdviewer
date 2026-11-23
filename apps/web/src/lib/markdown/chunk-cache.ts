import type { Root } from "hast";

export const CHUNK_HAST_CACHE_MAX = 200;

/**
 * Content-addressed LRU of parsed hast roots (chunk markdown hash → hast).
 * Same text hits even when heading splits shift indices.
 */
export class ChunkHastCache {
  private readonly map = new Map<string, Root>();
  private readonly max: number;

  constructor(max = CHUNK_HAST_CACHE_MAX) {
    this.max = Math.max(1, max);
  }

  get(hash: string): Root | undefined {
    const hit = this.map.get(hash);
    if (!hit) return undefined;
    // refresh LRU order
    this.map.delete(hash);
    this.map.set(hash, hit);
    return hit;
  }

  set(hash: string, hast: Root): void {
    if (this.map.has(hash)) this.map.delete(hash);
    this.map.set(hash, hast);
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }

  get size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}

/** Process-wide cache for the preview worker path. */
export const chunkHastCache = new ChunkHastCache();
