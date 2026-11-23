import { describe, expect, it } from "vitest";
import { normalizeMarkdownHash } from "./heading-anchors";

describe("normalizeMarkdownHash", () => {
  it("normalizes bare ids and hashes", () => {
    expect(normalizeMarkdownHash("alpha-section")).toBe("#alpha-section");
    expect(normalizeMarkdownHash("#alpha-section")).toBe("#alpha-section");
    expect(normalizeMarkdownHash("")).toBe("");
    expect(normalizeMarkdownHash("#")).toBe("");
  });
});
