/**
 * Load Handlers
 * 
 * Business logic for loading shared content and files
 */

import { fetchSharedMarkdown } from '@/lib/api';
import { saveCurrentContentToFile } from './file-helpers';
import { hasUnsavedContent } from './validation';
import { prepareSharedContentState } from './business-logic';
import { getLoadSharedContentHandlerConfig } from './handler-configs';
import type { EditorState } from '@/types';

export interface LoadSharedContentResult {
    success: boolean;
    newState?: EditorState;
    error?: string;
    requiresSave?: boolean;
}

/**
 * Handle loading shared content
 */
export async function handleLoadSharedContent(
    shareId: string,
    saveCurrent: boolean,
    editorState: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: 'idle' | 'saving' | 'saved' | 'unsaved',
    currentFileName: string | null
): Promise<LoadSharedContentResult> {
    const config = getLoadSharedContentHandlerConfig(editorState, markdown, lastSavedContent, saveStatus);

    if (!config.canExecute) {
        return {
            success: false,
            error: config.warningMessage || "Cannot load shared content",
        };
    }

    // Save current content if requested and it's unsaved
    if (saveCurrent && hasUnsavedContent(markdown) && !currentFileName) {
        const filename = await saveCurrentContentToFile(markdown);
        if (!filename) {
            return {
                success: false,
                error: "Failed to save current content"
            };
        }
    }

    try {
        // Load shared content
        const content = await fetchSharedMarkdown(shareId);

        // Prepare state for shared content
        const newState = prepareSharedContentState(content);

        return {
            success: true,
            newState,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to load shared content"
        };
    }
}

