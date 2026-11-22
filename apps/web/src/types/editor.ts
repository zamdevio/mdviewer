/**
 * Shared types for editor functionality
 */

import type { SavedFile } from "@/lib/storage";

/**
 * Editor state structure
 */
export interface EditorState {
    markdown: string;
    currentFileName: string | null;
    currentFileId: string | null;
    isUntitled: boolean;
    isForked: boolean;
}

/**
 * Editor state callbacks
 */
export interface EditorStateCallbacks {
    onStateChange?: (state: EditorState) => void;
    onFileSaved?: (file: SavedFile) => void;
    onFileLoaded?: (file: SavedFile) => void;
}

