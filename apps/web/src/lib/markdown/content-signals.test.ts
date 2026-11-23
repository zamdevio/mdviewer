import { describe, expect, it } from "vitest";
import { contentLikelyHasMath } from "./content-signals";

describe("contentLikelyHasMath", () => {
  it("is false for plain prose", () => {
    expect(contentLikelyHasMath("hello world")).toBe(false);
    expect(contentLikelyHasMath("price is 5 dollars")).toBe(false);
  });

  it("detects common math delimiters", () => {
    expect(contentLikelyHasMath("see $x^2$ here")).toBe(true);
    expect(contentLikelyHasMath("$$\na=1\n$$")).toBe(true);
    expect(contentLikelyHasMath("inline \\(a+b\\) ok")).toBe(true);
    expect(contentLikelyHasMath("\\[ E = mc^2 \\]")).toBe(true);
  });
});
