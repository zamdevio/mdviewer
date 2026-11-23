import { beforeEach, describe, expect, it, vi } from "vitest";

const getSavedFiles = vi.fn();
const getSharedLinks = vi.fn();

vi.mock("@/lib/storage", () => ({
  getSavedFiles: () => getSavedFiles(),
  getSharedLinks: () => getSharedLinks(),
}));

import { resolveBoundShare } from "./bound-share";

describe("resolveBoundShare", () => {
  beforeEach(() => {
    getSavedFiles.mockReset();
    getSharedLinks.mockReset();
    getSavedFiles.mockReturnValue([]);
    getSharedLinks.mockReturnValue([]);
  });

  it("returns null when nothing is bound", () => {
    expect(resolveBoundShare("id", "notes")).toBeNull();
  });

  it("prefers SavedFile.shareId", () => {
    getSavedFiles.mockReturnValue([
      {
        id: "f1",
        filename: "notes.md",
        shareId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        sharePassword: "pw",
      },
    ]);
    getSharedLinks.mockReturnValue([
      {
        id: "l1",
        shareId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        url: "https://x/share/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        filename: "notes.md",
        timestamp: "2026-01-01T00:00:00.000Z",
        expiresAt: "2026-01-08T00:00:00.000Z",
      },
    ]);
    const bound = resolveBoundShare("f1", "notes");
    expect(bound?.shareId).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(bound?.viewPassword).toBe("pw");
    expect(bound?.expiresAt).toBe("2026-01-08T00:00:00.000Z");
  });

  it("falls back to SharedLinks by filename stem after reload without file.shareId", () => {
    getSavedFiles.mockReturnValue([{ id: "f1", filename: "notes.md" }]);
    getSharedLinks.mockReturnValue([
      {
        id: "l1",
        shareId: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        url: "https://x/share/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        filename: "notes.md",
        timestamp: "2026-01-02T00:00:00.000Z",
        password: "view",
      },
    ]);
    const bound = resolveBoundShare("f1", "notes");
    expect(bound?.shareId).toBe("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    expect(bound?.viewPassword).toBe("view");
    expect(bound?.file?.id).toBe("f1");
  });
});
