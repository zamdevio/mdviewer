/**
 * Handler Configuration Factories
 * 
 * Functions that return configuration objects for handlers
 * This allows business logic to be separated from UI interactions
 */

import type { EditorState } from '@/types';
import type { SaveStatus } from './state-checks';
import {
    canCreateNewFile,
    canImportFile,
    canLoadSharedContent
} from './state-checks';
import { isContentEmpty } from './validation';

export type DialogType = 'save' | 'new' | 'rename';

export interface HandlerConfig {
    canExecute: boolean;
    requiresDialog: boolean;
    dialogType?: DialogType;
    warningMessage?: string;
    infoMessage?: string;
    action?: () => void;
}

/**
 * Get configuration for new file handler
 */
export function getNewFileHandlerConfig(
    state: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: SaveStatus
): HandlerConfig {
    if (isContentEmpty(markdown)) {
        return {
            canExecute: false,
            requiresDialog: false,
            infoMessage: 'You already have an empty new file open. Add some content first!',
        };
    }

    const check = canCreateNewFile(state, markdown, lastSavedContent, saveStatus);

    if (!check.canProceed) {
        return {
            canExecute: false,
            requiresDialog: false,
            warningMessage: check.reason,
        };
    }

    if (check.requiresSave) {
        return {
            canExecute: true,
            requiresDialog: true,
            dialogType: 'new',
        };
    }

    return {
        canExecute: true,
        requiresDialog: false,
    };
}

/**
 * Get configuration for import handler
 */
export function getImportHandlerConfig(
    state: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: SaveStatus
): HandlerConfig {
    const check = canImportFile(state, markdown, lastSavedContent, saveStatus);

    if (!check.canProceed) {
        return {
            canExecute: false,
            requiresDialog: false,
            warningMessage: check.reason,
        };
    }

    if (check.requiresSave) {
        return {
            canExecute: true,
            requiresDialog: true,
            dialogType: 'save',
        };
    }

    return {
        canExecute: true,
        requiresDialog: false,
    };
}

/**
 * Get configuration for load shared content handler
 */
export function getLoadSharedContentHandlerConfig(
    state: EditorState,
    markdown: string,
    lastSavedContent: string,
    saveStatus: SaveStatus
): HandlerConfig {
    const check = canLoadSharedContent(state, markdown, lastSavedContent, saveStatus);

    if (!check.canProceed) {
        return {
            canExecute: false,
            requiresDialog: false,
            warningMessage: check.reason,
        };
    }

    return {
        canExecute: true,
        requiresDialog: false,
    };
}

/**
 * Get configuration for save handler
 * Treats DEFAULT_MARKDOWN as normal content (can be saved)
 */
export function getSaveHandlerConfig(
    state: EditorState,
    markdown: string,
    isForked: boolean
): HandlerConfig {
    // For save operations, don't ignore DEFAULT_MARKDOWN - treat it as normal content
    if (isContentEmpty(markdown, false)) {
        return {
            canExecute: false,
            requiresDialog: true,
            infoMessage: 'There is nothing to save.',
        };
    }

    const { currentFileName } = state;

    // If content is forked (from share/search), require filename
    if (isForked && !currentFileName) {
        return {
            canExecute: true,
            requiresDialog: true,
            dialogType: 'save',
            infoMessage: 'Please provide a filename to save this content',
        };
    }

    if (currentFileName) {
        // File already exists, just save it
        return {
            canExecute: true,
            requiresDialog: false,
        };
    }

    // New file, ask for name
    return {
        canExecute: true,
        requiresDialog: true,
        dialogType: 'save',
    };
}

/**
 * Get configuration for delete handler
 */
export function getDeleteHandlerConfig(
    currentFileName: string | null
): HandlerConfig {
    if (!currentFileName) {
        return {
            canExecute: false,
            requiresDialog: false,
        };
    }

    return {
        canExecute: true,
        requiresDialog: true,
    };
}

