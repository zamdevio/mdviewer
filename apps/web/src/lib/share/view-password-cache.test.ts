import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearCachedViewPassword,
  getCachedViewPassword,
  setCachedViewPassword,
} from "./view-password-cache";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  clear(): void {
    this.map.clear();
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe("view password cache", () => {
  beforeEach(() => {
    (globalThis as { sessionStorage?: Storage }).sessionStorage = new MemoryStorage();
  });

  afterEach(() => {
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
  });

  it("round-trips a password per share id", () => {
    setCachedViewPassword("abc", "hunter2");
    expect(getCachedViewPassword("abc")).toBe("hunter2");
  });

  it("keeps ids isolated", () => {
    setCachedViewPassword("abc", "one");
    setCachedViewPassword("xyz", "two");
    expect(getCachedViewPassword("abc")).toBe("one");
    expect(getCachedViewPassword("xyz")).toBe("two");
  });

  it("returns null for unknown ids", () => {
    expect(getCachedViewPassword("nope")).toBeNull();
  });

  it("overwrites on re-unlock and clears on demand", () => {
    setCachedViewPassword("abc", "old");
    setCachedViewPassword("abc", "new");
    expect(getCachedViewPassword("abc")).toBe("new");
    clearCachedViewPassword("abc");
    expect(getCachedViewPassword("abc")).toBeNull();
  });

  it("ignores empty ids and passwords", () => {
    setCachedViewPassword("", "pw");
    setCachedViewPassword("abc", "");
    expect(getCachedViewPassword("")).toBeNull();
    expect(getCachedViewPassword("abc")).toBeNull();
  });

  it("degrades to null when sessionStorage is absent", () => {
    delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
    expect(() => setCachedViewPassword("abc", "pw")).not.toThrow();
    expect(getCachedViewPassword("abc")).toBeNull();
    expect(() => clearCachedViewPassword("abc")).not.toThrow();
  });
});
