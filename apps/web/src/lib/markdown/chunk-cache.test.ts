import { describe, expect, it } from "vitest";
import { hashChunkMarkdown } from "./chunk-hash";
import { ChunkHastCache } from "./chunk-cache";
import type { Root } from "hast";

function emptyRoot(): Root {
  return { type: "root", children: [] };
}

describe("hashChunkMarkdown", () => {
  it("is stable for the same input", () => {
    expect(hashChunkMarkdown("# A\n")).toBe(hashChunkMarkdown("# A\n"));
  });

  it("differs when content differs", () => {
    expect(hashChunkMarkdown("# A")).not.toBe(hashChunkMarkdown("# B"));
  });
});

describe("ChunkHastCache", () => {
  it("returns set values and refreshes LRU on get", () => {
    const cache = new ChunkHastCache(2);
    const a = emptyRoot();
    const b = emptyRoot();
    const c = emptyRoot();
    cache.set("a", a);
    cache.set("b", b);
    expect(cache.get("a")).toBe(a);
    cache.set("c", c);
    // "b" was oldest after "a" was refreshed
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(a);
    expect(cache.get("c")).toBe(c);
  });

  it("evicts oldest when over max", () => {
    const cache = new ChunkHastCache(1);
    cache.set("x", emptyRoot());
    cache.set("y", emptyRoot());
    expect(cache.size).toBe(1);
    expect(cache.get("x")).toBeUndefined();
    expect(cache.get("y")).toBeDefined();
  });
});
