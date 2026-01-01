/**
 * Validation Functions
 * 
 * Functions for validating content and editor state
 */

import { DEFAULT_MARKDOWN } from './constants';

/**
 * Check if content has unsaved changes
 * @param markdown - The markdown content to check
 * @param ignoreDefaultMarkdown - If true (default), treats DEFAULT_MARKDOWN as empty. If false, treats it as normal content.
 */
export function hasUnsavedContent(markdown: string, ignoreDefaultMarkdown: boolean = true): boolean {
    if (!markdown.trim()) {
        return false;
    }
    
    // If ignoreDefaultMarkdown is false, treat DEFAULT_MARKDOWN as normal content
    if (!ignoreDefaultMarkdown) {
        return true;
    }
    
    // Default behavior: treat DEFAULT_MARKDOWN as empty
    return markdown !== DEFAULT_MARKDOWN;
}

/**
 * Check if content is empty
 * @param markdown - The markdown content to check
 * @param ignoreDefaultMarkdown - If true (default), treats DEFAULT_MARKDOWN as empty. If false, treats it as normal content.
 */
export function isContentEmpty(markdown: string, ignoreDefaultMarkdown: boolean = true): boolean {
    if (!markdown.trim()) {
        return true;
    }
    
    // If ignoreDefaultMarkdown is false, treat DEFAULT_MARKDOWN as normal content
    if (!ignoreDefaultMarkdown) {
        return false;
    }
    
    // Default behavior: treat DEFAULT_MARKDOWN as empty
    return markdown === DEFAULT_MARKDOWN;
}

