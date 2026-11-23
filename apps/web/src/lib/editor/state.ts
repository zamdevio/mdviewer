/**
 * Editor State Management
 *
 * Functions for managing editor state initialization and transitions
 */

import { getTempFile, clearTempFile, getShowDefaultContent } from "../storage/helpers";
import { getFileContent, getEditingFileFromSavedFiles, clearAllEditingFlags } from "../storage";
import type { EditorState } from "@/types";
import { DEFAULT_MARKDOWN } from "./constants";
import { isBaselineEditorContent } from "./validation";

/**
 * Get initial editor state
 * Checks temp file, editing file, saved content, or defaults
 */
export function getInitialEditorState(): EditorState {
  if (typeof window === "undefined") {
    return {
      markdown: "",
      currentFileName: null,
      currentFileId: null,
      isUntitled: false,
      isForked: false,
    };
  }

  const tempContent = getTempFile();
  if (tempContent) {
    if (isBaselineEditorContent(tempContent)) {
      clearTempFile();
    } else {
      return {
        markdown: tempContent,
        currentFileName: null,
        currentFileId: null,
        isUntitled: false,
        isForked: false,
      };
    }
  }

  const editingFileData = getEditingFileFromSavedFiles();
  if (editingFileData) {
    const content = getFileContent(editingFileData.filename);
    return {
      markdown: content || "",
      currentFileName: editingFileData.filename.replace(/\.md$/i, ""),
      currentFileId: editingFileData.id,
      isUntitled: false,
      isForked: false,
    };
  }

  const saved = localStorage.getItem("mdviewer_content");
  if (saved) {
    return {
      markdown: saved,
      currentFileName: null,
      currentFileId: null,
      isUntitled: false,
      isForked: false,
    };
  }

  const showDefault = getShowDefaultContent();
  return {
    markdown: showDefault ? DEFAULT_MARKDOWN : "",
    currentFileName: null,
    currentFileId: null,
    isUntitled: false,
    isForked: false,
  };
}

/**
 * Create a new file (clears current state)
 */
export function createNewFile(): EditorState {
  clearAllEditingFlags();
  clearTempFile();

  const showDefault = getShowDefaultContent();

  return {
    markdown: showDefault ? DEFAULT_MARKDOWN : "",
    currentFileName: null,
    currentFileId: null,
    isUntitled: true,
    isForked: false,
  };
}

/**
 * Create new file from URL parameter
 */
export function createNewFileFromUrl(): EditorState {
  return createNewFile();
}
