import { describe, expect, it } from "vitest";
import { fileKey, metaKey, sanitizeShareFilename } from "./share-store";

describe("share paths", () => {
  it("builds metadata and file keys", () => {
    expect(metaKey("abc")).toBe("shares/abc/metadata.json");
    expect(fileKey("abc", "note.md")).toBe("shares/abc/files/note.md");
  });
});

describe("sanitizeShareFilename", () => {
  it("defaults and strips path chars", () => {
    expect(sanitizeShareFilename(null)).toBe("content.md");
    expect(sanitizeShareFilename("../evil/../../x.md")).toBe(".._evil_.._.._x.md");
  });
});
