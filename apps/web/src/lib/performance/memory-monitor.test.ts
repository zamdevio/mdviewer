import { describe, expect, it } from "vitest";
import {
  MEMORY_WARN_RATIO,
  shouldWarnMemory,
  type MemorySample,
} from "./memory-monitor";

function sample(usedRatio: number): MemorySample {
  const jsHeapLimitBytes = 1000;
  return {
    usedJSHeapBytes: Math.round(usedRatio * jsHeapLimitBytes),
    totalJSHeapBytes: jsHeapLimitBytes,
    jsHeapLimitBytes,
    usedRatio,
  };
}

describe("shouldWarnMemory", () => {
  it("is false for null", () => {
    expect(shouldWarnMemory(null)).toBe(false);
  });

  it("warns at default threshold", () => {
    expect(shouldWarnMemory(sample(MEMORY_WARN_RATIO - 0.01))).toBe(false);
    expect(shouldWarnMemory(sample(MEMORY_WARN_RATIO))).toBe(true);
    expect(shouldWarnMemory(sample(0.99))).toBe(true);
  });

  it("respects custom threshold", () => {
    expect(shouldWarnMemory(sample(0.5), 0.6)).toBe(false);
    expect(shouldWarnMemory(sample(0.6), 0.6)).toBe(true);
  });
});
