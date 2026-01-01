# Editor Page Components

Modular, maintainable editor page components split from the original monolithic `editor.tsx`.

## Structure

```
src/components/pages/editor/
├── index.tsx                    # Main editor page component (combines all sub-components)
├── EditorStatusBar.tsx          # Status bar (word count, character count, reading time, save status)
├── EditorControls.tsx           # Sticky controls bar (theme toggle, copy, share, view mode toggles)
├── EditorSection.tsx            # Markdown editor textarea section
├── PreviewSection.tsx           # Markdown preview section
├── FileActionsBar.tsx           # File action buttons (New, Import, Save, Export, Rename, Delete)
└── dialogs/
    ├── ApiWarningDialog.tsx     # API not configured warning dialog
    ├── LoadFileDialog.tsx       # Load file with unsaved content dialog
    ├── LoadSharedContentDialog.tsx  # Load shared content with unsaved local content dialog
    ├── SaveDialog.tsx           # Save/rename file dialog
    ├── EmptySaveDialog.tsx      # Empty content save warning dialog
    ├── DeleteWarningDialog.tsx  # Delete file confirmation dialog
    └── SharePanel.tsx           # Share panel with copy link, Web Share, and other options
```

## Components

### `index.tsx` (Main Component)
The main editor page component that:
- Manages all editor state (markdown, file info, dialogs, etc.)
- Uses handler functions from `@/lib/editor` for business logic
- Combines all sub-components into a cohesive editor interface
- Handles keyboard shortcuts, auto-save, scroll synchronization

**Key Features:**
- State management with React hooks
- Integration with `@/lib/editor` handlers
- Dialog state management
- Auto-save functionality
- Keyboard shortcuts
- Scroll synchronization between editor and preview

### `EditorStatusBar.tsx`
Displays editor statistics and save status:
- Word count
- Character count
- Reading time estimate
- Save status indicator

**Props:**
- `markdown: string` - Current markdown content
- `saveStatus: 'idle' | 'saving' | 'saved' | 'unsaved'` - Current save status
- `lastSaved: Date | null` - Last save timestamp
- `timeSinceSave: number` - Time since last save (seconds)

### `EditorControls.tsx`
Sticky controls bar with:
- Theme toggle (light/dark)
- Copy all content button
- Share button (opens SharePanel when share URL exists)
- View mode toggles (split, editor only, preview only)

**Props:**
- `markdown: string` - Current markdown content
- `shareUrl: string | null` - Current share URL (if any)
- `isSharing: boolean` - Whether sharing is in progress
- `soloMode: SoloMode` - Current view mode
- `onThemeToggle: () => void` - Theme toggle handler
- `onCopyAll: () => void` - Copy all content handler
- `onShare: () => void` - Share handler
- `onShowSharePanel: () => void` - Show share panel handler
- `onSetSoloMode: (mode: SoloMode) => void` - Set view mode handler
- `onFocusEditor: () => void` - Focus editor handler
- `textareaRef: RefObject<HTMLTextAreaElement | null>` - Editor textarea ref
- `editorRef: RefObject<HTMLDivElement | null>` - Editor container ref
- `previewRef: RefObject<HTMLDivElement | null>` - Preview container ref

### `EditorSection.tsx`
Markdown editor textarea section:
- Textarea for markdown editing
- Handles editor resize
- Manages textarea ref

**Props:**
- `markdown: string` - Current markdown content
- `onChange: (value: string) => void` - Content change handler
- `onFocus: () => void` - Focus handler
- `textareaRef: RefObject<HTMLTextAreaElement | null>` - Textarea ref
- `editorRef: RefObject<HTMLDivElement | null>` - Editor container ref

### `PreviewSection.tsx`
Markdown preview section:
- Renders markdown preview using `MarkdownViewer`
- Manages preview container ref

**Props:**
- `markdown: string` - Current markdown content
- `previewRef: RefObject<HTMLDivElement | null>` - Preview container ref

### `FileActionsBar.tsx`
File action buttons bar:
- New file button
- Import file button
- Save file button
- Export file button
- Rename file button
- Delete file button

