/**
 * Editor State Management
 * 
 * Centralized logic for editor state, file operations, and state synchronization
 */

import { 
    getSavedFiles, 
    setSavedFiles, 
    getFileContent, 
    setFileContent, 
    removeFileContent, 
    upsertSavedFile, 
    removeSavedFile,
    setFileAsEditing,
    clearAllEditingFlags,
    getEditingFileFromSavedFiles,
    findSavedFileById,
    findSavedFileByFilename,
    type SavedFile 
} from './storage';
import { getTempFile, setTempFile, clearTempFile, getShowDefaultContent } from './storage/helpers';

const DEFAULT_MARKDOWN = `# Welcome to MDViewer Editor

Start typing to see your markdown render in real-time! This default content showcases all the powerful features available.

## 🎨 Features Showcase

### 📝 Core Features
- **Real-time Preview**: See changes instantly as you type
- **Auto-save**: Your work is automatically saved every 2 seconds
- **GitHub-style Preview**: Matches GitHub's markdown rendering exactly
- **Syntax Highlighting**: Beautiful code highlighting with copy buttons
- **Undo/Redo**: Full undo/redo support (Ctrl+Z / Ctrl+Y) synced across all view modes

### 🎯 View Modes
- **Split View**: Edit and preview side-by-side (desktop)
- **Editor Only**: Focus on writing with expanding textarea
- **Preview Only**: Full-screen preview of your rendered markdown
- **Scroll Synchronization**: Scroll positions preserved when switching modes

### 🔗 Badge Images (Shields.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

Badges automatically display in a single row when placed consecutively!

### 💻 Code Blocks with Copy Button

\`\`\`javascript
// JavaScript example with syntax highlighting
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome, \${name}!\`;
}

greet("MDViewer");
\`\`\`

\`\`\`typescript
// TypeScript example
interface User {
  name: string;
  age: number;
  role: 'admin' | 'user';
}

const user: User = {
  name: "John Doe",
  age: 30,
  role: "admin"
};
\`\`\`

\`\`\`python
# Python example
def fibonacci(n):
    """Calculate Fibonacci number recursively."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"Fibonacci(10) = {fibonacci(10)}")
\`\`\`

Hover over any code block to see the copy button!

### 🧮 Math/LaTeX Support

Inline math: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

### 😊 Emoji Support

You can use emojis directly: 😊 🚀 ⭐ ✅ ❤️ 💡 🎉 👏 💪

Or use shortcodes: :smile: :rocket: :star: :check: :heart: :bulb: :tada: :clap: :muscle:

Emojis work everywhere in your markdown! :fire: :zap: :trophy: :100:

### 📊 Mermaid Diagrams

\`\`\`mermaid
graph TD
    A[Start] --> B{Features Enabled?}
    B -->|Yes| C[Render with All Features]
    B -->|No| D[Basic Rendering]
    C --> E[HTML Support]
    C --> F[Math Support]
    C --> G[Mermaid Diagrams]
    C --> H[Image Lightbox]
    E --> I[Perfect Output!]
    F --> I
    G --> I
    H --> I
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant E as Editor
    participant P as Preview
    U->>E: Type Markdown
    E->>P: Real-time Update
    P-->>U: Rendered Output
    U->>E: Edit Code Block
    E->>P: Syntax Highlighted
\`\`\`

### 🖼️ HTML Support

<div align="center">

#### Centered Content with HTML

You can use HTML tags like \`<div align="center">\` to center content!

</div>

<details>
<summary>Click to expand - Collapsible Section</summary>

This is hidden content that can be expanded. Great for FAQs, documentation, or hiding detailed information!

- Item 1
- Item 2
- **Bold text** and *italic text* work here too!
- ~~Strikethrough with double tildes~~ and ~~this is also strikethrough~~.


</details>

### 📸 Image Support


### Standard markdown image
![Placeholder Image](https://picsum.photos/seed/mdviewer/900/260)

### HTML image with width (good test for sanitize + custom img component)
<img src="https://picsum.photos/seed/mdviewer2/1200/600" alt="Large image" width="420" />

### Image that should fail gracefully (broken URL)
![Broken Image](https://example.com/this-should-404.png)

Images support:
- Click to view in lightbox
- Automatic scrolling for large images
- Theme-aware background
- Image sizing: \`![alt](url =200x300)\`

### 📋 Tables

| Feature | Status | Notes |
|---------|--------|-------|
| HTML Support | ✅ | Full sanitization |
| Math/LaTeX | ✅ | KaTeX rendering |
| Mermaid | ✅ | Interactive diagrams |
| Code Blocks | ✅ | Copy button included |
| Badges | ✅ | Auto-row layout |
| Images | ✅ | Lightbox preview |

### 📝 Other Markdown Features

> This is a blockquote demonstrating the styling.
> 
> It can span multiple lines and supports **formatting**.

#### Lists

- Unordered list item 1
- Unordered list item 2
  - Nested item
  - Another nested item
- Unordered list item 3

1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

#### Task Lists

- [x] Completed task
- [x] Another completed task
- [ ] Pending task
- [ ] Another pending task

#### Inline Code

Use \`inline code\` for variables, functions, or technical terms.

#### Strikethrough

You can use strikethrough with double tildes: ~~This text is crossed out~~ and ~~this is also strikethrough~~.

#### Links

[MDViewer GitHub](https://github.com) - Standard markdown links work perfectly!

---

**Happy writing!** 🚀

Try editing this content to see all features in action!
`;

