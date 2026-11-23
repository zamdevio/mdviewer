import { describe, expect, it } from "vitest";
import { generateId } from "./content";

describe("generateId", () => {
  it("returns 32 lowercase hex chars (double-click friendly)", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
    expect(id).not.toMatch(/[-+_/=]/);
  });

  it("is unique across many draws", () => {
    const set = new Set(Array.from({ length: 200 }, () => generateId()));
    expect(set.size).toBe(200);
  });
});
