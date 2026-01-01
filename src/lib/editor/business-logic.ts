/**
 * Business Logic
 * 
 * Core business logic functions that don't depend on React
 */

import type { EditorState } from '@/types';
import { createNewFile } from './state';
import { clearTempFile } from '../storage/helpers';

/**
 * Prepare state for loading shared content
 */
export function prepareSharedContentState(content: string): EditorState {
    // Clear temp file before loading shared content
    clearTempFile();

    // Mark as forked (this is new content)
    return {
        markdown: content,
        currentFileName: null,
        currentFileId: null,
        isUntitled: true,
        isForked: true,
    };
}

/**
 * Prepare state after file deletion
 */
export function prepareStateAfterDelete(): EditorState {
    return createNewFile();
}

/**
 * Prepare state after successful save
 */
export function prepareStateAfterSave(
    markdown: string,
    filename: string,
    fileId: string
): EditorState {
    return {
        markdown,
        currentFileName: filename,
        currentFileId: fileId,
        isUntitled: false,
        isForked: false,
    };
}

/**
 * Prepare state after rename
 */
export function prepareStateAfterRename(
    markdown: string,
    newFilename: string,
    fileId: string
): EditorState {
    return {
        markdown,
        currentFileName: newFilename,
        currentFileId: fileId,
        isUntitled: false,
        isForked: false,
    };
}

