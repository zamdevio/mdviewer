import { describe, expect, it } from "vitest";
import {
  splitMarkdownChunks,
  shouldVirtualizePreview,
  VIRTUALIZE_PREVIEW_BYTES,
} from "./split-chunks";

describe("splitMarkdownChunks", () => {
  it("returns one chunk for short docs without headings", () => {
    expect(splitMarkdownChunks("hello\n\nworld")).toEqual(["hello\n\nworld"]);
  });

  it("splits before h1/h2 when prior content exists", () => {
    const md = ["Intro para", "", "# One", "a", "", "## Two", "b"].join("\n");
    expect(splitMarkdownChunks(md)).toEqual([
      "Intro para\n",
      "# One\na\n",
      "## Two\nb",
    ]);
  });

  it("does not split on headings inside fences", () => {
    const md = ["```", "# not a heading", "```", "", "## Real", "x"].join("\n");
    const chunks = splitMarkdownChunks(md);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toContain("# not a heading");
    expect(chunks[1]).toMatch(/^## Real/);
  });

  it("does not split on h3+", () => {
    const md = ["# A", "x", "### deep", "y"].join("\n");
    expect(splitMarkdownChunks(md)).toEqual(["# A\nx\n### deep\ny"]);
  });
});

describe("shouldVirtualizePreview", () => {
  it("is false under the byte threshold", () => {
    expect(shouldVirtualizePreview("x".repeat(1000))).toBe(false);
  });

  it("is true at/above the byte threshold", () => {
    expect(shouldVirtualizePreview("x".repeat(VIRTUALIZE_PREVIEW_BYTES))).toBe(true);
  });
});
