/**
 * File Helpers
 * 
 * Helper functions for file operations and content management
 */

import { getShowDefaultContent } from '../storage/helpers';
import { DEFAULT_MARKDOWN } from './constants';
import { isContentEmpty } from './validation';
import { saveFile } from './file-operations';

/**
 * Filename length constants
 */
export const MAX_FILENAME_LENGTH = 47; // Max filename without .md extension (47 + ".md" = 50 total)
export const MAX_DISPLAY_FILENAME_LENGTH = 30; // Max characters to display in UI

/**
 * Truncate filename for display
 * Shows first 20 chars, then "....md" for longer filenames
 * Example: "very-long-filename-that-exceeds-20-chars.md" -> "very-long-filename....md"
 */
export function truncateFilenameForDisplay(filename: string): string {
    const nameWithoutExt = filename.replace(/\.md$/i, '');
    
    if (nameWithoutExt.length <= MAX_DISPLAY_FILENAME_LENGTH) {
        return filename; // Return as-is if within limit
    }
    
    // Truncate to 20 chars and add "....md"
    const truncated = nameWithoutExt.substring(0, MAX_DISPLAY_FILENAME_LENGTH);
    return `${truncated}....md`;
}

/**
 * Truncate filename to max length (47 chars + .md = 50 total)
 */
export function truncateFilename(filename: string): string {
    const nameWithoutExt = filename.replace(/\.md$/i, '');
    
    if (nameWithoutExt.length <= MAX_FILENAME_LENGTH) {
        return filename.endsWith('.md') ? filename : `${filename}.md`;
    }
    
    // Truncate to max length
    const truncated = nameWithoutExt.substring(0, MAX_FILENAME_LENGTH);
    return `${truncated}.md`;
}

/**
 * Save current content to file (for unsaved content)
 * Returns filename if successful, null otherwise
 * @param markdown - The markdown content to save
 * @param ignoreDefaultMarkdown - If true (default), treats DEFAULT_MARKDOWN as empty. If false, treats it as normal content.
 */
export async function saveCurrentContentToFile(
    markdown: string,
    ignoreDefaultMarkdown: boolean = true
): Promise<string | null> {
    const showDefault = getShowDefaultContent();
    if (isContentEmpty(markdown, ignoreDefaultMarkdown) || (showDefault && ignoreDefaultMarkdown && markdown === DEFAULT_MARKDOWN)) {
        return null;
    }

    // Save to storage with timestamp
    const filename = `saved-${Date.now()}`;
    const result = saveFile(filename, markdown, null);
    
    if (result.success && result.file) {
        return result.file.filename;
    }
    
    return null;
}

/**
 * Sanitize filename (remove .md extension, trim)
 */
export function sanitizeFileName(filename: string): string {
    return filename.trim().replace(/\.md$/i, '');
}

/**
 * Validate filename
 */
export function validateFileName(filename: string): { valid: boolean; error?: string } {
    const trimmed = filename.trim();
    
    if (!trimmed) {
        return { valid: false, error: 'Filename cannot be empty' };
    }
    
    // Check length (47 chars + ".md" = 50 total)
    if (trimmed.length > MAX_FILENAME_LENGTH) {
        return { valid: false, error: `Filename is too long (max ${MAX_FILENAME_LENGTH} characters)` };
    }
    
    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(trimmed)) {
        return { valid: false, error: 'Filename contains invalid characters' };
    }
    
    return { valid: true };
}

/**
 * Get export filename
 */
export function getExportFilename(currentFileName: string | null): string {
    if (currentFileName) {
        // Ensure filename doesn't exceed limit
        const truncated = truncateFilename(currentFileName);
        return truncated;
    }
    return `markdown-${Date.now()}.md`;
}

/**
 * Create export blob from markdown
 */
export function createExportBlob(markdown: string): Blob {
    return new Blob([markdown], { type: 'text/markdown' });
}

/**
 * Generate unique filename by checking existing files and adding/incrementing suffix
 * Handles: filename.md -> filename-1.md -> filename-2.md, etc.
 */
export function generateUniqueFilename(baseFilename: string, existingFilenames: string[]): string {
    const baseName = baseFilename.replace(/\.md$/i, '');
    const fullBaseName = `${baseName}.md`;
    
    // If filename doesn't exist, return as-is
    if (!existingFilenames.includes(fullBaseName)) {
        return baseName;
    }
    
    // Extract base name and existing suffix pattern
    // Match patterns like: filename-1, filename-12, filename-123
    const suffixPattern = /^(.+)-(\d+)$/;
    const match = baseName.match(suffixPattern);
    
    let nameWithoutSuffix: string;
    let startNumber: number;
    
    if (match) {
        // Already has a number suffix
        nameWithoutSuffix = match[1];
        startNumber = parseInt(match[2], 10);
    } else {
        // No suffix, start from 1
        nameWithoutSuffix = baseName;
        startNumber = 1;
    }
    
    // Find the next available number
    let counter = startNumber;
    let newFilename: string;
    
    do {
        newFilename = `${nameWithoutSuffix}-${counter}`;
        const fullNewFilename = `${newFilename}.md`;
        
        if (!existingFilenames.includes(fullNewFilename)) {
            return newFilename;
        }
        
        counter++;
        
        // Safety limit to prevent infinite loop
        if (counter > 10000) {
            // Fallback: use timestamp
            return `${nameWithoutSuffix}-${Date.now()}`;
        }
    } while (true);
}

/**
 * Process imported file
 */
export async function processImportedFile(file: File): Promise<{ filename: string; content: string }> {
    const text = await file.text();
    let importedFileName = file.name.replace(/\.(md|txt)$/i, '');
    
    // Truncate to max length if needed
    if (importedFileName.length > MAX_FILENAME_LENGTH) {
        importedFileName = importedFileName.substring(0, MAX_FILENAME_LENGTH);
    }
    
    return {
        filename: importedFileName,
        content: text,
    };
}

