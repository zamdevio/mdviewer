/**
 * Storage Helper Functions
 * 
 * Convenience functions for common storage operations
 */

import { storage, type SavedFile, type SettingsData } from './index';

// ============================================
// Settings Helpers
// ============================================

/**
 * Get show default content setting
 */
export const getShowDefaultContent = (): boolean => {
    return storage.getSetting('showDefaultContent') ?? false;
};

/**
 * Get auto-save setting
 */
export const getAutoSaveEnabled = (): boolean => {
    return storage.getSetting('autoSave') ?? true;
};

/**
 * Get keyboard shortcuts setting
 */
export const getKeyboardShortcutsEnabled = (): boolean => {
    return storage.getSetting('keyboardShortcuts') ?? true;
};

/**
 * Get items per page setting
 */
export const getItemsPerPage = (): number => {
    return storage.getSetting('itemsPerPage') ?? 12;
};

/**
 * Get theme setting
 */
export const getTheme = (): SettingsData['theme'] => {
    return storage.getSetting('theme') ?? 'system';
};

// ============================================
// File Helpers
// ============================================

/**
 * Get all files with their content
 */
export const getAllFilesWithContent = (): Array<SavedFile & { content: string }> => {
    const files = storage.getSavedFiles();
    return files
        .map(file => {
            const content = storage.getFileContent(file.filename);
            return content ? { ...file, content } : null;
        })
        .filter((f): f is SavedFile & { content: string } => f !== null);
};

/**
 * Save a file (both metadata and content)
 */
export const saveFileComplete = (file: SavedFile, content: string): void => {
    // Save metadata
    storage.upsertSavedFile(file);
    // Save content
    storage.setFileContent(file.filename, content);
};

/**
 * Delete a file completely (metadata and content)
 */
export const deleteFileComplete = (fileId: string, filename: string): void => {
    storage.removeSavedFile(fileId);
    storage.removeFileContent(filename);
};

/**
 * Check if a file exists
 */
export const fileExists = (fileId: string): boolean => {
    return storage.findSavedFileById(fileId) !== null;
};

// ============================================
// Temp File Helpers
// ============================================

/**
 * Get temp file content (unsaved content without filename)
 */
export const getTempFile = (): string | null => {
    return storage.getTempFile();
};

/**
 * Set temp file content (unsaved content without filename)
 */
export const setTempFile = (content: string): void => {
    storage.setTempFile(content);
};

/**
 * Clear temp file
 */
export const clearTempFile = (): void => {
    storage.clearTempFile();
};

