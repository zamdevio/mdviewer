/**
 * File Handlers
 * 
 * Business logic for file operations: save, delete, new, import, export
 */

import { clearTempFile, getTempFile } from '@/lib/storage/helpers';
import { clearAllEditingFlags } from '@/lib/storage';
import {
    saveFile as saveFileToStorage,
    deleteFile as deleteFileFromStorage,
    renameFile as renameFileInStorage,
} from './file-operations';
import {
    createNewFile as createNewFileState,
} from './state';
import {
    getNewFileHandlerConfig,
    getImportHandlerConfig,
    getSaveHandlerConfig,
    getDeleteHandlerConfig,
} from './handler-configs';
import {
    prepareStateAfterDelete,
    prepareStateAfterSave,
    prepareStateAfterRename,
} from './business-logic';
import {
    sanitizeFileName,
    validateFileName,
    truncateFilename,
    getExportFilename,
    createExportBlob,
    processImportedFile,
} from './file-helpers';
import {
    getSuggestedFilename,
} from './utils';
import type { EditorState } from '@/types';

export interface SaveFileResult {
    success: boolean;
    newState?: EditorState;
    error?: string;
    lastSaved?: Date;
    lastSavedContent?: string;
}

export interface DeleteFileResult {
    success: boolean;
    newState?: EditorState;
    error?: string;
}

export interface ImportFileResult {
    success: boolean;
    newState?: EditorState;
    error?: string;
    requiresSave?: boolean;
    dialogType?: 'save' | 'new';
}

export interface ExportFileResult {
    success: boolean;
    error?: string;
}

/**
 * Save file with state management
 */
export function saveFileWithState(
    filename: string,
    markdown: string,
    currentFileId: string | null
): SaveFileResult {
    const result = saveFileToStorage(filename, markdown, currentFileId);

    if (result.success && result.file) {
        // Clear temp content after saving
        clearTempFile();

        // Update editor state with saved file info
        const newState: EditorState = {
            markdown,
            currentFileName: filename,
            currentFileId: result.file.id,
            isUntitled: false,
            isForked: false,
        };

        return {
            success: true,
            newState,
            lastSaved: new Date(),
            lastSavedContent: markdown,
        };
    }

    return {
        success: false,
        error: result.error || "Failed to save file"
    };
}

/**
 * Handle save action - determines if dialog is needed
 */
export function getSaveAction(
    editorState: EditorState,
    markdown: string,
    isForked: boolean
): {
    canExecute: boolean;
    requiresDialog: boolean;
    dialogType?: 'save' | 'new' | 'rename';
    infoMessage?: string;
} {
    const config = getSaveHandlerConfig(editorState, markdown, isForked);
    return {
        canExecute: config.canExecute,
        requiresDialog: config.requiresDialog || false,
        dialogType: config.dialogType,
        infoMessage: config.infoMessage,
    };
}

/**
 * Handle save confirm - validates and saves file
 */
export function handleSaveConfirm(
    saveFileName: string,
    saveDialogMode: 'save' | 'new' | 'rename',
    markdown: string,
    currentFileId: string | null
): {
    success: boolean;
    newState?: EditorState;
    error?: string;
    lastSavedContent?: string;
} {
    if (!saveFileName.trim()) {
        return {
            success: false,
            error: "Please enter a filename"
        };
    }

    // Sanitize filename
    const cleanName = sanitizeFileName(saveFileName);

    // Validate filename
    const validation = validateFileName(cleanName);
    if (!validation.valid) {
        return {
            success: false,
            error: validation.error || "Invalid filename"
        };
    }

    // Truncate if needed
    const finalName = truncateFilename(cleanName).replace(/\.md$/i, '');

    if (saveDialogMode === 'rename' && currentFileId) {
        // Rename: Always use file ID to find and rename the file
        // This ensures we're renaming the correct file regardless of filename changes
        const result = renameFileInStorage(currentFileId, finalName, markdown);

        if (result.success && result.file) {
            // Update editor state using business logic helper
            const newState = prepareStateAfterRename(markdown, cleanName, result.file.id);
            return {
                success: true,
                newState,
                lastSavedContent: markdown,
            };
        }

        return {
            success: false,
            error: result.error || "Failed to rename file"
        };
    }

    // Save or new file
    const saveResult = saveFileWithState(finalName, markdown, currentFileId);
    return saveResult;
}

/**
 * Handle new file action
 */
