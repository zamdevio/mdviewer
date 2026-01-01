/**
 * Auto-save Logic
 * 
 * Functions for determining auto-save behavior
 */

import type { EditorState } from '@/types';
import { isContentEmpty } from './validation';

export type AutoSaveAction = 'saveToFile' | 'saveToTemp' | 'clearTemp' | 'skip';

export interface AutoSaveDecision {
    action: AutoSaveAction;
    shouldSave: boolean;
}

/**
 * Determine auto-save action based on state
 */
export function determineAutoSaveAction(
    markdown: string,
    state: EditorState,
    autoSaveEnabled: boolean
): AutoSaveDecision {
    if (!autoSaveEnabled || isContentEmpty(markdown)) {
        return {
            action: markdown.trim() ? 'skip' : 'clearTemp',
            shouldSave: false,
        };
    }

    const { currentFileName, currentFileId } = state;

    if (currentFileName && currentFileId) {
        // File is open, save to file
        return {
            action: 'saveToFile',
            shouldSave: true,
        };
    }

    // No file open, save to temp
    return {
        action: 'saveToTemp',
        shouldSave: true,
    };
}

/**
 * Check if should auto-save
 */
export function shouldAutoSave(
    markdown: string,
    currentFileName: string | null,
    autoSaveEnabled: boolean
): boolean {
    if (!autoSaveEnabled || !markdown.trim()) {
        return false;
    }

    return true;
}

/**
 * Check if should auto-rename untitled file
 */
export function shouldAutoRename(
    markdown: string,
    isUntitled: boolean,
    currentFileName: string | null
): boolean {
    if (!isUntitled || currentFileName !== null) {
        return false;
    }

    const firstLine = markdown.trim().split('\n')[0];
    return firstLine.length > 0;
}

/**
 * Extract filename from content (first line, max length)
 */
export function extractFilenameFromContent(
    markdown: string,
    maxLength: number = 20
): string | null {
    const firstLine = markdown.trim().split('\n')[0];
    if (!firstLine || firstLine.length === 0) {
        return null;
    }

    const suggested = firstLine
        .substring(0, maxLength)
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();

    if (suggested && suggested.length > 0 && suggested !== 'untitled') {
        return suggested.length > maxLength - 3
            ? suggested.substring(0, maxLength - 3) + '...'
            : suggested;
    }

    return null;
}

