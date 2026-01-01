# Editor Module

Professional, modular editor functionality organized by concern.

## Structure

```
src/lib/editor/
├── index.ts              # Central export point
├── constants.ts          # Constants (DEFAULT_MARKDOWN)
├── state.ts              # State management (initialization, creation)
├── file-operations.ts    # File CRUD operations
├── validation.ts          # Content validation
├── temp-file.ts          # Temporary file operations
├── utils.ts              # Utility functions (stats, filename suggestions)
├── state-checks.ts       # State validation and action checks
├── file-helpers.ts       # File operation helpers
├── url-helpers.ts        # URL parameter management
├── auto-save.ts          # Auto-save logic
├── handler-configs.ts    # Handler configuration factories
├── business-logic.ts     # Core business logic
├── share-handlers.ts     # Share functionality (upload, copy URL)
├── file-handlers.ts      # File operations handlers (save, delete, new, import, export)
└── load-handlers.ts      # Load handlers (shared content, files)
```

## Modules

### Constants (`constants.ts`)
- `DEFAULT_MARKDOWN` - Default markdown content template

### State Management (`state.ts`)
- `getInitialEditorState()` - Initialize editor state from storage
- `createNewFile()` - Create new file state
- `createNewFileFromUrl()` - Create new file from URL parameter

### File Operations (`file-operations.ts`)
- `generateFileId()` - Generate unique file IDs
- `saveFile()` - Save file with state management
- `loadFile()` - Load file into editor state
- `deleteFile()` - Delete a file
- `renameFile()` - Rename a file

### Validation (`validation.ts`)
- `hasUnsavedContent()` - Check if content has unsaved changes
- `isContentEmpty()` - Check if content is empty

### Temp File (`temp-file.ts`)
- `saveTempFile()` - Save temporary file for unsaved content

### Utils (`utils.ts`)
- `getSuggestedFilename()` - Get filename from content
- `getStats()` - Get word count, char count, reading time

### State Checks (`state-checks.ts`)
- `isSavedFile()` - Check if content is a saved file
- `hasUnsavedChanges()` - Check if saved file has unsaved changes
- `checkActionState()` - Comprehensive state check for actions
- `canCreateNewFile()` - Check if can create new file
- `canImportFile()` - Check if can import file
- `canLoadSharedContent()` - Check if can load shared content
- `determineSaveStatus()` - Determine save status from state

### File Helpers (`file-helpers.ts`)
- `saveCurrentContentToFile()` - Save unsaved content to file
- `sanitizeFileName()` - Sanitize filename
- `validateFileName()` - Validate filename
- `getExportFilename()` - Get export filename
- `createExportBlob()` - Create export blob
- `processImportedFile()` - Process imported file

### URL Helpers (`url-helpers.ts`)
- `parseEditorUrlParams()` - Parse URL parameters
- `updateEditorUrl()` - Update URL with parameters
- `cleanEditorUrl()` - Clean URL (remove editor params)

### Auto-save (`auto-save.ts`)
- `determineAutoSaveAction()` - Determine auto-save action
- `shouldAutoSave()` - Check if should auto-save
- `shouldAutoRename()` - Check if should auto-rename
- `extractFilenameFromContent()` - Extract filename from content

### Handler Configs (`handler-configs.ts`)
- `getNewFileHandlerConfig()` - Get config for new file handler
- `getImportHandlerConfig()` - Get config for import handler
- `getLoadSharedContentHandlerConfig()` - Get config for load shared content
- `getSaveHandlerConfig()` - Get config for save handler
- `getDeleteHandlerConfig()` - Get config for delete handler

### Business Logic (`business-logic.ts`)
- `prepareSharedContentState()` - Prepare state for shared content
- `prepareStateAfterDelete()` - Prepare state after delete
- `prepareStateAfterSave()` - Prepare state after save
- `prepareStateAfterRename()` - Prepare state after rename

### Share Handlers (`share-handlers.ts`)
- `handleShare()` - Share markdown content (upload to API or use Web Share API)
- `copyShareUrl()` - Copy share URL to clipboard

### File Handlers (`file-handlers.ts`)
- `saveFileWithState()` - Save file with state management
- `getSaveAction()` - Get save action configuration
- `handleSaveConfirm()` - Handle save dialog confirmation
- `getNewFileAction()` - Get new file action configuration
- `getDeleteFileAction()` - Get delete file action configuration
- `handleDeleteConfirm()` - Handle delete confirmation
- `getImportFileAction()` - Get import file action configuration
- `processImportFile()` - Process imported file
- `handleExportFile()` - Export markdown to file

### Load Handlers (`load-handlers.ts`)
- `handleLoadSharedContent()` - Load shared content from API
- `handleLoadFileConfirm()` - Handle load file confirmation dialog

## Usage

```typescript
import {
    // State management
    getInitialEditorState,
    createNewFile,
    
    // File operations
    saveFile,
    loadFile,
    
    // Validation
    hasUnsavedContent,
    isContentEmpty,
    
    // State checks
    canCreateNewFile,
    checkActionState,
    
    // Handler configs
    getNewFileHandlerConfig,
    
    // Share handlers
    handleShare,
    copyShareUrl,
    
    // File handlers
    getSaveAction,
    handleSaveConfirm,
    getNewFileAction,
    getDeleteFileAction,
    handleDeleteConfirm,
    getImportFileAction,
    processImportFile,
    handleExportFile,
    saveFileWithState,
    
    // Load handlers
    handleLoadSharedContent,
    handleLoadFileConfirm,
    
    // And more...
} from '@/lib/editor';
```

## Design Principles

1. **Separation of Concerns**: Each module has a single, clear responsibility
2. **Pure Functions**: Business logic is pure and testable
3. **Type Safety**: Full TypeScript support with proper types
4. **Backward Compatibility**: All exports maintain existing API
5. **Scalability**: Easy to add new modules and functions

## Handler Functions

The handler functions in `share-handlers.ts`, `file-handlers.ts`, and `load-handlers.ts` are designed to be used directly in React components. They handle:

- **Share Operations**: Upload markdown to API, generate share URLs, copy to clipboard
- **File Operations**: Save, delete, new, import, export with proper state management
- **Load Operations**: Load shared content from API, handle file loading with unsaved content checks

These handlers return result objects with `success`, `error`, and other relevant data, making them easy to use in UI components.

## Migration Guide

When migrating from `editor.tsx`:

1. Identify pure business logic functions
2. Move to appropriate module based on concern
3. Update imports in component
4. Use handler configs for complex decision logic
5. Keep React hooks and UI logic in component
6. Use handler functions from `share-handlers.ts`, `file-handlers.ts`, and `load-handlers.ts` for component-level operations
