/**
 * Temp File Operations
 *
 * Functions for managing temporary file storage (unsaved content)
 */

import { setTempFile, clearTempFile, getTempFile } from "../storage/helpers";
import { isBaselineEditorContent } from "./validation";

/**
 * Save temp file (for unsaved content).
 * Skips empty / settings default sample so Files→Load doesn't false-warn.
 */
export function saveTempFile(content: string): void {
  if (isBaselineEditorContent(content)) {
    clearTempFile();
    return;
  }
  setTempFile(content);
}

/** True when temp storage has real user work (not empty/default sample). */
export function tempFileHasUnsavedWork(): boolean {
  const temp = getTempFile();
  if (!temp) return false;
  return !isBaselineEditorContent(temp);
}

/**
 * Drop disposable temp (empty / default sample). Returns whether real work remains.
 */
export function clearDisposableTempFile(): boolean {
  const temp = getTempFile();
  if (!temp) return false;
  if (isBaselineEditorContent(temp)) {
    clearTempFile();
    return false;
  }
  return true;
}