**Props:**
- `currentFileName: string | null` - Current file name
- `onNewFile: () => void` - New file handler
- `onImport: () => void` - Import handler
- `onSave: () => void` - Save handler
- `onExport: () => void` - Export handler
- `onRename: () => void` - Rename handler
- `onDelete: () => void` - Delete handler

### Dialogs

#### `ApiWarningDialog.tsx`
Warning dialog shown when API is not configured for sharing.

**Props:**
- `show: boolean` - Whether to show the dialog
- `onClose: () => void` - Close handler

#### `LoadFileDialog.tsx`
Dialog shown when loading a file with unsaved content.

**Props:**
- `show: boolean` - Whether to show the dialog
- `fileName: string` - Name of file to load
- `onConfirm: (saveCurrent: boolean) => Promise<void>` - Confirm handler
- `onCancel: () => void` - Cancel handler

#### `LoadSharedContentDialog.tsx`
Dialog shown when loading shared content with unsaved local content.

**Props:**
- `show: boolean` - Whether to show the dialog
- `shareId: string` - Share ID to load
- `onConfirm: (saveCurrent: boolean) => Promise<void>` - Confirm handler
- `onCancel: () => void` - Cancel handler

#### `SaveDialog.tsx`
Dialog for saving or renaming files.

**Props:**
- `show: boolean` - Whether to show the dialog
- `mode: 'save' | 'new' | 'rename'` - Dialog mode
- `initialValue: string` - Initial filename value
- `onConfirm: (filename: string) => void` - Confirm handler
- `onCancel: () => void` - Cancel handler

#### `EmptySaveDialog.tsx`
Warning dialog shown when trying to save empty content.

**Props:**
- `show: boolean` - Whether to show the dialog
- `onClose: () => void` - Close handler

#### `DeleteWarningDialog.tsx`
Confirmation dialog for deleting files.

**Props:**
- `show: boolean` - Whether to show the dialog
- `fileName: string | null` - Name of file to delete
- `onConfirm: () => Promise<void>` - Confirm handler
- `onCancel: () => void` - Cancel handler

#### `SharePanel.tsx`
Beautiful share panel with multiple sharing options:
- Copy link button with visual feedback
- Share URL display
- Web Share API button (when available)
- Open link in browser
- Email share
- SMS share

**Props:**
- `show: boolean` - Whether to show the panel
- `shareUrl: string` - Share URL to display
- `markdown: string` - Markdown content (for sharing)
- `fileName?: string | null` - File name (optional)
- `onClose: () => void` - Close handler
- `onCopy?: () => void` - Copy callback (optional)
- `onWebShare?: () => void` - Web share callback (optional)

## Usage

The editor page is used in the Next.js app router:

```typescript
// src/app/editor/page.tsx
import EditorPage from '@/components/pages/editor';

export default function Page() {
    return <EditorPage />;
}
```

## Handler Functions

All business logic is handled by functions from `@/lib/editor`:

- **Share**: `handleShare`, `copyShareUrl` (from `share-handlers.ts`)
- **File Operations**: `getSaveAction`, `handleSaveConfirm`, `getNewFileAction`, `getDeleteFileAction`, `handleDeleteConfirm`, `getImportFileAction`, `processImportFile`, `handleExportFile`, `saveFileWithState` (from `file-handlers.ts`)
- **Load Operations**: `handleLoadSharedContent`, `handleLoadFileConfirm` (from `load-handlers.ts`)

The component uses these handlers and manages UI state (dialogs, loading states, etc.) while the handlers handle the business logic.

## Design Principles

1. **Separation of Concerns**: UI components are separate from business logic
2. **Reusability**: Components can be reused or modified independently
3. **Maintainability**: Each component has a single, clear responsibility
4. **Type Safety**: Full TypeScript support with proper types
5. **User Experience**: Beautiful, intuitive UI with proper feedback

## Migration from `editor.tsx`

The original `editor.tsx` has been refactored into this modular structure:

1. **Extracted Components**: Large inline components moved to separate files
2. **Handler Functions**: Business logic moved to `@/lib/editor` handlers
3. **Dialog Components**: All dialogs extracted to `dialogs/` folder
4. **State Management**: State remains in `index.tsx` but handlers are in `lib/editor`

The original `editor.tsx` file should remain unchanged until the new structure is fully tested and verified.

