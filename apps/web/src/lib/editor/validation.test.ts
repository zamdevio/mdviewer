import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_MARKDOWN } from "./constants";

vi.mock("../storage/helpers", () => ({
  getShowDefaultContent: vi.fn(() => true),
}));

import { getShowDefaultContent } from "../storage/helpers";
import {
  hasUnsavedContent,
  isBaselineEditorContent,
  isContentEmpty,
} from "./validation";

describe("isBaselineEditorContent", () => {
  beforeEach(() => {
    vi.mocked(getShowDefaultContent).mockReturnValue(true);
  });

  it("treats empty as baseline", () => {
    expect(isBaselineEditorContent("")).toBe(true);
    expect(isBaselineEditorContent("   ")).toBe(true);
  });

  it("treats DEFAULT_MARKDOWN as baseline when setting is on", () => {
    expect(isBaselineEditorContent(DEFAULT_MARKDOWN)).toBe(true);
    expect(hasUnsavedContent(DEFAULT_MARKDOWN)).toBe(false);
    expect(isContentEmpty(DEFAULT_MARKDOWN)).toBe(true);
  });

  it("treats DEFAULT_MARKDOWN as real work when setting is off", () => {
    vi.mocked(getShowDefaultContent).mockReturnValue(false);
    expect(isBaselineEditorContent(DEFAULT_MARKDOWN)).toBe(false);
    expect(hasUnsavedContent(DEFAULT_MARKDOWN)).toBe(true);
  });

  it("flags custom content as unsaved", () => {
    expect(isBaselineEditorContent("# my notes")).toBe(false);
    expect(hasUnsavedContent("# my notes")).toBe(true);
  });
});
