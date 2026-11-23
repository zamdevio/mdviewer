/**
 * Validation Functions
 *
 * Functions for validating content and editor state
 */

import { DEFAULT_MARKDOWN } from "./constants";
import { getShowDefaultContent } from "../storage/helpers";

/**
 * True when the buffer is empty or exactly the settings default sample
 * (and that sample is enabled). Used so default/empty isn't treated as
 * "unsaved user work" for temp-file warnings or Files editing marks.
 */
export function isBaselineEditorContent(markdown: string): boolean {
  if (!markdown.trim()) return true;
  if (getShowDefaultContent() && markdown === DEFAULT_MARKDOWN) return true;
  return false;
}

/**
 * Check if content has unsaved changes worth protecting.
 * @param ignoreDefaultMarkdown - If true (default), respects Settings default sample as baseline.
 */
export function hasUnsavedContent(
  markdown: string,
  ignoreDefaultMarkdown: boolean = true,
): boolean {
  if (!markdown.trim()) {
    return false;
  }

  if (ignoreDefaultMarkdown && isBaselineEditorContent(markdown)) {
    return false;
  }

  return true;
}

/**
 * Check if content is empty / baseline sample.
 */
export function isContentEmpty(
  markdown: string,
  ignoreDefaultMarkdown: boolean = true,
): boolean {
  if (!markdown.trim()) {
    return true;
  }

  if (ignoreDefaultMarkdown && isBaselineEditorContent(markdown)) {
    return true;
  }

  return false;
}
