/**
 * State Checks
 * 
 * Functions for checking editor state and determining if actions can be performed
 */

import type { EditorState } from '@/types';
import { hasUnsavedContent, isContentEmpty } from './validation';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved';

export interface StateCheckResult {
    canProceed: boolean;
    reason?: string;
    requiresSave?: boolean;
    hasUnsavedChanges?: boolean;
    isSavedFile?: boolean;
}

/**
 * Check if current content is a saved file
 */
export function isSavedFile(
    currentFileName: string | null,
    currentFileId: string | null
): boolean {
    return !!(currentFileName && currentFileId);
}

/**
 * Check if saved file has unsaved changes
 */
export function hasUnsavedChanges(
    markdown: string,
    lastSavedContent: string,
    saveStatus: SaveStatus
): boolean {
    return markdown !== lastSavedContent || saveStatus === 'unsaved';
}

/**
 * Comprehensive state check for actions that might overwrite content
 */
export function checkActionState(
    state: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: SaveStatus
): StateCheckResult {
    const { currentFileName, currentFileId } = state;
    const isFile = isSavedFile(currentFileName, currentFileId);
    const hasChanges = isFile && hasUnsavedChanges(markdown, lastSavedContent, saveStatus);
    const hasContent = hasUnsavedContent(markdown);

    return {
        canProceed: !hasContent || (!isFile || !hasChanges),
        requiresSave: hasContent && !isFile,
        hasUnsavedChanges: hasChanges,
        isSavedFile: isFile,
        reason: hasChanges
            ? 'You have unsaved changes. Please save your current file first.'
            : isFile
            ? 'Please save your current file first.'
            : hasContent
            ? 'You have unsaved content. Please save it first.'
            : undefined,
    };
}

/**
 * Check if can create new file
 */
export function canCreateNewFile(
    state: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: SaveStatus
): StateCheckResult {
    if (isContentEmpty(markdown)) {
        return {
            canProceed: false,
            reason: 'Content is empty',
        };
    }

    return checkActionState(state, markdown, lastSavedContent, saveStatus);
}

/**
 * Check if can import file
 */
export function canImportFile(
    state: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: SaveStatus
): StateCheckResult {
    return checkActionState(state, markdown, lastSavedContent, saveStatus);
}

/**
 * Check if can load shared content
 */
export function canLoadSharedContent(
    state: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: SaveStatus
): StateCheckResult {
    return checkActionState(state, markdown, lastSavedContent, saveStatus);
}

/**
 * Determine save status based on state
 */
export function determineSaveStatus(
    markdown: string,
    lastSavedContent: string,
    currentFileName: string | null,
    currentFileId: string | null
): SaveStatus {
    if (!markdown.trim()) {
        return 'idle';
    }

    if (currentFileName && currentFileId) {
        // File is saved, check if content changed
        return markdown === lastSavedContent ? 'saved' : 'unsaved';
    }

    // Unsaved content
    return lastSavedContent ? 'unsaved' : 'idle';
}