export interface EditorState {
    markdown: string;
    currentFileName: string | null;
    currentFileId: string | null;
    isUntitled: boolean;
    isForked: boolean;
}

export interface EditorStateCallbacks {
    onStateChange?: (state: EditorState) => void;
    onFileSaved?: (file: SavedFile) => void;
    onFileLoaded?: (file: SavedFile) => void;
}

// Re-export editor sync utilities

/**
 * Get initial editor state
 */
export function getInitialEditorState(): EditorState {
    if (typeof window === 'undefined') {
        return {
            markdown: '',
            currentFileName: null,
            currentFileId: null,
            isUntitled: false,
            isForked: false,
        };
    }

    // Check for temp file first (unsaved content takes priority)
    const tempContent = getTempFile();
    if (tempContent) {
        return {
            markdown: tempContent,
            currentFileName: null,
            currentFileId: null,
            isUntitled: false,
            isForked: false,
        };
    }

    // Check if we have a file being edited
    const editingFileData = getEditingFileFromSavedFiles();
    if (editingFileData) {
        const content = getFileContent(editingFileData.filename);
        return {
            markdown: content || '',
            currentFileName: editingFileData.filename.replace(/\.md$/i, ''),
            currentFileId: editingFileData.id,
            isUntitled: false,
            isForked: false,
        };
    }

    // Check for saved content
    const saved = localStorage.getItem('mdviewer_content');
    if (saved) {
        return {
            markdown: saved,
            currentFileName: null,
            currentFileId: null,
            isUntitled: false,
            isForked: false,
        };
    }

    // Default content or empty
    const showDefault = getShowDefaultContent();
    return {
        markdown: showDefault ? DEFAULT_MARKDOWN : '',
        currentFileName: null,
        currentFileId: null,
        isUntitled: false,
        isForked: false,
    };
}

/**
 * Generate a unique file ID
 */
export function generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Save a file with proper state management
 */
export function saveFile(
    filename: string,
    content: string,
    existingFileId?: string | null
): { success: boolean; file: SavedFile | null; error?: string } {
    if (!content.trim()) {
        return { success: false, file: null, error: 'No content to save' };
    }

    try {
        const timestamp = new Date().toISOString();
        const fullFilename = `${filename}.md`;
        
        // Find existing file by ID if provided, otherwise by filename
        const savedFiles = getSavedFiles();
        let existingFile: SavedFile | null = null;
        
        if (existingFileId) {
            existingFile = findSavedFileById(existingFileId);
        } else {
            existingFile = findSavedFileByFilename(fullFilename);
        }
        
        // Use existing ID or generate new one
        const fileId = existingFile?.id || existingFileId || generateFileId();
        
        const fileData: SavedFile = {
            id: fileId,
            filename: fullFilename,
            timestamp,
        };
        
        // Save file metadata and content
        upsertSavedFile(fileData);
        setFileContent(fullFilename, content);
        
        // Mark file as editing (clears all other editing flags)
        setFileAsEditing(fileId);
        
        // Clear temp file when file is saved
        clearTempFile();
        
        // Dispatch storage event only once for files page sync
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }
        
        return { success: true, file: fileData };
    } catch (error) {
        return { 
            success: false, 
            file: null, 
            error: error instanceof Error ? error.message : 'Failed to save file' 
        };
    }
}

/**
 * Load a file into editor state
 */
