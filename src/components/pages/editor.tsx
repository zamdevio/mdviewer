"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Eye, Edit3, LayoutGrid, Share2, Copy, Check, AlertCircle, X, ChevronLeft, ChevronRight, ArrowUp, Download, Loader2, Upload, FileDown, Save, FileText, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { uploadMarkdown, fetchSharedMarkdown } from "@/lib/api";
import { isApiConfigured, config } from "@/lib/config";
import { ThemeToggle } from "@/components/theme";
import { toast } from "sonner";
import { getSettings, getContent, setContent, getEditingFile, setEditingFile, removeEditingFile, getSavedFiles, setSavedFiles, getFileContent, setFileContent, removeFileContent, upsertSavedFile, removeSavedFile, onStorageChange, getActivateButtonDismissed, setActivateButtonDismissed, addSharedLink, getEditingFileFromSavedFiles, clearAllEditingFlags, type SavedFile, type SharedLink } from "@/lib/storage";
import { getShowDefaultContent, getAutoSaveEnabled, getTempFile, setTempFile, clearTempFile } from "@/lib/storage/helpers";
import { usePlatform } from "@/hooks/use-platform";
import { shareText } from "@/lib/utils";

// GitHub Dark theme colors - exact match to GitHub's syntax highlighting
// Using Prism token class names format for react-syntax-highlighter
const githubDarkTheme: Record<string, CSSProperties> = {
    'code[class*="language-"]': {
        color: '#c9d1d9',
        background: '#161b22',
        textShadow: 'none',
    },
    'pre[class*="language-"]': {
        color: '#c9d1d9',
        background: '#161b22',
        textShadow: 'none',
        padding: '16px',
        overflow: 'auto',
        fontSize: '85%',
        lineHeight: '1.45',
        borderRadius: '6px',
    },
    comment: {
        color: '#8b949e',
        fontStyle: 'italic',
    },
    prolog: {
        color: '#8b949e',
    },
    doctype: {
        color: '#8b949e',
    },
    cdata: {
        color: '#8b949e',
    },
    punctuation: {
        color: '#c9d1d9',
    },
    property: {
        color: '#79c0ff',
    },
    tag: {
        color: '#ff7b72',
    },
    boolean: {
        color: '#79c0ff',
    },
    number: {
        color: '#79c0ff',
    },
    constant: {
        color: '#79c0ff',
    },
    symbol: {
        color: '#ff7b72',
    },
    deleted: {
        color: '#ffdcd7',
        backgroundColor: 'rgba(248,81,73,0.15)',
    },
    selector: {
        color: '#79c0ff',
    },
    'attr-name': {
        color: '#79c0ff',
    },
    string: {
        color: '#a5d6ff',
    },
    char: {
        color: '#a5d6ff',
    },
    builtin: {
        color: '#ffa657',
    },
    inserted: {
        color: '#7ee787',
        backgroundColor: 'rgba(46,160,67,0.15)',
    },
    operator: {
        color: '#ff7b72',
    },
    entity: {
        color: '#79c0ff',
        cursor: 'help',
    },
    url: {
        color: '#58a6ff',
    },
    'attr-value': {
        color: '#a5d6ff',
    },
    keyword: {
        color: '#ff7b72',
    },
    function: {
        color: '#d2a8ff',
    },
    'class-name': {
        color: '#ffa657',
    },
    regex: {
        color: '#a5d6ff',
    },
    important: {
        color: '#79c0ff',
        fontWeight: 'bold',
    },
    variable: {
        color: '#79c0ff',
    },
    atrule: {
        color: '#ff7b72',
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    'template-string': {
        color: '#a5d6ff',
    },
};

const DEFAULT_MARKDOWN = `# Welcome to MDViewer Editor

Start typing to see your markdown render in real-time!

## Features

### Core Features
- **Real-time Preview**: See changes instantly as you type
- **Auto-save**: Your work is automatically saved to localStorage
- **GitHub-style Preview**: Matches GitHub's markdown rendering exactly
- **Syntax Highlighting**: Beautiful code highlighting with GitHub Dark theme support

### View Modes
- **Split View**: Edit and preview side-by-side (desktop)
- **Editor Only**: Focus on writing with expanding textarea
- **Preview Only**: Full-screen preview of your rendered markdown
- **Scroll Synchronization**: Scroll positions preserved when switching modes

### Sharing & Collaboration
- **Share Markdown**: Generate shareable links for your content
- **Cloudflare Workers API**: Fast, edge-deployed sharing backend
- **Copy Share URL**: One-click copy to clipboard

### User Experience
- **Sticky Controls**: Always accessible editor controls that stay visible
- **Collapse/Expand**: Minimize controls for a cleaner view
- **Theme Toggle**: Switch between light and dark modes
- **Scroll to Top**: Quick navigation button when scrolled down
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Toast Notifications**: Beautiful notifications for actions and errors

### Code Example
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet("World");
\`\`\`

### Python Example
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\`

> This is a blockquote demonstrating the styling.

- List item 1
- List item 2
- List item 3

**Happy writing!** 🚀
`;

type SoloMode = "both" | "editor" | "preview";

export default function EditorPage() {
    const { isMobile } = usePlatform();
    const [markdown, setMarkdown] = useState(() => {
        if (typeof window !== "undefined") {
            // Always check for temp file first (unsaved content takes priority)
            const tempContent = getTempFile();
            if (tempContent) return tempContent;
            
            // Check if we have a file being edited - if so, don't load from content
            const editingFile = getEditingFile();
            if (!editingFile) {
                const saved = getContent();
                if (saved) return saved;
                // Check if should show default content
                return getShowDefaultContent() ? DEFAULT_MARKDOWN : "";
            }
            // If editing a file, start with empty - will be loaded in useEffect
            return "";
        }
        return "";
    });
    const [isPreview, setIsPreview] = useState(false);
    const [soloMode, setSoloMode] = useState<SoloMode>("both");
    const previousModeRef = useRef<SoloMode>("both");
    const [mounted, setMounted] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showApiWarning, setShowApiWarning] = useState(false);
    const [showThemeToggle, setShowThemeToggle] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [isActivateButtonDismissed, setIsActivateButtonDismissed] = useState(() => {
        if (typeof window !== "undefined") {
            return getActivateButtonDismissed();
        }
        return false;
    });
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [loadShareId, setLoadShareId] = useState<string | null>(null);
    const [loadingSharedContent, setLoadingSharedContent] = useState(false);
    const [currentFileName, setCurrentFileName] = useState<string | null>(null);
    const [currentFileId, setCurrentFileId] = useState<string | null>(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveFileName, setSaveFileName] = useState("");
    const [saveDialogMode, setSaveDialogMode] = useState<'save' | 'new' | 'rename'>('save');
    const [pendingNewFile, setPendingNewFile] = useState(false);
    const [saveDialogInitialValue, setSaveDialogInitialValue] = useState("");
    const [isUntitled, setIsUntitled] = useState(false);
    const [isForked, setIsForked] = useState(false); // Track if content is forked from share/search
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [timeSinceSave, setTimeSinceSave] = useState<number>(0);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const tempSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const soloTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Unified scroll position tracker for all modes
    const scrollPositionsRef = useRef<{
        editor: number;
        preview: number;
        page: number;
    }>({
        editor: 0,
        preview: 0,
        page: 0,
    });

    // Avoid hydration mismatch - necessary for client-side only rendering
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Check for load and new query parameters
    useEffect(() => {
        if (!mounted) return;

        const urlParams = new URLSearchParams(window.location.search);
        const loadId = urlParams.get('load');
        const newParam = urlParams.get('new');
        
        if (newParam !== null) {
            // Clear all editing flags
            clearAllEditingFlags();
            // Create new untitled file with empty content
            setCurrentFileName('untitled');
            setCurrentFileId(null); // Will be generated on first save
            setIsUntitled(true);
            // Load auto-save setting from storage
            const settings = getSettings();
            setAutoSaveEnabled(settings?.autoSave ?? true);
            setEditingFile('untitled');
            setMarkdown(""); // Empty content for new files
            // Save untitled file initially (will generate new ID)
            setTimeout(() => {
                saveFile('untitled', false);
            }, 100);
            // Remove query param immediately
            const url = new URL(window.location.href);
            url.searchParams.delete('new');
            window.history.replaceState({}, '', url.toString());
            return;
        }
        
        const showDefault = getShowDefaultContent();
        const hasContent = showDefault 
            ? (markdown.trim() && markdown !== DEFAULT_MARKDOWN)
            : markdown.trim().length > 0;
        if (loadId && hasContent) {
            // There's existing content, show dialog
            setLoadShareId(loadId);
            setShowLoadDialog(true);
        } else if (loadId) {
            // No existing content, load directly
            handleLoadSharedContent(loadId, false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    // Function to load file content by file ID (primary method)
    const loadFileContentByFileId = async (fileId: string, filename: string, isInitialLoad: boolean = false) => {
        const nameWithoutExt = filename.replace(/\.md$/i, '');
        setCurrentFileName(nameWithoutExt);
        setCurrentFileId(fileId);
        // Load auto-save setting from storage
        const settings = getSettings();
        setAutoSaveEnabled(settings?.autoSave ?? true);
        
        // Load the file content using filename (content is stored by filename)
        try {
            // Load from storage
            const content = getFileContent(filename);
            
            if (content !== null) {
                // If content is empty and showDefaultContent is enabled, show default
                const showDefault = getShowDefaultContent();
                setMarkdown(content || (showDefault ? DEFAULT_MARKDOWN : ""));
                // Mark as not untitled since we're loading an existing file
                setIsUntitled(false);
                // Don't show toast on initial load to avoid noise
                if (!isInitialLoad) {
                    toast.success("File loaded");
                }
            } else {
                // File not found, clear the editing file
                clearAllEditingFlags();
                setCurrentFileName(null);
                setCurrentFileId(null);
                // Load from content as fallback
                const saved = getContent();
                if (saved) {
                    setMarkdown(saved);
                } else {
                    const showDefault = getShowDefaultContent();
                    setMarkdown(showDefault ? DEFAULT_MARKDOWN : "");
                }
            }
        } catch (error) {
            // On error, clear editing file and load from content
            clearAllEditingFlags();
            setCurrentFileName(null);
            setCurrentFileId(null);
            const saved = getContent();
            if (saved) {
                setMarkdown(saved);
            } else {
                const showDefault = getShowDefaultContent();
                setMarkdown(showDefault ? DEFAULT_MARKDOWN : "");
            }
            toast.error("Failed to load file");
        }
    };

    // Load file marked as editing on mount
    useEffect(() => {
        if (!mounted) return;
        
        // Check for temp file first (unsaved content takes priority)
        const tempContent = getTempFile();
        if (tempContent) {
            // Temp file exists, use it and don't load editing file
            setMarkdown(tempContent);
            setCurrentFileName(null);
            setCurrentFileId(null);
            setIsUntitled(false);
            const settings = getSettings();
            setAutoSaveEnabled(settings?.autoSave ?? true);
            return;
        }
        
        // Check for file with editing: true flag
        const editingFileData = getEditingFileFromSavedFiles();
        
        if (editingFileData) {
            // Load the file that is marked as editing - use file ID, not name
            setCurrentFileId(editingFileData.id);
            const nameWithoutExt = editingFileData.filename.replace(/\.md$/i, '');
            setCurrentFileName(nameWithoutExt);
            loadFileContentByFileId(editingFileData.id, editingFileData.filename, true);
        } else {
            // No file marked as editing, check settings for default content
            const showDefault = getShowDefaultContent();
            if (showDefault) {
                setMarkdown(DEFAULT_MARKDOWN);
            } else {
                setMarkdown(""); // Empty new file
            }
            setCurrentFileName(null);
            setCurrentFileId(null);
            setIsUntitled(false);
            // Load auto-save setting
            const settings = getSettings();
            setAutoSaveEnabled(settings?.autoSave ?? true);
        }
    }, [mounted]);

    // Listen for editing file changes (when loading from files page)
    useEffect(() => {
        if (!mounted) return;

        const checkEditingFile = () => {
            const editingFileData = getEditingFileFromSavedFiles();
            if (editingFileData && editingFileData.id !== currentFileId) {
                // Editing file changed, load the new file by ID
                setCurrentFileId(editingFileData.id);
                const nameWithoutExt = editingFileData.filename.replace(/\.md$/i, '');
                setCurrentFileName(nameWithoutExt);
                loadFileContentByFileId(editingFileData.id, editingFileData.filename, false);
            } else if (!editingFileData && currentFileId) {
                // Editing file was cleared
                setCurrentFileName(null);
                setCurrentFileId(null);
                setIsUntitled(false);
            }
        };

        // Check immediately in case file was set before this effect ran
        checkEditingFile();

        // Listen for storage changes
        const unsubscribe = onStorageChange((key) => {
            // Check editing file on any storage change (key might be null for custom events)
            if (key === 'mdviewer_saved_files' || key === null) {
                checkEditingFile();
            }
        });
        
        // Check when page becomes visible (user navigated back to editor)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkEditingFile();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [mounted, currentFileId]);

    // Save current content to file before loading new content
    const saveCurrentContentToFile = async (): Promise<string | null> => {
        const showDefault = getShowDefaultContent();
        if (!markdown.trim() || (showDefault && markdown === DEFAULT_MARKDOWN)) {
            return null;
        }

        // Save to storage with timestamp
        const timestamp = new Date().toISOString();
        const savedFiles = getSavedFiles();
        const filename = `saved-${Date.now()}.md`;
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const fileData: SavedFile = {
            id: fileId,
            filename,
            timestamp,
        };
        savedFiles.push(fileData);
        setSavedFiles(savedFiles);
        setFileContent(filename, markdown);
        return filename;
        
        return null;
    };

    // Load shared content
    const handleLoadSharedContent = async (shareId: string, saveCurrent: boolean) => {
        setLoadingSharedContent(true);
        
        try {
            // Save current content if requested
            if (saveCurrent) {
                const filename = await saveCurrentContentToFile();
                if (filename) {
                    toast.success(`Current content saved as ${filename}`);
                }
            }

            // Load shared content
            const content = await fetchSharedMarkdown(shareId);
            setMarkdown(content);
            
            // Mark as forked and clear temp file (this is new content)
            setIsForked(true);
            setIsUntitled(true);
            setCurrentFileName(null);
            setCurrentFileId(null);
            clearTempFile(); // Clear any existing temp file
            setTempFile(content); // Save as temp file
            
            toast.success("Shared content loaded! Please save with a filename to share or save again.");

            // Remove load query param from URL
            const url = new URL(window.location.href);
            url.searchParams.delete('load');
            window.history.replaceState({}, '', url.toString());
            
            // Close dialog
            setShowLoadDialog(false);
            setLoadShareId(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load shared content");
        } finally {
            setLoadingSharedContent(false);
        }
    };

    // Handle dismissing the activate button
    const handleDismissActivateButton = () => {
        setIsActivateButtonDismissed(true);
        setActivateButtonDismissed(true);
    };

    useEffect(() => {
        if (mounted) {
            setContent(markdown);
            
            // Reset share URL when content changes (user edits after sharing)
            if (shareUrl && markdown.trim()) {
                setShareUrl(null);
                setCopied(false);
            }
        }
    }, [markdown, mounted, shareUrl]);

    // Auto-save to temp file (works regardless of auto-save settings)
    useEffect(() => {
        if (!mounted) {
            return;
        }

        // Clear existing timer
        if (tempSaveTimerRef.current) {
            clearTimeout(tempSaveTimerRef.current);
            tempSaveTimerRef.current = null;
        }

        // Only save to temp file if no file is open (unsaved content)
        if (!currentFileName) {
            if (markdown.trim()) {
                // Debounce temp file saves to avoid excessive writes
                tempSaveTimerRef.current = setTimeout(() => {
                    try {
                        setTempFile(markdown);
                    } catch (error) {
                        console.error('Error saving temp file:', error);
                    }
                    tempSaveTimerRef.current = null;
                }, 1500); // Save after 1.5 seconds of no typing
            } else {
                // Clear temp file if content is empty
                clearTempFile();
            }
        } else {
            // Clear temp file when a file is open
            clearTempFile();
        }

        return () => {
            if (tempSaveTimerRef.current) {
                clearTimeout(tempSaveTimerRef.current);
                tempSaveTimerRef.current = null;
            }
        };
    }, [markdown, mounted, currentFileName]);

    // Save temp file on unmount if there's unsaved content
    useEffect(() => {
        return () => {
            // Save temp file on component unmount if there's unsaved content
            if (!currentFileName && markdown.trim()) {
                try {
                    setTempFile(markdown);
                } catch (error) {
                    toast.error(`Error saving temp file on unmount: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        };
    }, [markdown, currentFileName]);

    // Auto-rename and auto-save untitled files based on first 20 chars
    useEffect(() => {
        const showDefault = getShowDefaultContent();
        if (!mounted || !isUntitled || currentFileName !== 'untitled' || !markdown.trim() || (showDefault && markdown === DEFAULT_MARKDOWN)) {
            return;
        }

        // Check if this is the first line being written
        const firstLine = markdown.trim().split('\n')[0];
        const hasFirstLine = firstLine.length > 0;

        if (!hasFirstLine) return;

        // Debounce auto-rename and auto-save
        const renameTimer = setTimeout(() => {
            const suggestedName = firstLine
                .substring(0, 20)
                .replace(/[^a-zA-Z0-9\s-_]/g, '')
                .trim()
                .replace(/\s+/g, '-')
                .toLowerCase();
            
            if (suggestedName && suggestedName.length > 0 && suggestedName !== 'untitled') {
                // Truncate if too long and add ellipsis
                const finalName = suggestedName.length > 17 ? suggestedName.substring(0, 17) + '...' : suggestedName;
                setCurrentFileName(finalName);
                setIsUntitled(false);
                setEditingFile(finalName);
                // Auto-save with new name immediately
                saveFile(finalName, false);
            } else {
                // Even if name is invalid, auto-save the untitled file after first word
                saveFile('untitled', false);
            }
        }, 2000); // Wait 2 seconds after user stops typing
        
        return () => clearTimeout(renameTimer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markdown, mounted, isUntitled, currentFileName]);

    // Load settings for auto-save and keyboard shortcuts
    useEffect(() => {
        if (!mounted) return;
        
        const settings = getSettings();
        if (settings) {
            setAutoSaveEnabled(settings.autoSave ?? true);
            setKeyboardShortcutsEnabled(settings.keyboardShortcuts ?? true);
        }
        
        // Listen for settings changes
        const unsubscribe = onStorageChange((key) => {
            if (key === 'mdviewer_settings') {
                const updatedSettings = getSettings();
                if (updatedSettings) {
                    setAutoSaveEnabled(updatedSettings.autoSave ?? true);
                    setKeyboardShortcutsEnabled(updatedSettings.keyboardShortcuts ?? true);
                }
            }
        });
        
        return unsubscribe;
    }, [mounted]);

    // Keyboard shortcuts handler - intercept ALL Ctrl+S signals
    useEffect(() => {
        if (!mounted || !keyboardShortcutsEnabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+S or Cmd+S - Save (ALWAYS intercept, prevent browser save)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Only skip if typing in a text input (not textarea in editor)
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' && target.getAttribute('type') !== 'text') {
                    return;
                }
                
                // Always handle save in editor
                handleSave();
                return false;
            }
            
            // Don't trigger other shortcuts when typing in inputs
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || (target.tagName === 'TEXTAREA' && soloMode !== 'preview')) {
                return;
            }

            // Ctrl+N or Cmd+N - New file (prevent browser new window)
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                e.stopPropagation();
                handleNewFile();
                return;
            }

            // Ctrl+E or Cmd+E - Export (only works on editor with content)
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                if (markdown.trim()) {
                    handleExport();
                } else {
                    toast.info("Export is only available when editing a file with content. Use Settings page to export all data.");
                }
                return;
            }

            // Ctrl+O or Cmd+O - Import (handled globally)
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                // Global handler will take care of it
                return;
            }

            // Ctrl+/ or Cmd+/ - Toggle preview
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                if (soloMode === 'preview') {
                    setSoloMode('both');
                } else if (soloMode === 'both') {
                    setSoloMode('preview');
                }
                return;
            }

            // Escape - Close dialogs
            if (e.key === 'Escape') {
                if (showSaveDialog) {
                    setShowSaveDialog(false);
                    setSaveFileName("");
                    setPendingNewFile(false);
                }
                if (showLoadDialog) {
                    setShowLoadDialog(false);
                    setLoadShareId(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, keyboardShortcutsEnabled, soloMode, showSaveDialog, showLoadDialog]);

    // Real-time timer for "saved Xs ago"
    useEffect(() => {
        if (!lastSaved) {
            setTimeSinceSave(0);
            return;
        }

        const updateTimer = () => {
            setTimeSinceSave(Math.floor((Date.now() - lastSaved.getTime()) / 1000));
        };

        // Update immediately
        updateTimer();

        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [lastSaved]);

    // Auto-save to file (every 30 seconds if enabled and file is open)
    useEffect(() => {
        if (!mounted || !autoSaveEnabled || !currentFileName || !markdown.trim()) {
            return;
        }

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Set new timer for auto-save
        autoSaveTimerRef.current = setTimeout(async () => {
            const success = await saveFile(currentFileName, false); // Silent save
            if (success) {
                // Update lastSaved to trigger timer display
                setLastSaved(new Date());
            }
            // Trigger storage event for files page sync
            window.dispatchEvent(new Event('storage'));
        }, 30000); // 30 seconds

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markdown, currentFileName, autoSaveEnabled, mounted]);

    // Save scroll position BEFORE mode changes
    useEffect(() => {
        if (!mounted) return;
        
        // Save current scroll positions before any mode change
        const saveScrollPositions = () => {
            // Save editor scroll position (split view)
            if (editorRef.current) {
                scrollPositionsRef.current.editor = editorRef.current.scrollTop;
            }
            
            // Save preview scroll position (split view or preview-only)
            if (previewRef.current) {
                scrollPositionsRef.current.preview = previewRef.current.scrollTop;
            }
            
            // Save page scroll position (editor-only mode uses page scroll)
            scrollPositionsRef.current.page = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        };

        // Save positions continuously during scrolling
        const editorElement = editorRef.current;
        const previewElement = previewRef.current;

        if (editorElement) {
            editorElement.addEventListener('scroll', saveScrollPositions, { passive: true });
        }
        if (previewElement) {
            previewElement.addEventListener('scroll', saveScrollPositions, { passive: true });
        }
        window.addEventListener('scroll', saveScrollPositions, { passive: true });

        return () => {
            if (editorElement) {
                editorElement.removeEventListener('scroll', saveScrollPositions);
            }
            if (previewElement) {
                previewElement.removeEventListener('scroll', saveScrollPositions);
            }
            window.removeEventListener('scroll', saveScrollPositions);
        };
    }, [mounted, soloMode, isPreview]);

    // Restore scroll positions after mode changes
    useEffect(() => {
        if (!mounted) return;
        
        // When switching from duo to editor-only, convert editor scroll to page scroll
        // We need to calculate where the editor content would be on the page
        const restoreScroll = () => {
            if (soloMode === "both") {
                // Restore editor scroll in split view
                if (editorRef.current) {
                    editorRef.current.scrollTop = scrollPositionsRef.current.editor;
                }
                // Restore preview scroll in split view
                if (previewRef.current) {
                    previewRef.current.scrollTop = scrollPositionsRef.current.preview;
                }
            } else if (soloMode === "editor") {
                // When switching from duo to editor-only:
                // If we have an editor scroll position but no page scroll, convert it
                // The editor scroll position needs to be converted to page scroll
                if (scrollPositionsRef.current.editor > 0 && scrollPositionsRef.current.page === 0) {
                    // Get the position of the editor section on the page
                    const editorSection = document.querySelector('[data-editor-section]');
                    if (editorSection) {
                        const rect = editorSection.getBoundingClientRect();
                        const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                        // Convert editor scroll to approximate page scroll position
                        const targetScroll = scrollTop + rect.top + scrollPositionsRef.current.editor;
                        window.scrollTo({
                            top: targetScroll,
                            behavior: 'instant' as ScrollBehavior
                        });
                    } else {
                        // Fallback: use saved page scroll
                        window.scrollTo({
                            top: scrollPositionsRef.current.page,
                            behavior: 'instant' as ScrollBehavior
                        });
                    }
                } else {
                    // Restore page scroll in editor-only mode
                    window.scrollTo({
                        top: scrollPositionsRef.current.page,
                        behavior: 'instant' as ScrollBehavior
                    });
                }
            } else if (soloMode === "preview") {
                // Restore preview scroll in preview-only mode
                if (previewRef.current) {
                    previewRef.current.scrollTop = scrollPositionsRef.current.preview;
                }
            }
        };

        // Use requestAnimationFrame to ensure DOM is ready, then restore
        const rafId = requestAnimationFrame(() => {
            setTimeout(restoreScroll, 0);
        });

        return () => cancelAnimationFrame(rafId);
    }, [soloMode, isPreview, mounted]);

    // Auto-resize textarea in solo editor mode
    useEffect(() => {
        if (!mounted || !soloTextareaRef.current) return;
        
        // Resize in editor-only mode
        if (soloMode === "editor") {
            const textarea = soloTextareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [markdown, mounted, soloMode]);

    // Check API configuration on mount
    useEffect(() => {
        if (mounted && !isApiConfigured()) {
            setShowApiWarning(true);
        }
    }, [mounted]);

    // Detect if navbar is scrolled out of view
    useEffect(() => {
        if (!mounted) return;

        const handleScroll = () => {
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            // Show theme toggle when scrolled past navbar (approximately 100px)
            setShowThemeToggle(scrollY > 100);
        };

        // Check on mount
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [mounted]);

    const handleShare = async () => {
        if (!markdown.trim()) {
            toast.error("Cannot share empty content");
            return;
        }

        // If content is forked (from share/search), require filename first
        if (isForked && !currentFileName) {
            toast.info("Please save this content with a filename before sharing");
            setSaveDialogMode('save');
            setPendingNewFile(false);
            setSaveFileName("");
            setSaveDialogInitialValue("");
            setShowSaveDialog(true);
            return;
        }

        // Check if API is configured before attempting to share
        if (!isApiConfigured()) {
            // Try Web Share API as fallback
            const success = await shareText(markdown, "My Markdown Document");
            if (success) {
                toast.success("Shared via Web Share!");
            } else {
                setShowApiWarning(true);
                toast.warning("API not configured. Please configure the API URL to use the share feature.");
            }
            return;
        }

        setIsSharing(true);
        toast.loading("Sharing your markdown...", { id: "sharing" });
        try {
            const result = await uploadMarkdown(markdown);
            // Construct share URL with query parameter format
            const url = `/share?id=${result.id}`;
            // Construct full URL using config
            const fullUrl = `${config.FRONTEND_URL}${url}`;
            setShareUrl(fullUrl);
            setShowApiWarning(false); // Hide warning on success
            
            // Store shared link
            const sharedLink: SharedLink = {
                id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                shareId: result.id,
                url: fullUrl,
                preview: markdown.substring(0, 100) + (markdown.length > 100 ? '...' : ''),
                filename: currentFileName ? `${currentFileName}.md` : undefined,
                timestamp: new Date().toISOString(),
            };
            addSharedLink(sharedLink);
            
            // Auto-copy to clipboard
            try {
                await navigator.clipboard.writeText(fullUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (clipboardError) {
                // Ignore clipboard errors
            }
            
            toast.success("Share link copied to clipboard!", { id: "sharing" });
        } catch (error) {
            // Try Web Share API as fallback
            const success = await shareText(markdown, "My Markdown Document");
            if (success) {
                toast.success("Shared via Web Share!");
                setIsSharing(false);
                return;
            }
            // Check if it's a connection error (API not available)
            if (error instanceof Error && error.message.includes('fetch')) {
                setShowApiWarning(true);
                toast.error("Failed to connect to API. Please check your API configuration.", { id: "sharing" });
            } else {
                toast.error(error instanceof Error ? error.message : "Failed to share. Please try again.", { id: "sharing" });
            }
        } finally {
            setIsSharing(false);
        }
    };

    const handleCopyShareUrl = async () => {
        if (!shareUrl) return;
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Share URL copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy URL");
        }
    };

    // Export markdown to file
    const handleExport = async () => {
        if (!markdown.trim()) {
            toast.error("No content to export");
            return;
        }

        try {
            // Create blob and download
            const blob = new Blob([markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `markdown-${Date.now()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            toast.success("Markdown exported!");
        } catch (error) {
            toast.error("Failed to export file");
        }
    };

    // Import markdown from file
    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt,text/markdown,text/plain';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                
                // Check if there's existing content
                const showDefault = getShowDefaultContent();
                const hasContent = showDefault 
                    ? (markdown.trim() && markdown !== DEFAULT_MARKDOWN)
                    : markdown.trim().length > 0;
                if (hasContent) {
                    // Save current content first
                    const filename = await saveCurrentContentToFile();
                    if (filename) {
                        toast.success(`Current content saved as ${filename}`);
                    }
                }
                
                // Set current file name from imported file
                const importedFileName = file.name.replace(/\.(md|txt)$/i, '');
                setCurrentFileName(importedFileName);
                setEditingFile(importedFileName);
                
                setMarkdown(text);
                toast.success("File imported successfully!");
            } catch (error) {
                toast.error("Failed to import file");
            }
        };
        input.click();
    };

    // Save file function
    // Generate unique ID for files
    const generateFileId = (): string => {
        return `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    };

    const saveFile = async (filename: string, showToast: boolean = true): Promise<boolean> => {
        if (!markdown.trim()) {
            if (showToast) toast.error("No content to save");
            return false;
        }

        try {
            const timestamp = new Date().toISOString();
            const fullFilename = `${filename}.md`;
            
            // Find file by ID if we have currentFileId, otherwise by filename
            const savedFiles = getSavedFiles();
            let existingFile: SavedFile | null = null;
            
            if (currentFileId) {
                // Use file ID to find the file (primary method)
                existingFile = savedFiles.find((f: SavedFile) => f.id === currentFileId) || null;
            } else {
                // Fallback to filename (for backward compatibility)
                existingFile = savedFiles.find((f: SavedFile) => f.filename === fullFilename) || null;
            }
            
            const fileData: SavedFile = {
                id: existingFile?.id || currentFileId || generateFileId(),
                filename: fullFilename,
                timestamp,
            };
            
            // Set the file ID if we didn't have it before
            if (!currentFileId && fileData.id) {
                setCurrentFileId(fileData.id);
            }
            
            // Save to storage
            upsertSavedFile(fileData);
            setFileContent(fullFilename, markdown);
            
            // Clear temp file when file is saved
            clearTempFile();
            setIsForked(false);
            setIsUntitled(false);
            
            if (showToast) {
                toast.success("File saved!");
            }
            setLastSaved(new Date());
            return true;
        } catch (error) {
            if (showToast) {
                toast.error("Failed to save file");
            }
            return false;
        }
    };

    // Check if there's unsaved content that needs saving
    const hasUnsavedContent = (): boolean => {
        const showDefault = getShowDefaultContent();
        if (showDefault) {
            return markdown.trim().length > 0 && markdown !== DEFAULT_MARKDOWN;
        }
        return markdown.trim().length > 0;
    };

    // Handle new file button click
    const handleNewFile = () => {
        // Clear all editing flags first
        clearAllEditingFlags();
        // Check if there's unsaved content
        if (hasUnsavedContent()) {
            // If editing a file, save it first
            if (currentFileName) {
                // File is already saved, just clear and create new
                setCurrentFileName(null);
                setCurrentFileId(null);
                removeEditingFile();
                setMarkdown(""); // Empty content for new files
                toast.success("New file created");
            } else {
                // Unsaved content, ask to save first
                setSaveDialogMode('new');
                setPendingNewFile(true);
                setSaveFileName("");
                setSaveDialogInitialValue("");
                setShowSaveDialog(true);
            }
        } else {
            // No content, just create new file with empty content
            setCurrentFileName(null);
            setCurrentFileId(null);
            removeEditingFile();
            setMarkdown(""); // Empty content for new files
            toast.success("New file created");
        }
    };

    // Handle delete file
    const handleDeleteFile = () => {
        if (!currentFileName) return;
        setShowDeleteWarning(true);
    };

    const handleDeleteConfirm = async () => {
        if (!currentFileName) return;
        setShowDeleteWarning(false);

        try {
            // Use file ID to delete (primary method)
            if (currentFileId) {
                const savedFiles = getSavedFiles();
                const fileToDelete = savedFiles.find((f: SavedFile) => f.id === currentFileId);
                
                if (fileToDelete) {
                    removeFileContent(fileToDelete.filename);
                    removeSavedFile(currentFileId);
                }
            } else if (currentFileName) {
                // Fallback to filename if no ID (for backward compatibility)
                removeFileContent(`${currentFileName}.md`);
                const savedFiles = getSavedFiles();
                const fileToDelete = savedFiles.find((f: SavedFile) => f.filename === `${currentFileName}.md`);
                if (fileToDelete?.id) {
                    removeSavedFile(fileToDelete.id);
                } else {
                    const updated = savedFiles.filter((f: SavedFile) => f.filename !== `${currentFileName}.md`);
                    setSavedFiles(updated);
                }
            }

            // Clear editor
            setCurrentFileName(null);
            setCurrentFileId(null);
            setIsUntitled(false);
            clearAllEditingFlags();
            removeEditingFile();
            setMarkdown("");
            setShareUrl(null);
            setLastSaved(null);
            
            toast.success("File deleted");
        } catch (error) {
            toast.error("Failed to delete file");
        }
    };


    // Handle save button click
    const handleSave = async () => {
        // If content is forked (from share/search), require filename
        if (isForked && !currentFileName) {
            setSaveDialogMode('save');
            setPendingNewFile(false);
            setSaveFileName("");
            setSaveDialogInitialValue("");
            setShowSaveDialog(true);
            toast.info("Please provide a filename to save this content");
            return;
        }
        
        if (currentFileName) {
            // File already exists, just save it
            await saveFile(currentFileName);
        } else {
            // New file, ask for name
            setSaveDialogMode('save');
            setPendingNewFile(false);
            setSaveFileName("");
            setSaveDialogInitialValue("");
            setShowSaveDialog(true);
        }
    };

    // Handle save dialog confirm
    const handleSaveConfirm = async () => {
        if (!saveFileName.trim()) {
            toast.error("Please enter a filename");
            return;
        }

        // Remove .md extension if user added it
        const cleanName = saveFileName.trim().replace(/\.md$/i, '');
        
        if (saveDialogMode === 'rename' && currentFileId) {
            // Rename: Update filename but preserve file ID
            const savedFiles = getSavedFiles();
            const fileToRename = savedFiles.find((f: SavedFile) => f.id === currentFileId);
            
            if (fileToRename) {
                const oldFilename = fileToRename.filename;
                const newFilename = `${cleanName}.md`;
                
                // Get content from old filename
                const content = getFileContent(oldFilename);
                
                if (content !== null) {
                    // Update file metadata with new filename but same ID
                    const updatedFile: SavedFile = {
                        ...fileToRename,
                        filename: newFilename,
                        timestamp: new Date().toISOString(),
                    };
                    upsertSavedFile(updatedFile);
                    
                    // Save content with new filename
                    setFileContent(newFilename, content);
                    // Remove old filename content
                    removeFileContent(oldFilename);
                    
                    // Update editor state
                    setCurrentFileName(cleanName);
                    // File ID stays the same
                    setEditingFile(cleanName);
                    setShowSaveDialog(false);
                    setSaveFileName("");
                    setSaveDialogInitialValue("");
                    
                    // Clear temp file and forked flag when renamed
                    clearTempFile();
                    setIsForked(false);
                    setIsUntitled(false);
                    
                    toast.success("File renamed");
                } else {
                    toast.error("Failed to load file content for rename");
                }
            } else {
                toast.error("File not found");
            }
        } else {
            // Save or new file
            const success = await saveFile(cleanName);
            
            // Always close dialog after save attempt
            setShowSaveDialog(false);
            setSaveFileName("");
            setSaveDialogInitialValue("");
            
            if (success) {
                setCurrentFileName(cleanName);
                // File ID is set in saveFile function
                setEditingFile(cleanName);
                
                // Clear temp file and forked flag when saved
                clearTempFile();
                setIsForked(false);
                setIsUntitled(false);
                
                // If this was for creating a new file, clear and create new
                if (pendingNewFile) {
                    setPendingNewFile(false);
                    // Small delay to show save success, then create new
                    setTimeout(() => {
                        setCurrentFileName(null);
                        setCurrentFileId(null);
                        removeEditingFile();
                        setMarkdown("");
                        toast.success("New file created");
                    }, 500);
                }
            }
        }
    };

    // Load file from files page
    const loadFileToEditor = (filename: string, content: string) => {
        // Save current content if exists
        if (markdown.trim() && markdown !== DEFAULT_MARKDOWN && currentFileName) {
            saveFile(currentFileName, false);
        }
        
        setCurrentFileName(filename.replace(/\.md$/i, ''));
        setEditingFile(filename.replace(/\.md$/i, ''));
        setMarkdown(content);
        // Load auto-save setting from storage
        const settings = getSettings();
        setAutoSaveEnabled(settings?.autoSave ?? true);
        toast.success("File loaded to editor");
    };

    if (!mounted) return null;

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-200px)] flex flex-col gap-4 animate-fade-in">
            {/* API Configuration Warning */}
            {showApiWarning && (
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/20 border-2">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                                API Not Configured
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                The share feature requires a Cloudflare Workers API to be configured. 
                                The API URL is currently set to localhost, which won't work in production.
                            </p>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium">To fix this:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                                    <li>Deploy the Workers API (see <code className="bg-muted px-1 rounded">workers-api/README.md</code>)</li>
                                    <li>Update <code className="bg-muted px-1 rounded">src/lib/config.ts</code> with your API URL</li>
                                    <li>Or set the <code className="bg-muted px-1 rounded">API_URL</code> environment variable</li>
                                </ol>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiWarning(false)}
                            className="h-6 w-6 p-0 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            )}

            {showLoadDialog && loadShareId && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !loadingSharedContent) {
                            setShowLoadDialog(false);
                            setLoadShareId(null);
                            const url = new URL(window.location.href);
                            url.searchParams.delete('load');
                            window.history.replaceState({}, '', url.toString());
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3">
                            <Download className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-primary mb-1">
                                    Load Shared Content?
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    You have unsaved content in the editor. Would you like to save it before loading the shared content?
                                </p>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleLoadSharedContent(loadShareId, true)}
                                        disabled={loadingSharedContent}
                                        className="gap-2 w-full"
                                    >
                                        {loadingSharedContent ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Save & Load
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleLoadSharedContent(loadShareId, false)}
                                        disabled={loadingSharedContent}
                                        className="w-full"
                                    >
                                        Load Without Saving
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowLoadDialog(false);
                                            setLoadShareId(null);
                                            const url = new URL(window.location.href);
                                            url.searchParams.delete('load');
                                            window.history.replaceState({}, '', url.toString());
                                        }}
                                        disabled={loadingSharedContent}
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {/* Import/Export/Save Buttons - Outside Live Editor */}
            <div className="flex items-center justify-between gap-2">
                {currentFileName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline flex-shrink-0">Editing: </span>
                        <span className="font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-none" title={`${currentFileName}.md`}>{currentFileName}.md</span>
                        {lastSaved && (
                            <span className="text-xs">
                                (saved {timeSinceSave}s ago)
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSaveDialogMode('rename');
                                setSaveFileName(currentFileName);
                                setSaveDialogInitialValue(currentFileName);
                                setShowSaveDialog(true);
                            }}
                            className="h-6 w-6 p-0 ml-1"
                            title="Rename file"
                        >
                            <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDeleteFile}
                            className="h-6 w-6 p-0 ml-1 text-destructive hover:text-destructive"
                            title="Delete file"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                    {/* Activate Live Editor Button - Show when closed and not dismissed, next to New button */}
                    {isClosed && !isActivateButtonDismissed && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                                setIsClosed(false);
                                setIsActivateButtonDismissed(false);
                                setActivateButtonDismissed(false);
                            }}
                            className="gap-2 bg-primary hover:bg-primary/90"
                            title="Activate Live Editor"
                        >
                            <Edit3 className="w-4 h-4" />
                            <span className="hidden sm:inline">Activate</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNewFile}
                        className="gap-2"
                        title="Create new file"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleImport}
                        className="gap-2"
                        title="Import markdown file"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Import</span>
                    </Button>
                    <Button
                        variant={currentFileName ? (autoSaveEnabled ? "default" : "outline") : "outline"}
                        size="sm"
                        onClick={handleSave}
                        disabled={!markdown.trim() || !!(currentFileName && autoSaveEnabled)}
                        className="gap-2"
                        title={currentFileName ? (autoSaveEnabled ? "Auto-save enabled (file saves automatically)" : "Save file") : "Save as new file"}
                    >
                        <Save className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            {currentFileName 
                                ? (autoSaveEnabled ? "Auto Save" : "Save") 
                                : "Save As"}
                        </span>
                        {currentFileName && autoSaveEnabled && (
                            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" title="Auto-saving enabled" />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={!markdown.trim()}
                        className="gap-2"
                        title="Export markdown to file"
                    >
                        <FileDown className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {showSaveDialog && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            const isEditMode = saveDialogMode === 'rename';
                            const hasChanges = saveFileName !== saveDialogInitialValue;
                            if (isEditMode && hasChanges) {
                                return;
                            }
                            setShowSaveDialog(false);
                            setSaveFileName("");
                            setSaveDialogInitialValue("");
                            setPendingNewFile(false);
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3">
                            {saveDialogMode === 'rename' ? (
                                <Pencil className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            ) : saveDialogMode === 'new' ? (
                                <Plus className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            ) : (
                                <Save className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                            <h3 className="font-semibold text-primary mb-1">
                                {saveDialogMode === 'rename' ? 'Rename File' : saveDialogMode === 'new' ? 'Save Current File' : 'Save File'}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {saveDialogMode === 'rename' 
                                    ? 'Enter a new filename for this file.'
                                    : saveDialogMode === 'new' 
                                    ? 'Please save your current file before creating a new one.'
                                    : 'Enter a filename to save your markdown content.'}
                            </p>
                                <input
                                    type="text"
                                    placeholder="Enter filename (without .md)"
                                    value={saveFileName}
                                    onChange={(e) => setSaveFileName(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            handleSaveConfirm();
                        } else if (e.key === "Escape") {
                            setShowSaveDialog(false);
                            setSaveFileName("");
                            setSaveDialogInitialValue("");
                            setPendingNewFile(false);
                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    autoFocus
                                />
                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleSaveConfirm}
                                        className="w-full"
                                    >
                                        {saveDialogMode === 'rename' ? 'Rename' : 'Save'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowSaveDialog(false);
                                            setSaveFileName("");
                                            setSaveDialogInitialValue("");
                                            setPendingNewFile(false);
                                        }}
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
            
            {/* Sticky Controls Bar */}
            {!isClosed && (
                <div className={`sticky top-4 z-40 flex items-center bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-all overflow-hidden ${
                    isCollapsed ? 'px-2 py-2 w-auto ml-auto' : `${isMobile ? 'px-2 py-2 gap-1.5' : 'px-2 sm:px-4 py-2 sm:py-3 gap-2'}`
                }`}>
                    {!isCollapsed && (
                        <>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 whitespace-nowrap">
                                    Live Editor
                                </h1>
                            </div>
                            <div className={`flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-x-auto ${!isMobile ? 'justify-end' : ''}`}>
                                {/* Theme Toggle - Only show when navbar is scrolled out of view */}
                                {showThemeToggle && (
                                    <div className="flex items-center flex-shrink-0">
                                        <ThemeToggle />
                                    </div>
                                )}
                                {/* Scroll to Top Button - Only show when navbar is scrolled out of view */}
                                {showThemeToggle && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            window.scrollTo({
                                                top: 0,
                                                behavior: 'smooth'
                                            });
                                        }}
                                        className="h-8 w-8 p-0 flex-shrink-0"
                                        title="Scroll to top"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </Button>
                                )}
                                {/* Share Button */}
                                <Button
                                    variant={shareUrl ? "default" : "default"}
                                    size="sm"
                                    onClick={shareUrl ? handleCopyShareUrl : handleShare}
                                    disabled={isSharing || !markdown.trim()}
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    title={shareUrl ? (copied ? "Copied!" : "Copy share link") : (isSharing ? "Sharing..." : "Share")}
                                >
                                    {shareUrl ? (
                                        copied ? (
                                            <Check className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )
                                    ) : (
                                        <Share2 className="w-4 h-4" />
                                    )}
                                </Button>
                                {/* Desktop solo mode toggle - only visible on large screens */}
                                <div className="hidden md:flex gap-2 border rounded-lg p-1 bg-muted/50">
                                    <Button
                                        variant={soloMode === "both" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("both");
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Split View"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={soloMode === "editor" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("editor");
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Editor Only"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={soloMode === "preview" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("preview");
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Preview Only"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                                {/* Mobile solo mode toggle - show editor and preview only (no duo mode) */}
                                <div className="flex md:hidden gap-2 border rounded-lg p-1 bg-muted/50">
                                    <Button
                                        variant={soloMode === "editor" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("editor");
                                            setIsPreview(false);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Editor Only"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={soloMode === "preview" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("preview");
                                            setIsPreview(true);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Preview Only"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                                {/* Control buttons group - styled like mode buttons (same for all screen sizes) */}
                                <div className="flex gap-2 border rounded-lg p-1 bg-muted/50">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsCollapsed(!isCollapsed);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Collapse"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsClosed(true);
                                            // Reset dismiss state when closing so activate button shows
                                            setIsActivateButtonDismissed(false);
                                            setActivateButtonDismissed(false);
                                            toast.info("Live Editor closed. Use the activate button to get it back.", {
                                                duration: 5000,
                                            });
                                        }}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        title="Close Live Editor"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                    {/* Collapse/Expand Button - Always visible when collapsed, on the right */}
                    {isCollapsed && (
                        <div className="flex gap-2 border rounded-lg p-1 bg-muted/50">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsCollapsed(!isCollapsed);
                                }}
                                className="gap-2 h-8"
                                title="Expand"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Content */}
            <div className={`grid gap-6 ${
                soloMode === "both" 
                    ? "flex-1 grid-cols-1 md:grid-cols-2 min-h-[600px]" 
                    : "grid-cols-1"
            }`}>
                {/* Editor Section */}
                <div 
                    data-editor-section
                    className={`flex flex-col gap-2 ${
                        soloMode === "both" ? "h-full" : ""
                    } ${
                        // Mobile (< md): show based on isPreview state
                        isPreview ? "hidden md:flex" : "flex"
                    } ${
                        // Desktop (>= md): show based on soloMode state
                        soloMode === "preview" ? "md:hidden" : ""
                    }`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                        <Edit3 className="w-4 h-4" /> Editor
                    </div>
                    <Card className={`p-0 border-primary/20 shadow-lg bg-background/50 backdrop-blur-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all ${
                        soloMode === "both" && typeof window !== 'undefined' && window.innerWidth >= 768 ? "flex-1 overflow-hidden" : ""
                    }`}>
                        {soloMode === "both" && typeof window !== 'undefined' && window.innerWidth >= 768 && !isPreview ? (
                            // Split view on desktop (md and above) - use scroll container
                            <div ref={editorRef} className="h-full overflow-y-auto">
                                <textarea
                                    value={markdown}
                                    onChange={(e) => setMarkdown(e.target.value)}
                                    className="w-full p-6 resize-none bg-transparent border-none focus:ring-0 font-mono text-sm leading-relaxed outline-none block"
                                    placeholder="Type your markdown here..."
                                    spellCheck={false}
                                    style={{ 
                                        minHeight: '100%',
                                        height: 'auto',
                                        overflow: 'hidden'
                                    }}
                                />
                            </div>
                        ) : (
                            // Solo editor mode OR mobile/small screens - expand naturally
                            <textarea
                                ref={soloTextareaRef}
                                value={markdown}
                                onChange={(e) => {
                                    setMarkdown(e.target.value);
                                    // Auto-resize textarea to fit content
                                    const textarea = e.target as HTMLTextAreaElement;
                                    textarea.style.height = 'auto';
                                    textarea.style.height = `${textarea.scrollHeight}px`;
                                }}
                                className="w-full p-6 resize-none bg-transparent border-none focus:ring-0 font-mono text-sm leading-relaxed outline-none block"
                                placeholder="Type your markdown here..."
                                spellCheck={false}
                                style={{ 
                                    minHeight: '600px',
                                    overflow: 'visible',
                                    display: 'block'
                                }}
                            />
                        )}
                    </Card>
                </div>

                {/* Preview Section */}
                <div 
                    data-preview-section
                    className={`flex flex-col gap-2 ${
                        soloMode === "both" ? "h-full" : ""
                    } ${
                        // Mobile (< md): show based on isPreview state
                        !isPreview ? "hidden md:flex" : "flex"
                    } ${
                        // Desktop (>= md): show based on soloMode state
                        soloMode === "editor" ? "md:hidden" : ""
                    }`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                        <Eye className="w-4 h-4" /> Preview
                    </div>
                    <Card className={`p-6 overflow-hidden border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm ${
                        soloMode === "both" ? "flex-1" : ""
                    }`}>
                        <div ref={soloMode === "both" ? previewRef : undefined} className={`overflow-y-auto ${
                            soloMode === "both" ? "h-full" : "min-h-[600px]"
                        }`}>
                            <article className="markdown-body">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code(props) {
                                        const { children, className, ...rest } = props;
                                        const match = /language-(\w+)/.exec(className || "");
                                        const language = match ? match[1] : "";
                                        const inline = !match;
                                        return !inline && language ? (
                                            <SyntaxHighlighter
                                                style={resolvedTheme === "dark" ? githubDarkTheme : ghcolors}
                                                language={language}
                                                PreTag="div"
                                                customStyle={{
                                                    margin: 0,
                                                    borderRadius: "6px",
                                                    backgroundColor: resolvedTheme === "dark" ? "#161b22" : undefined,
                                                }}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={className} {...rest}>
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {markdown}
                            </ReactMarkdown>
                        </article>
                        </div>
                    </Card>
                </div>
            </div>

            {showDeleteWarning && currentFileName && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDeleteWarning(false);
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1 text-destructive">
                                    Delete File
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Are you sure you want to delete <span className="font-medium text-foreground truncate block" title={`${currentFileName}.md`}>{currentFileName}.md</span>?
                                </p>
                                <p className="text-sm font-medium text-destructive">
                                    This action cannot be undone!
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteWarning(false)}
                                className="h-6 w-6 p-0 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                className="gap-2 w-full"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowDeleteWarning(false)}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
}