export function getNewFileAction(
    editorState: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: 'idle' | 'saving' | 'saved' | 'unsaved'
): {
    canExecute: boolean;
    requiresDialog: boolean;
    dialogType?: 'save' | 'new' | 'rename';
    infoMessage?: string;
    warningMessage?: string;
    newState?: EditorState;
} {
    const config = getNewFileHandlerConfig(editorState, markdown, lastSavedContent, saveStatus);

    if (!config.canExecute) {
        return {
            canExecute: false,
            requiresDialog: false,
            infoMessage: config.infoMessage,
            warningMessage: config.warningMessage,
        };
    }

    if (config.requiresDialog && config.dialogType) {
        return {
            canExecute: true,
            requiresDialog: true,
            dialogType: config.dialogType,
        };
    }

    // Proceed to create new file
    clearAllEditingFlags();
    const newState = createNewFileState();

    return {
        canExecute: true,
        requiresDialog: false,
        newState,
    };
}

/**
 * Handle delete file action
 */
export function getDeleteFileAction(
    currentFileName: string | null
): {
    canExecute: boolean;
    requiresDialog: boolean;
} {
    const config = getDeleteHandlerConfig(currentFileName);
    return {
        canExecute: config.canExecute,
        requiresDialog: config.requiresDialog || false,
    };
}

/**
 * Handle delete confirm
 */
export function handleDeleteConfirm(
    currentFileName: string,
    currentFileId: string
): DeleteFileResult {
    const result = deleteFileFromStorage(currentFileId, `${currentFileName}.md`);

    if (result.success) {
        // Prepare state after delete using business logic helper
        const newState = prepareStateAfterDelete();
        return {
            success: true,
            newState,
        };
    }

    return {
        success: false,
        error: result.error || "Failed to delete file"
    };
}

/**
 * Handle import file action
 */
export function getImportFileAction(
    editorState: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: 'idle' | 'saving' | 'saved' | 'unsaved'
): {
    canExecute: boolean;
    requiresDialog: boolean;
    dialogType?: 'save' | 'new' | 'rename';
    infoMessage?: string;
    warningMessage?: string;
} {
    const config = getImportHandlerConfig(editorState, markdown, lastSavedContent, saveStatus);
    return {
        canExecute: config.canExecute,
        requiresDialog: config.requiresDialog || false,
        dialogType: config.dialogType,
        infoMessage: config.infoMessage,
        warningMessage: config.warningMessage,
    };
}

/**
 * Process imported file
 */
export async function processImportFile(
    file: File
): Promise<{
    success: boolean;
    filename?: string;
    content?: string;
    newState?: EditorState;
    error?: string;
}> {
    try {
        // Process imported file
        const { filename: importedFileName, content: text } = await processImportedFile(file);

        // Clear temp content when importing
        clearTempFile();

        // Save the imported file with unique name generation and new ID
        // generateUniqueName=true ensures new ID and handles duplicate filenames
        const result = saveFileToStorage(importedFileName, text, null, true);
        if (result.success && result.file) {
            // Use the actual filename that was saved (may have been auto-renamed)
            const savedFilename = result.file.filename.replace(/\.md$/i, '');
            const newState = prepareStateAfterSave(text, savedFilename, result.file.id);
            return {
                success: true,
                filename: savedFilename,
                content: text,
                newState,
            };
        }

        // If save failed, just return the content
        return {
            success: true,
            filename: importedFileName,
            content: text,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Handle export file
 */
export function handleExportFile(
    markdown: string,
    currentFileName: string | null
): ExportFileResult {
    if (!markdown.trim()) {
        return {
            success: false,
            error: "No content to export"
        };
    }

    try {
        // Create blob and download using helper functions
        const blob = createExportBlob(markdown);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getExportFilename(currentFileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Handle load file confirm - saves current content if needed
 */
export function handleLoadFileConfirm(
    saveCurrent: boolean
): {
    shouldLoad: boolean;
    savedFilename?: string;
    error?: string;
} {
    if (saveCurrent) {
        const tempContent = getTempFile();
        if (tempContent && tempContent.trim()) {
            // Save temp content as a file before loading
            const suggestedName = getSuggestedFilename(tempContent) || 'untitled';
            const result = saveFileToStorage(suggestedName, tempContent, null);
            if (result.success) {
                return {
                    shouldLoad: true,
                    savedFilename: suggestedName,
                };
            }
            return {
                shouldLoad: false,
                error: result.error || "Failed to save current content"
            };
        }
    }

    // Clear temp and proceed to load
    clearTempFile();
    return {
        shouldLoad: true,
    };
}

