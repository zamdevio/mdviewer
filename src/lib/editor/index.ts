/**
 * Editor Module
 * 
 * Centralized exports for all editor functionality
 * Organized into logical modules for better maintainability
 */

// Re-export types
export type { EditorState, EditorStateCallbacks } from '@/types';

// Constants
export { DEFAULT_MARKDOWN } from './constants';

// State Management
export {
    getInitialEditorState,
    createNewFile,
    createNewFileFromUrl,
} from './state';

// File Operations
export {
    generateFileId,
    saveFile,
    loadFile,
    loadFileToEditor,
    deleteFile,
    renameFile,
} from './file-operations';

// Validation
export {
    hasUnsavedContent,
    isContentEmpty,
} from './validation';

// Temp File Operations
export {
    saveTempFile,
} from './temp-file';

// Utilities
export {
    getSuggestedFilename,
    getStats,
} from './utils';

// State Checks
export {
    isSavedFile,
    hasUnsavedChanges,
    checkActionState,
    canCreateNewFile,
    canImportFile,
    canLoadSharedContent,
    determineSaveStatus,
    type SaveStatus,
    type StateCheckResult,
} from './state-checks';

// File Helpers
export {
    saveCurrentContentToFile,
    sanitizeFileName,
    validateFileName,
    getExportFilename,
    createExportBlob,
    processImportedFile,
    truncateFilenameForDisplay,
    truncateFilename,
    generateUniqueFilename,
    MAX_FILENAME_LENGTH,
    MAX_DISPLAY_FILENAME_LENGTH,
} from './file-helpers';

// URL Helpers
export {
    parseEditorUrlParams,
    updateEditorUrl,
    cleanEditorUrl,
    type EditorUrlParams,
} from './url-helpers';

// Auto-save Logic
export {
    determineAutoSaveAction,
    shouldAutoSave,
    shouldAutoRename,
    extractFilenameFromContent,
    type AutoSaveAction,
    type AutoSaveDecision,
} from './auto-save';

// Handler Configurations
export {
    getNewFileHandlerConfig,
    getImportHandlerConfig,
    getLoadSharedContentHandlerConfig,
    getSaveHandlerConfig,
    getDeleteHandlerConfig,
    type DialogType,
    type HandlerConfig,
} from './handler-configs';

// Business Logic
export {
    prepareSharedContentState,
    prepareStateAfterDelete,
    prepareStateAfterSave,
    prepareStateAfterRename,
} from './business-logic';

// Share Handlers
export {
    handleShare,
    copyShareUrl,
    type ShareResult,
} from './share-handlers';

// File Handlers
export {
    saveFileWithState,
    getSaveAction,
    handleSaveConfirm,
    getNewFileAction,
    getDeleteFileAction,
    handleDeleteConfirm,
    getImportFileAction,
    processImportFile,
    handleExportFile,
    handleLoadFileConfirm,
    type SaveFileResult,
    type DeleteFileResult,
    type ImportFileResult,
    type ExportFileResult,
} from './file-handlers';

// Load Handlers
export {
    handleLoadSharedContent,
    type LoadSharedContentResult,
} from './load-handlers';

