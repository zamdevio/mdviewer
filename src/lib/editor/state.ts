/**
 * Editor State Management
 * 
 * Functions for managing editor state initialization and transitions
 */

import { getTempFile, clearTempFile, getShowDefaultContent } from '../storage/helpers';
import { getFileContent, getEditingFileFromSavedFiles } from '../storage';
import type { EditorState } from '@/types';
import { DEFAULT_MARKDOWN } from './constants';
import { clearAllEditingFlags } from '../storage';

/**
 * Get initial editor state
 * Checks temp file, editing file, saved content, or defaults
 */
export function getInitialEditorState(): EditorState {
    if (typeof window === 'undefined') {
        return {
            markdown: '',
            currentFileName: null,
            currentFileId: null,
            isUntitled: false,
            isForked: false,
        };
    }

    // Check for temp file first (unsaved content takes priority)
    const tempContent = getTempFile();
    if (tempContent) {
        return {
            markdown: tempContent,
            currentFileName: null,
            currentFileId: null,
            isUntitled: false,
            isForked: false,
        };
    }

    // Check if we have a file being edited
    const editingFileData = getEditingFileFromSavedFiles();
    if (editingFileData) {
        const content = getFileContent(editingFileData.filename);
        return {
            markdown: content || '',
            currentFileName: editingFileData.filename.replace(/\.md$/i, ''),
            currentFileId: editingFileData.id,
            isUntitled: false,
            isForked: false,
        };
    }

    // Check for saved content
    const saved = localStorage.getItem('mdviewer_content');
    if (saved) {
        return {
            markdown: saved,
            currentFileName: null,
            currentFileId: null,
            isUntitled: false,
            isForked: false,
        };
    }

    // Default content or empty
    const showDefault = getShowDefaultContent();
    return {
        markdown: showDefault ? DEFAULT_MARKDOWN : '',
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
    // Clear all editing flags
    clearAllEditingFlags();
    
    // Clear temp file
    clearTempFile();
    
    // Respect showDefaultContent setting
    const showDefault = getShowDefaultContent();
    
    return {
        markdown: showDefault ? DEFAULT_MARKDOWN : '',
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
    const state = createNewFile();
    
    // Set as untitled initially (will be saved with name on first save)
    // Don't mark as editing until it's actually saved
    return state;
}

