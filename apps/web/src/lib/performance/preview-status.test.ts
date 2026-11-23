import { describe, expect, it } from "vitest";
import { getPreviewLoadLevel, previewLoadTone } from "./preview-status";
import { VIRTUALIZE_PREVIEW_BYTES } from "@/lib/markdown/split-chunks";

describe("getPreviewLoadLevel", () => {
  it("returns sync under the virt threshold", () => {
    expect(getPreviewLoadLevel(10_000, false, null)).toBe("sync");
  });

  it("returns light just above threshold", () => {
    expect(
      getPreviewLoadLevel(VIRTUALIZE_PREVIEW_BYTES, true, null),
    ).toBe("light");
  });

  it("escalates by size and memory", () => {
    expect(getPreviewLoadLevel(600_000, true, null)).toBe("steady");
    expect(getPreviewLoadLevel(1_200_000, true, null)).toBe("elevated");
    expect(getPreviewLoadLevel(2_500_000, true, null)).toBe("heavy");
    expect(
      getPreviewLoadLevel(100_000, true, {
        usedJSHeapBytes: 850,
        totalJSHeapBytes: 1000,
        jsHeapLimitBytes: 1000,
        usedRatio: 0.9,
      }),
    ).toBe("critical");
  });
});

describe("previewLoadTone", () => {
  it("covers every level", () => {
    for (const level of [
      "sync",
      "light",
      "steady",
      "elevated",
      "heavy",
      "critical",
    ] as const) {
      expect(previewLoadTone(level).badge.length).toBeGreaterThan(0);
      expect(previewLoadTone(level).panel.length).toBeGreaterThan(0);
    }
  });
});
