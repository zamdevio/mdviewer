/**
 * Storage Helper Functions
 *
 * Convenience functions for common storage operations
 */

import { storage } from "./index";

/**
 * Get show default content setting
 */
export const getShowDefaultContent = (): boolean => {
    return storage.getSetting("showDefaultContent") ?? true;
};

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
