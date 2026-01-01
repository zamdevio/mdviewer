/**
 * Shared types for export/import functionality
 */

/**
 * File data structure for export/import
 */
export interface ExportFile {
    id: string;
    filename: string;
    content: string;
    timestamp?: string;
}

/**
 * Settings data structure for export/import
 * Export may include partial settings, import should handle full settings
 */
export interface ExportSettings {
    showDefaultContent?: boolean;
    theme?: 'light' | 'dark' | 'system';
    keyboardShortcuts?: boolean;
    autoSave?: boolean;
    itemsPerPage?: number;
    defaultEditorMode?: 'both' | 'editor' | 'preview';
    showEditorStatusBar?: boolean;
    showSpellChecker?: boolean;
}

/**
 * Complete export/import data structure
 * Used for both exporting and importing data
 */
export interface ExportImportData {
    version: string;
    exportDate: string;
    settings: ExportSettings;
    files: ExportFile[];
    currentContent?: string | null;
    editingFile?: string | null;
}

/**
 * Conflict file structure when importing files that already exist
 */
export interface ConflictFile {
    imported: {
        id?: string;
        filename: string;
        content?: string;
    };
    existing: {
        id?: string;
        filename: string;
        timestamp?: string;
    };
    conflictType: 'filename' | 'id';
}

/**
 * Conflict resolution action types
 */
export type ConflictAction = 'skip' | 'replace' | 'keepBoth';

