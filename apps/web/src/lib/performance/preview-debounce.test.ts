import { describe, expect, it, vi } from "vitest";
import {
  autoSaveDebounceMs,
  mermaidDebounceMs,
  previewDebounceMs,
  throttle,
} from "./preview-debounce";

describe("previewDebounceMs", () => {
  it("scales with size", () => {
    expect(previewDebounceMs("hi")).toBe(120);
    expect(previewDebounceMs("x".repeat(150_000))).toBe(600);
    expect(previewDebounceMs("x".repeat(1_100_000))).toBe(1200);
  });
});

describe("mermaidDebounceMs", () => {
  it("scales with diagram length", () => {
    expect(mermaidDebounceMs("graph TD;A-->B")).toBe(500);
    expect(mermaidDebounceMs("x".repeat(2000))).toBe(1000);
    expect(mermaidDebounceMs("x".repeat(5000))).toBe(1500);
  });
});

describe("autoSaveDebounceMs", () => {
  it("scales with size", () => {
    expect(autoSaveDebounceMs("small")).toBe(2000);
    expect(autoSaveDebounceMs("x".repeat(150_000))).toBe(3000);
    expect(autoSaveDebounceMs("x".repeat(1_100_000))).toBe(5000);
  });
});

describe("throttle", () => {
  it("limits calls within window", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t();
    t();
    t();
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
