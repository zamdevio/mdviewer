import { describe, expect, it } from "vitest";
import { parseMarkdownToHast } from "./parse-pipeline";

describe("parseMarkdownToHast", () => {
  it("produces a root with a heading for ATX markdown", () => {
    const hast = parseMarkdownToHast("# Hello");
    expect(hast.type).toBe("root");
    const heading = hast.children.find((c) => c.type === "element" && c.tagName === "h1");
    expect(heading).toBeDefined();
  });

  it("sanitizes script tags out of raw HTML", () => {
    const hast = parseMarkdownToHast('<script>alert(1)</script>\n\npara');
    const html = JSON.stringify(hast);
    expect(html).not.toMatch(/script/i);
  });
});
