/**
 * File Operations
 * 
 * CRUD operations for files: save, load, delete, rename
 */

import {
    getFileContent,
    setFileContent,
    removeFileContent,
    upsertSavedFile,
    removeSavedFile,
    setFileAsEditing,
    clearAllEditingFlags,
    findSavedFileById,
    findSavedFileByFilename,
    getSavedFiles,
    type SavedFile
} from '../storage';
import { clearTempFile } from '../storage/helpers';
import { generateUniqueFilename } from './file-helpers';
import type { EditorState } from '@/types';

/**
 * Generate a unique file ID
 */
export function generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Save a file with proper state management
 * @param filename - Base filename (without .md extension)
 * @param content - File content
 * @param existingFileId - If provided, updates existing file. If null and file exists, generates unique name.
 * @param generateUniqueName - If true, generates unique filename if duplicate exists (for imports)
 */
export function saveFile(
    filename: string,
    content: string,
    existingFileId?: string | null,
    generateUniqueName: boolean = false
): { success: boolean; file: SavedFile | null; error?: string } {
    if (!content.trim()) {
        return { success: false, file: null, error: 'No content to save' };
    }

    try {
        const timestamp = new Date().toISOString();
        let finalFilename = filename;
        let fullFilename = `${filename}.md`;
        
        // Find existing file by ID if provided, otherwise by filename
        let existingFile: SavedFile | null = null;
        
        if (existingFileId) {
            existingFile = findSavedFileById(existingFileId);
            if (existingFile) {
                // Updating existing file - use existing filename
                fullFilename = existingFile.filename;
                finalFilename = fullFilename.replace(/\.md$/i, '');
            }
        } else {
            existingFile = findSavedFileByFilename(fullFilename);
            
            // If file exists and we should generate unique name (for imports), do it
            if (existingFile && generateUniqueName) {
                const allFiles = getSavedFiles();
                const existingFilenames = allFiles.map(f => f.filename);
                finalFilename = generateUniqueFilename(filename, existingFilenames);
                fullFilename = `${finalFilename}.md`;
                existingFile = null; // Treat as new file with unique name
            }
        }
        
        // Always generate new ID for imports (when generateUniqueName is true)
        // For regular saves, use existing ID if updating, otherwise generate new
        const fileId = (generateUniqueName || !existingFile) 
            ? generateFileId() 
            : (existingFile.id || existingFileId || generateFileId());
        
        const fileData: SavedFile = {
            id: fileId,
            filename: fullFilename,
            timestamp,
        };
        
        // Save file metadata and content
        upsertSavedFile(fileData);
        setFileContent(fullFilename, content);
        
        // Mark file as editing (clears all other editing flags)
        setFileAsEditing(fileId);
        
        // Clear temp file when file is saved
        clearTempFile();
        
        // Dispatch storage event only once for files page sync
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }
        
        return { success: true, file: fileData };
    } catch (error) {
        return { 
            success: false, 
            file: null, 
            error: error instanceof Error ? error.message : 'Failed to save file' 
        };
    }
}

/**
 * Load a file into editor state
 */
export function loadFile(fileId: string): { success: boolean; state: EditorState | null; error?: string } {
    try {
        const file = findSavedFileById(fileId);
        if (!file) {
            return { success: false, state: null, error: 'File not found' };
        }

        const content = getFileContent(file.filename);
        if (content === null) {
            return { success: false, state: null, error: 'File content not found' };
        }

        // Clear temp file when loading a file
        clearTempFile();

        return {
            success: true,
            state: {
                markdown: content,
                currentFileName: file.filename.replace(/\.md$/i, ''),
                currentFileId: file.id,
                isUntitled: false,
                isForked: false,
            },
        };
    } catch (error) {
        return {
            success: false,
            state: null,
            error: error instanceof Error ? error.message : 'Failed to load file',
        };
    }
}

/**
 * Load file from files page (by fileId)
 * Alias for loadFile for backward compatibility
 */
export function loadFileToEditor(fileId: string): { success: boolean; state: EditorState | null; error?: string } {
    return loadFile(fileId);
}

/**
 * Delete a file
 */
export function deleteFile(fileId: string, filename: string): { success: boolean; error?: string } {
    try {
        removeFileContent(filename);
        removeSavedFile(fileId);
        clearAllEditingFlags();
        
        // Dispatch storage event for files page sync
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }
        
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete file',
        };
    }
}

/**
 * Rename a file
 * Always uses file ID to find and rename the file, not filename
 * This ensures we're renaming the correct file regardless of filename changes
 * 
 * @param fileId - The ID of the file to rename (always use ID, never filename)
 * @param newFilename - The new filename (without .md extension)
 * @param content - The current file content to save with new name
 */
export function renameFile(
    fileId: string,
    newFilename: string,
    content: string
): { success: boolean; file: SavedFile | null; error?: string } {
    try {
        // Always find the file by ID - this is the source of truth
        // Never use filename to find files as it can change
        const file = findSavedFileById(fileId);
        if (!file) {
            return { success: false, file: null, error: 'File not found' };
        }

        const oldFilename = file.filename;
        const newFullFilename = `${newFilename}.md`;

        // Use the content passed in (current editor content) - this is the current state being edited
        // Don't try to get from storage as it might be stale or missing
        // The content parameter contains the current markdown from the editor
        const fileContent = content;

        // Update file metadata with new filename but same ID
        const updatedFile: SavedFile = {
            ...file,
            filename: newFullFilename,
            timestamp: new Date().toISOString(),
        };
        upsertSavedFile(updatedFile);

        // Save content with new filename using current editor content
        setFileContent(newFullFilename, fileContent);
        // Remove old filename content (if it exists)
        removeFileContent(oldFilename);

        // Keep file as editing
        setFileAsEditing(fileId);

        // Clear temp file when renamed
        clearTempFile();

        // Dispatch storage event for files page sync
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }

        return { success: true, file: updatedFile };
    } catch (error) {
        return {
            success: false,
            file: null,
            error: error instanceof Error ? error.message : 'Failed to rename file',
        };
    }
}