export function loadFile(fileId: string): { success: boolean; state: EditorState | null; error?: string } {
    try {
        const file = findSavedFileById(fileId);
        if (!file) {
            return { success: false, state: null, error: 'File not found' };
        }

        const content = getFileContent(file.filename);
        if (content === null) {
            return { success: false, state: null, error: 'File content not found' };
        }

        // Mark file as editing (clears all other editing flags)
        setFileAsEditing(fileId);

        // Clear temp file when loading a file
        clearTempFile();

        return {
            success: true,
            state: {
                markdown: content,
                currentFileName: file.filename.replace(/\.md$/i, ''),
                currentFileId: file.id,
                isUntitled: false,
                isForked: false,
            },
        };
    } catch (error) {
        return {
            success: false,
            state: null,
            error: error instanceof Error ? error.message : 'Failed to load file',
        };
    }
}

/**
 * Create a new file (clears current state)
 */
export function createNewFile(): EditorState {
    // Clear all editing flags
    clearAllEditingFlags();
    
    // Clear temp file
    clearTempFile();
    
    // Respect showDefaultContent setting
    const showDefault = getShowDefaultContent();
    
    return {
        markdown: showDefault ? DEFAULT_MARKDOWN : '',
        currentFileName: null,
        currentFileId: null,
        isUntitled: true,
        isForked: false,
    };
}

/**
 * Create new file from URL parameter
 */
export function createNewFileFromUrl(): EditorState {
    const state = createNewFile();
    
    // Set as untitled initially (will be saved with name on first save)
    // Don't mark as editing until it's actually saved
    return state;
}

/**
 * Delete a file
 */
export function deleteFile(fileId: string, filename: string): { success: boolean; error?: string } {
    try {
        removeFileContent(filename);
        removeSavedFile(fileId);
        clearAllEditingFlags();
        
        // Dispatch storage event for files page sync
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }
        
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete file',
        };
    }
}

/**
 * Rename a file
 */
export function renameFile(
    fileId: string,
    newFilename: string,
    content: string
): { success: boolean; file: SavedFile | null; error?: string } {
    try {
        const file = findSavedFileById(fileId);
        if (!file) {
            return { success: false, file: null, error: 'File not found' };
        }

        const oldFilename = file.filename;
        const newFullFilename = `${newFilename}.md`;

        // Get content from old filename
        const fileContent = getFileContent(oldFilename);
        if (fileContent === null) {
            return { success: false, file: null, error: 'File content not found' };
        }

        // Update file metadata with new filename but same ID
        const updatedFile: SavedFile = {
            ...file,
            filename: newFullFilename,
            timestamp: new Date().toISOString(),
        };
        upsertSavedFile(updatedFile);

        // Save content with new filename
        setFileContent(newFullFilename, content);
        // Remove old filename content
        removeFileContent(oldFilename);

        // Keep file as editing
        setFileAsEditing(fileId);

        // Clear temp file when renamed
        clearTempFile();

        // Dispatch storage event for files page sync
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
        }

        return { success: true, file: updatedFile };
    } catch (error) {
        return {
            success: false,
            file: null,
            error: error instanceof Error ? error.message : 'Failed to rename file',
        };
    }
}

/**
 * Check if content has unsaved changes
 */
export function hasUnsavedContent(markdown: string): boolean {
    const showDefault = getShowDefaultContent();
    if (showDefault) {
        return markdown.trim().length > 0 && markdown !== DEFAULT_MARKDOWN;
    }
    return markdown.trim().length > 0;
}

/**
 * Save temp file (for unsaved content)
 */
export function saveTempFile(content: string): void {
    if (content.trim()) {
        setTempFile(content);
    } else {
        clearTempFile();
    }
}

/**
 * Get suggested filename from content (first line, max 20 chars)
 */
export function getSuggestedFilename(content: string): string {
    const firstLine = content.trim().split('\n')[0];
    if (!firstLine) return 'untitled';
    
    const suggested = firstLine
        .substring(0, 20)
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
    
    if (suggested && suggested.length > 0 && suggested !== 'untitled') {
        return suggested.length > 17 ? suggested.substring(0, 17) + '...' : suggested;
    }
    return 'untitled';
}

/**
 * Load file from files page (by fileId)
 */
export function loadFileToEditor(fileId: string): { success: boolean; state: EditorState | null; error?: string } {
    return loadFile(fileId);
}

/**
 * Export default markdown constant
 */
export { DEFAULT_MARKDOWN };

