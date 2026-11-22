/**
 * Editor Module
 *
 * Public surface used by pages/hooks. Internal modules import each other directly.
 */

export type { EditorState } from "@/types";

export { DEFAULT_MARKDOWN } from "./constants";

export {
    getInitialEditorState,
    createNewFile,
    createNewFileFromUrl,
} from "./state";

export {
    saveFile,
    loadFile,
    renameFile,
} from "./file-operations";

export {
    hasUnsavedContent,
    isContentEmpty,
} from "./validation";

export { saveTempFile } from "./temp-file";

export {
    getSuggestedFilename,
    getStats,
} from "./utils";

export {
    sanitizeFileName,
    validateFileName,
    processImportedFile,
    truncateFilenameForDisplay,
    truncateFilename,
    MAX_FILENAME_LENGTH,
} from "./file-helpers";

export { cleanEditorUrl } from "./url-helpers";

export { handleShare } from "./share-handlers";

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
} from "./file-handlers";

export { handleLoadSharedContent } from "./load-handlers";
