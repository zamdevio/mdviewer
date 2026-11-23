import { describe, expect, it, beforeEach } from "vitest";
import { chunkHastCache } from "./chunk-cache";
import { parseDocumentChunks } from "./worker-parser";
import { hashChunkMarkdown } from "./chunk-hash";

describe("parseDocumentChunks", () => {
  beforeEach(() => {
    chunkHastCache.clear();
  });

  it("parses and caches chunks by content hash", async () => {
    const md = ["Intro", "", "# One", "body"].join("\n");
    const first = await parseDocumentChunks(md);
    expect(first.length).toBeGreaterThan(1);
    expect(first[0]?.hast.type).toBe("root");

    const sizeAfter = chunkHastCache.size;
    expect(sizeAfter).toBe(first.length);

    const second = await parseDocumentChunks(md);
    expect(second.map((c) => c.hash)).toEqual(first.map((c) => c.hash));
    expect(chunkHastCache.size).toBe(sizeAfter);
  });

  it("reuses unchanged chunk hast when a later section changes", async () => {
    const a = ["# A", "one", "", "# B", "two"].join("\n");
    const first = await parseDocumentChunks(a);
    const hashA = hashChunkMarkdown(first[0]!.markdown);

    const b = ["# A", "one", "", "# B", "two changed"].join("\n");
    const second = await parseDocumentChunks(b);
    expect(second[0]?.hash).toBe(hashA);
    expect(second[0]?.hast).toBe(first[0]?.hast);
    expect(second[1]?.hash).not.toBe(first[1]?.hash);
  });
});
