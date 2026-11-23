import { describe, expect, it } from "vitest";
import type { Root } from "hast";
import {
  chunkNeedsParse,
  mergePlansKeepStale,
  type ChunkPlan,
} from "./worker-parser";

const fakeHast = { type: "root", children: [] } as Root;

function plan(
  partial: Partial<ChunkPlan> & Pick<ChunkPlan, "hash" | "markdown">,
): ChunkPlan {
  return {
    hast: null,
    hastHash: null,
    ...partial,
  };
}

describe("mergePlansKeepStale", () => {
  it("keeps prior hast while hash is refreshing", () => {
    const prev = [
      plan({ hash: "a", markdown: "old", hast: fakeHast, hastHash: "a" }),
    ];
    const next = [plan({ hash: "b", markdown: "new" })];
    const merged = mergePlansKeepStale(prev, next);
    expect(merged[0]!.hast).toBe(fakeHast);
    expect(merged[0]!.hash).toBe("b");
    expect(merged[0]!.hastHash).toBe("a");
    expect(chunkNeedsParse(merged[0]!)).toBe(true);
  });

  it("does not override a fresh cache hit", () => {
    const prev = [
      plan({ hash: "a", markdown: "old", hast: fakeHast, hastHash: "a" }),
    ];
    const next = [
      plan({ hash: "b", markdown: "new", hast: fakeHast, hastHash: "b" }),
    ];
    const merged = mergePlansKeepStale(prev, next);
    expect(merged[0]!.hastHash).toBe("b");
    expect(chunkNeedsParse(merged[0]!)).toBe(false);
  });
});
