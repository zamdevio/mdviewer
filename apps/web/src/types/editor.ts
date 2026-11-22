/**
 * Shared types for editor functionality
 */

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
