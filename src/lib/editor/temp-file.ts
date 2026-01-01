/**
 * Temp File Operations
 * 
 * Functions for managing temporary file storage (unsaved content)
 */

import { setTempFile, clearTempFile } from '../storage/helpers';

/**
 * Save temp file (for unsaved content)
 */
export function saveTempFile(content: string): void {
    if (content.trim()) {
        setTempFile(content);
    } else {
        clearTempFile();
    }
}

