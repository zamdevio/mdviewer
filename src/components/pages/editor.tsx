"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, Edit3, LayoutGrid, Share2, Copy, Check, AlertCircle, X, ChevronLeft, ChevronRight, ArrowUp, Download, Loader2, Upload, FileDown, Save, FileText, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import { MarkdownViewer } from "@/components/markdown";
import { uploadMarkdown, fetchSharedMarkdown } from "@/lib/api";
import { isApiConfigured, config } from "@/lib/config";
import { ThemeToggle } from "@/components/theme";
import { toast } from "sonner";
import { getSettings, onStorageChange, getActivateButtonDismissed, setActivateButtonDismissed, addSharedLink, getEditingFileFromSavedFiles, clearAllEditingFlags, updateSetting, type SavedFile, type SharedLink } from "@/lib/storage";
import { getShowDefaultContent, getTempFile, clearTempFile } from "@/lib/storage/helpers";
import { 
    getInitialEditorState, 
    saveFile as saveFileToStorage, 
    loadFile as loadFileFromStorage, 
    createNewFile as createNewFileState, 
    createNewFileFromUrl,
    deleteFile as deleteFileFromStorage,
    renameFile as renameFileInStorage,
    hasUnsavedContent,
    saveTempFile,
    getSuggestedFilename,
    DEFAULT_MARKDOWN,
    type EditorState
} from "@/lib/editor";
import { usePlatform } from "@/hooks/use-platform";
import { shareText } from "@/lib/utils";
import { ScrollManager, type SoloMode } from "@/lib/scroll";

export default function EditorPage() {
    const { isMobile } = usePlatform();

    // Initialize editor state
    const [editorState, setEditorState] = useState<EditorState>(() => getInitialEditorState());
    const { markdown, currentFileName, currentFileId, isUntitled, isForked } = editorState;
    
    // Update markdown state when editorState changes
    const updateMarkdown = (newMarkdown: string) => {
        setEditorState(prev => ({ ...prev, markdown: newMarkdown }));
    };
    const [isPreview, setIsPreview] = useState(false);
    const [soloMode, setSoloMode] = useState<SoloMode>("both");
    const [defaultEditorMode, setDefaultEditorMode] = useState<SoloMode>("both");
    
    // Computed mode: apply mobile fallback (split -> editor on mobile) but use current soloMode (user can change freely)
    // soloMode is the actual current view mode (can be changed by user via buttons, independent of settings)
    // defaultEditorMode is just the setting value (for reference, doesn't restrict user)
    const effectiveMode: SoloMode = (isMobile && soloMode === 'both') ? 'editor' : soloMode;
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
    const [showLoadFileDialog, setShowLoadFileDialog] = useState(false);
    const [pendingFileId, setPendingFileId] = useState<string | null>(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveFileName, setSaveFileName] = useState("");
    const [saveDialogMode, setSaveDialogMode] = useState<'save' | 'new' | 'rename'>('save');
    const [pendingNewFile, setPendingNewFile] = useState(false);
    const [saveDialogInitialValue, setSaveDialogInitialValue] = useState("");
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [showEmptySaveDialog, setShowEmptySaveDialog] = useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [timeSinceSave, setTimeSinceSave] = useState<number>(0);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoRenameTimerRef = useRef<NodeJS.Timeout | null>(null);
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Focus on editor function - used by split and edit-only buttons
    const focusOnEditor = () => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            // Scroll into view if needed
            textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    };
    
    // Shared function for auto-resize and scroll handling in editor mode
    const handleEditorModeResize = useCallback(() => {
        if (!textareaRef.current || effectiveMode !== "editor") return;
        
        const textarea = textareaRef.current;
        
        // Get cursor position from ScrollManager if available (lightweight - already tracked)
        const cursorPos = scrollManagerRef.current?.getCursorPosition();
        
        // Save current scroll position BEFORE resize
        const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        
        // Resize the textarea
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
        
        // After resize, check if cursor needs to be scrolled into view
        requestAnimationFrame(() => {
            if (cursorPos) {
                const rect = textarea.getBoundingClientRect();
                const textareaHeight = textarea.offsetHeight; // Actual auto-resized height
                const textareaTop = rect.top + window.scrollY;
                const textareaBottom = textareaTop + textareaHeight;
                const viewportTop = window.scrollY;
                const viewportBottom = viewportTop + window.innerHeight;
                
                // Check if the textarea (with its actual resized height) is visible in viewport
                const isVisible = textareaTop >= viewportTop && textareaBottom <= viewportBottom;
                
                // If textarea is not fully visible, scroll cursor into view (uses built-in method - lightweight)
                if (!isVisible) {
                    // Use built-in scrollIntoView - no heavy calculations needed
                    textarea.scrollIntoView({});
                    return;
                }
            }
            
            // Cursor is aligned or no cursor position, just restore scroll
            window.scrollTo({ 
                top: scrollY, 
                behavior: 'instant' as ScrollBehavior 
            });
        });
    }, [effectiveMode]);
    
    // Scroll Manager - handles all scroll logic
    const scrollManagerRef = useRef<ScrollManager | null>(null);
    
    // Initialize scroll manager
    useEffect(() => {
        if (mounted && !scrollManagerRef.current) {
            scrollManagerRef.current = new ScrollManager({
                textareaRef,
                editorRef,
                previewRef,
                effectiveMode,
                onModeChangeComplete: () => {
                    // Mode change complete callback
                },
            });
        }
        
        // Update scroll manager config when effectiveMode changes
        if (scrollManagerRef.current) {
            (scrollManagerRef.current as any).config.effectiveMode = effectiveMode;
        }
    }, [mounted, effectiveMode]);

    // Auto-resize textarea when switching to editor mode and scroll to cursor if needed
    useEffect(() => {
        if (!mounted || effectiveMode !== "editor" || !textareaRef.current) return;
        
        // Use shared function for resize and scroll handling
        handleEditorModeResize();
    }, [mounted, effectiveMode, handleEditorModeResize]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Load default editor mode from settings on mount and apply mobile fallback
    // After mount, user can freely change view mode via buttons (session-only)
    useEffect(() => {
        if (!mounted) return;
        
        const settings = getSettings();
        const savedMode = settings?.defaultEditorMode ?? 'both';
        setDefaultEditorMode(savedMode);
        
        // Apply mobile fallback: if split mode is set but we're on mobile, use editor
        // But keep the actual setting value intact
        if (isMobile && savedMode === 'both') {
            setSoloMode('editor');
        } else {
            // Use the actual setting value
            setSoloMode(savedMode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]); // Only run on mount - mode changes via buttons are session-only and independent

    // Check for load, new, and file query parameters
    useEffect(() => {
        if (!mounted) return;

        const urlParams = new URLSearchParams(window.location.search);
        const loadId = urlParams.get('load');
        const newParam = urlParams.get('new');
        const fileId = urlParams.get('file');
        
        if (newParam !== null) {
            // Create new file state - this already clears editing flags in createNewFileFromUrl
            const newState = createNewFileFromUrl();
            setEditorState(newState);
            // Ensure editing flags are cleared (no file in editing mode for new file)
            clearAllEditingFlags();
            // Reset undo/redo history
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.value = newState.markdown;
                }
            }, 0);
            // Load auto-save setting from storage
            const settings = getSettings();
            setAutoSaveEnabled(settings?.autoSave ?? true);
            // Remove query param immediately
            const url = new URL(window.location.href);
            url.searchParams.delete('new');
            window.history.replaceState({}, '', url.toString());
            return;
        }
        
        if (fileId) {
            // Check if there's temp content that would be lost
            const tempContent = getTempFile();
            const hasTempContent = tempContent && tempContent.trim();
            
            if (hasTempContent) {
                // Show warning dialog - user has unsaved temp content
                setPendingFileId(fileId);
                setShowLoadFileDialog(true);
            } else {
                // No temp content, load file directly
                loadFileContentByFileId(fileId, '', false);
            }
            
            // Remove query param
            const url = new URL(window.location.href);
            url.searchParams.delete('file');
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
    const loadFileContentByFileId = async (fileId: string, filename: string, isInitialLoad: boolean = false, clearTemp: boolean = true) => {
        // Reset undo/redo history when loading a file
        // Clear temp content when loading a file (only if explicitly requested)
        if (clearTemp) {
            clearTempFile();
        }
        
        // Load auto-save setting from storage
        const settings = getSettings();
        setAutoSaveEnabled(settings?.autoSave ?? true);
        
        const result = loadFileFromStorage(fileId);
        if (result.success && result.state) {
            const loadedState = result.state;
            setEditorState(loadedState);
            // Reset undo/redo history
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.value = loadedState.markdown;
                }
            }, 0);
            if (!isInitialLoad) {
                toast.success("File loaded");
            }
        } else {
            // File not found, reset to default state
            const newState = getInitialEditorState();
            setEditorState(newState);
            // Reset undo/redo history
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.value = newState.markdown;
                }
            }, 0);
            if (!isInitialLoad) {
                toast.error(result.error || "Failed to load file");
            }
        }
    };

    // Handle loading file after user confirms (when temp content exists)
    const handleLoadFileConfirm = async (saveCurrent: boolean) => {
        if (!pendingFileId) return;
        
        const fileId = pendingFileId;
        setPendingFileId(null);
        setShowLoadFileDialog(false);
        
        // Save current temp content if requested
        if (saveCurrent) {
            const tempContent = getTempFile();
            if (tempContent && tempContent.trim()) {
                // Save temp content as a file before loading
                const suggestedName = getSuggestedFilename(tempContent) || 'untitled';
                const result = saveFileToStorage(suggestedName, tempContent, null);
                if (result.success) {
                    toast.success(`Current content saved as ${suggestedName}.md`);
                }
            }
        }
        
        // Clear temp and load file
        clearTempFile();
        await loadFileContentByFileId(fileId, '', false, false); // Don't clear temp again (already cleared)
        
        // Remove query param
        const url = new URL(window.location.href);
        url.searchParams.delete('file');
        window.history.replaceState({}, '', url.toString());
    };

    // Load file marked as editing on mount
    useEffect(() => {
        if (!mounted) return;
        
        // Check for temp file first (unsaved content takes priority)
        const tempContent = getTempFile();
        if (tempContent) {
            // Temp file exists, use it and don't load editing file
            setEditorState({
                markdown: tempContent,
                currentFileName: null,
                currentFileId: null,
                isUntitled: false,
                isForked: false,
            });
            const settings = getSettings();
            setAutoSaveEnabled(settings?.autoSave ?? true);
            return;
        }
        
        // Check for file with editing: true flag
        const editingFileData = getEditingFileFromSavedFiles();
        
        if (editingFileData) {
            // Load the file that is marked as editing
            loadFileContentByFileId(editingFileData.id, editingFileData.filename, true);
        } else {
            // No file marked as editing, use initial state
            const initialState = getInitialEditorState();
            setEditorState(initialState);
            // Load auto-save setting
            const settings = getSettings();
            setAutoSaveEnabled(settings?.autoSave ?? true);
        }
    }, [mounted]);

    // Listen for editing file changes (when loading from files page)
    // Use ref to prevent infinite loops
    const checkingFileRef = useRef(false);
    
    useEffect(() => {
        if (!mounted) return;

        const checkEditingFile = () => {
            // Prevent concurrent checks
            if (checkingFileRef.current) return;
            checkingFileRef.current = true;
            
            try {
                const editingFileData = getEditingFileFromSavedFiles();
                if (editingFileData && editingFileData.id !== currentFileId) {
                    // Editing file changed, load the new file by ID
                    loadFileContentByFileId(editingFileData.id, editingFileData.filename, false);
                } else if (!editingFileData && currentFileId) {
                    // Editing file was cleared, reset to default state
                    const newState = createNewFileState();
                    setEditorState(newState);
                }
            } finally {
                // Use setTimeout to allow state updates to complete
                setTimeout(() => {
                    checkingFileRef.current = false;
                }, 100);
            }
        };

        // Debounce storage change checks to avoid excessive calls
        let checkTimeout: NodeJS.Timeout | null = null;
        
        // Listen for storage changes with debouncing
        const unsubscribe = onStorageChange((key) => {
            // Only check on saved_files changes, ignore other keys
            if (key === 'mdviewer_saved_files') {
                if (checkTimeout) {
                    clearTimeout(checkTimeout);
                }
                checkTimeout = setTimeout(() => {
                    checkEditingFile();
                    checkTimeout = null;
                }, 300); // Debounce by 300ms
            }
        });
        
        // Check when page becomes visible (user navigated back to editor)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Debounce visibility checks too
                if (checkTimeout) {
                    clearTimeout(checkTimeout);
                }
                checkTimeout = setTimeout(() => {
                    checkEditingFile();
                    checkTimeout = null;
                }, 300);
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (checkTimeout) {
                clearTimeout(checkTimeout);
            }
        };
    }, [mounted, currentFileId]);

    // Save current content to file before loading new content
    const saveCurrentContentToFile = async (): Promise<string | null> => {
        const showDefault = getShowDefaultContent();
        if (!markdown.trim() || (showDefault && markdown === DEFAULT_MARKDOWN)) {
            return null;
        }

        // Save to storage with timestamp
        const filename = `saved-${Date.now()}`;
        const result = saveFileToStorage(filename, markdown, null);
        if (result.success && result.file) {
            return result.file.filename;
        }
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
            
            // Clear temp file before loading shared content (prevents showing old temp content)
            clearTempFile();
            
            // Mark as forked (this is new content)
            setEditorState({
                markdown: content,
                currentFileName: null,
                currentFileId: null,
                isUntitled: true,
                isForked: true,
            });
            // Reset undo/redo history
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.value = content;
                }
            }, 0);
            // Auto-save will handle saving this content every 2 seconds if enabled
            
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

    // Auto-save content every 2 seconds (based on autoSaveEnabled setting)
    // Saves to file if file is open, or to temp file if unsaved content
    // Clears temp file if content is empty for 2 seconds
    useEffect(() => {
        if (!mounted || !autoSaveEnabled) {
            return;
        }

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Auto-save every 2 seconds
        autoSaveTimerRef.current = setTimeout(() => {
            if (currentFileName && currentFileId) {
                // File is open, save to file (only if content is not empty)
                if (markdown.trim()) {
                    const result = saveFileToStorage(currentFileName, markdown, currentFileId);
                    if (result.success) {
                        setLastSaved(new Date());
                        // Update state with file ID if it was generated
                        if (result.file && result.file.id !== currentFileId) {
                            setEditorState(prev => ({ ...prev, currentFileId: result.file!.id }));
                        }
                    }
                }
            } else {
                // No file open, handle temp file
                if (markdown.trim()) {
                    // Save to temp file if content exists
                    try {
                        saveTempFile(markdown);
                    } catch (error) {
                        toast.error(`Error saving temp file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                } else {
                    // Clear temp file if content is empty
                    try {
                        clearTempFile();
                    } catch (error) {
                        toast.error(`Error clearing temp file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }
            autoSaveTimerRef.current = null;
        }, 2000); // Save every 2 seconds

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
        };
    }, [markdown, mounted, autoSaveEnabled, currentFileName, currentFileId]);

    // Reset share URL when content changes (user edits after sharing)
    useEffect(() => {
        if (!mounted) return;
        
        if (shareUrl && markdown.trim()) {
            setShareUrl(null);
            setCopied(false);
        }
    }, [markdown, mounted, shareUrl]);

    // Save temp file on unmount if there's unsaved content
    useEffect(() => {
        return () => {
            // Save temp file on component unmount if there's unsaved content
            if (!currentFileName && markdown.trim()) {
                try {
                    saveTempFile(markdown);
                } catch (error) {
                    toast.error(`Error saving temp file on unmount: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        };
    }, [markdown, currentFileName]);

    // Auto-rename and auto-save untitled files based on first 20 chars
    useEffect(() => {
        const showDefault = getShowDefaultContent();
        if (!mounted || !isUntitled || currentFileName !== null || !markdown.trim() || (showDefault && markdown === DEFAULT_MARKDOWN)) {
            return;
        }

        // Check if this is the first line being written
        const firstLine = markdown.trim().split('\n')[0];
        const hasFirstLine = firstLine.length > 0;

        if (!hasFirstLine) return;

        // Clear existing timer
        if (autoRenameTimerRef.current) {
            clearTimeout(autoRenameTimerRef.current);
        }

        // Debounce auto-rename and auto-save (only once per file)
        autoRenameTimerRef.current = setTimeout(() => {
            const suggestedName = getSuggestedFilename(markdown);
            
            if (suggestedName && suggestedName !== 'untitled') {
                // Auto-save with suggested name (only once)
                const result = saveFileToStorage(suggestedName, markdown, null);
                if (result.success && result.file) {
                    setEditorState({
                        markdown,
                        currentFileName: suggestedName,
                        currentFileId: result.file.id,
                        isUntitled: false,
                        isForked: false,
                    });
                }
            }
            autoRenameTimerRef.current = null;
        }, 3000); // Wait 3 seconds after user stops typing (longer to avoid excessive saves)
        
        return () => {
            if (autoRenameTimerRef.current) {
                clearTimeout(autoRenameTimerRef.current);
                autoRenameTimerRef.current = null;
            }
        };
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
                
                // Check if content is empty before saving
                const showDefault = getShowDefaultContent();
                const isEmpty = !markdown.trim() || (showDefault && markdown === DEFAULT_MARKDOWN);
                
                if (isEmpty) {
                    // Show dialog telling user there's nothing to save
                    setShowEmptySaveDialog(true);
                } else {
                    // Always handle save in editor
                    handleSave();
                }
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
                if (showEmptySaveDialog) {
                    setShowEmptySaveDialog(false);
                    return;
                }
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
    }, [mounted, keyboardShortcutsEnabled, soloMode, showSaveDialog, showLoadDialog, showLoadFileDialog, showEmptySaveDialog, markdown]);

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

    // Note: Auto-save is now handled in the unified 2-second timer above
    // This old 30-second timer has been removed - auto-save now works every 2 seconds
    // for both saved files and unsaved content, controlled by autoSaveEnabled setting

    // Setup scroll listeners for continuous scroll position tracking
    useEffect(() => {
        if (!mounted || !scrollManagerRef.current) return;
        
        const cleanup = scrollManagerRef.current.setupScrollListeners();
        return cleanup;
    }, [mounted, soloMode, isPreview, effectiveMode]);

    // Restore scroll positions after mode changes (EXCLUSIVE: only triggers on actual mode change)
    // This effect ONLY runs when soloMode changes, and ScrollManager ensures it only restores on actual changes
    useEffect(() => {
        if (!mounted || !scrollManagerRef.current) return;
        
        // EXCLUSIVE: Only restore scroll when mode actually changes
        // ScrollManager.restoreScroll() has internal checks to prevent restoration during editing
        // It compares previousMode with newMode and returns early if they're the same
        scrollManagerRef.current.restoreScroll(effectiveMode);
    }, [effectiveMode, mounted]); // Restore based on actual layout mode

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
                
                // Clear temp content when importing
                clearTempFile();
                
                // Set current file name from imported file
                const importedFileName = file.name.replace(/\.(md|txt)$/i, '');
                // Save the imported file
                const result = saveFileToStorage(importedFileName, text, null);
                if (result.success && result.file) {
                    setEditorState({
                        markdown: text,
                        currentFileName: importedFileName,
                        currentFileId: result.file.id,
                        isUntitled: false,
                        isForked: false,
                    });
                } else {
                    // If save failed, just set the content
                    setEditorState(prev => ({ ...prev, markdown: text }));
                }
                // Reset undo/redo history
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.value = '';
                        textareaRef.current.value = text;
                    }
                }, 0);
                toast.success("File imported successfully!");
            } catch (error) {
                toast.error("Failed to import file");
            }
        };
        input.click();
    };

    // Save file function (wrapper for editor.ts saveFile)
    const saveFile = async (filename: string, showToast: boolean = true): Promise<boolean> => {
        const result = saveFileToStorage(filename, markdown, currentFileId);
        
        if (result.success && result.file) {
            // Clear temp content after saving
            clearTempFile();
            
            // Update editor state with saved file info
            setEditorState({
                markdown,
                currentFileName: filename,
                currentFileId: result.file.id,
                isUntitled: false,
                isForked: false,
            });
            
            if (showToast) {
                toast.success("File saved!");
            }
            setLastSaved(new Date());
            // Storage event is already dispatched in saveFileToStorage
            return true;
        } else {
            if (showToast) {
                toast.error(result.error || "Failed to save file");
            }
            return false;
        }
    };

    // Check if content is empty
    const isContentEmpty = () => {
        return !markdown.trim();
    };

    // Handle new file button click
    const handleNewFile = () => {
        // Block if content is empty (already have a new empty file)
        if (isContentEmpty()) {
            toast.info("You already have an empty new file open. Add some content first!");
            return;
        }
        
        // Check if there's unsaved content
        if (hasUnsavedContent(markdown)) {
            // If editing a file, save it first
            if (currentFileName) {
                // File is already saved, clear editing flags and create new
                clearAllEditingFlags(); // Clear editing flags (no file in editing mode)
                const newState = createNewFileState();
                setEditorState(newState);
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
            // No content, clear editing flags and create new file with empty content
            clearAllEditingFlags(); // Clear editing flags (no file in editing mode)
            const newState = createNewFileState();
            setEditorState(newState);
            // Reset undo/redo history
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.value = newState.markdown;
                }
            }, 0);
            toast.success("New file created");
        }
    };

    // Handle delete file
    const handleDeleteFile = () => {
        if (!currentFileName) return;
        setShowDeleteWarning(true);
    };

    const handleDeleteConfirm = async () => {
        if (!currentFileName || !currentFileId) return;
        setShowDeleteWarning(false);

        const result = deleteFileFromStorage(currentFileId, `${currentFileName}.md`);
        
        if (result.success) {
                // Clear editor state
            const newState = createNewFileState();
            setEditorState(newState);
            // Reset undo/redo history
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.value = newState.markdown;
                }
            }, 0);
            setShareUrl(null);
            setLastSaved(null);
            toast.success("File deleted");
            // Storage event is dispatched in deleteFileFromStorage
        } else {
            toast.error(result.error || "Failed to delete file");
        }
    };


    // Handle save button click
    const handleSave = async () => {
        // Check if content is empty
        if (isContentEmpty()) {
            // Show dialog telling user there's nothing to save
            setShowEmptySaveDialog(true);
            return;
        }
        
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
            const result = renameFileInStorage(currentFileId, cleanName, markdown);
            
            if (result.success && result.file) {
                // Update editor state
                setEditorState({
                    markdown,
                    currentFileName: cleanName,
                    currentFileId: result.file.id,
                    isUntitled: false,
                    isForked: false,
                });
                setShowSaveDialog(false);
                setSaveFileName("");
                setSaveDialogInitialValue("");
                toast.success("File renamed");
                // Storage event is dispatched in renameFileInStorage
            } else {
                toast.error(result.error || "Failed to rename file");
            }
        } else {
            // Save or new file
            const success = await saveFile(cleanName);
            
            // Always close dialog after save attempt
            setShowSaveDialog(false);
            setSaveFileName("");
            setSaveDialogInitialValue("");
            
            if (success) {
                // State is already updated in saveFile function
                
                // If this was for creating a new file, clear and create new
                if (pendingNewFile) {
                    setPendingNewFile(false);
                    // Small delay to show save success, then create new
                    setTimeout(() => {
                        const newState = createNewFileState();
                        setEditorState(newState);
                        toast.success("New file created");
                    }, 500);
                }
            }
        }
    };

    // Load file from files page (this function is not used anymore, files page uses setFileAsEditing)
    // Keeping for backward compatibility but it's handled by the storage listener

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

            {showLoadFileDialog && pendingFileId && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowLoadFileDialog(false);
                            setPendingFileId(null);
                            const url = new URL(window.location.href);
                            url.searchParams.delete('file');
                            window.history.replaceState({}, '', url.toString());
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg mb-1 text-yellow-600 dark:text-yellow-400">
                                    Unsaved Content Warning
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    You have unsaved content in the editor. Loading this file will replace your current content. Would you like to save it first?
                                </p>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleLoadFileConfirm(true)}
                                        className="gap-2 w-full"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save & Load File
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleLoadFileConfirm(false)}
                                        className="w-full"
                                    >
                                        Load Without Saving
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowLoadFileDialog(false);
                                            setPendingFileId(null);
                                            const url = new URL(window.location.href);
                                            url.searchParams.delete('file');
                                            window.history.replaceState({}, '', url.toString());
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
                        disabled={isContentEmpty()}
                        className="gap-2"
                        title={isContentEmpty() ? "You already have an empty new file open" : "Create new file"}
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
                        disabled={!markdown.trim()}
                        className="gap-2"
                        title={currentFileName ? (autoSaveEnabled ? "Auto-save enabled (file saves automatically every 2 seconds)" : "Save file") : "Save as new file"}
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
                                {/* Copy All Content Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        try {
                                            await navigator.clipboard.writeText(markdown);
                                            toast.success("All content copied to clipboard!");
                                        } catch (err) {
                                            toast.error("Failed to copy content");
                                        }
                                    }}
                                    disabled={!markdown.trim()}
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    title="Copy all content"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
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
                                        variant={effectiveMode === "both" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("both");
                                            setTimeout(focusOnEditor, 100);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Split View"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={effectiveMode === "editor" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("editor");
                                            setTimeout(focusOnEditor, 100);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Editor Only"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={effectiveMode === "preview" ? "default" : "ghost"}
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
                                        variant={effectiveMode === "editor" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("editor");
                                            setIsPreview(false);
                                            setTimeout(focusOnEditor, 100);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Editor Only"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={effectiveMode === "preview" ? "default" : "ghost"}
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
                effectiveMode === "both" 
                    ? "flex-1 grid-cols-1 md:grid-cols-2 min-h-[600px]" 
                    : "grid-cols-1"
            }`}>
                {/* Editor Section */}
                <div 
                    data-editor-section
                    className={`flex flex-col gap-2 ${
                        effectiveMode === "both" ? "h-full" : ""
                    } ${
                        // Mobile (< md): show based on isPreview state
                        isPreview ? "hidden md:flex" : "flex"
                    } ${
                        // Desktop (>= md): show based on effectiveMode state
                        effectiveMode === "preview" ? "md:hidden" : ""
                    }`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                        <Edit3 className="w-4 h-4" /> Editor
                    </div>
                    <Card className={`p-0 border-primary/20 shadow-lg bg-background/50 backdrop-blur-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all ${
                        effectiveMode === "both" && typeof window !== 'undefined' && window.innerWidth >= 768 ? "flex-1 overflow-hidden" : ""
                    }`}>
                        <textarea
                            ref={textareaRef}
                            value={markdown}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                updateMarkdown(newValue);
                                
                                // Auto-resize for editor mode using shared function
                                if (effectiveMode === "editor") {
                                    handleEditorModeResize();
                                }
                                
                                // Track cursor position (but don't trigger scroll during edits)
                                if (scrollManagerRef.current) {
                                    const textarea = e.target as HTMLTextAreaElement;
                                    scrollManagerRef.current.updateCursorPosition({
                                        selectionStart: textarea.selectionStart,
                                        selectionEnd: textarea.selectionEnd,
                                    });
                                }
                            }}
                            onSelect={(e) => {
                                // Track cursor position for scroll-to-cursor
                                if (scrollManagerRef.current) {
                                    const textarea = e.target as HTMLTextAreaElement;
                                    scrollManagerRef.current.updateCursorPosition({
                                        selectionStart: textarea.selectionStart,
                                        selectionEnd: textarea.selectionEnd,
                                    });
                                }
                            }}
                            onKeyUp={(e) => {
                                // Track cursor position on key events
                                if (scrollManagerRef.current) {
                                    const textarea = e.target as HTMLTextAreaElement;
                                    scrollManagerRef.current.updateCursorPosition({
                                        selectionStart: textarea.selectionStart,
                                        selectionEnd: textarea.selectionEnd,
                                    });
                                }
                            }}
                            onClick={(e) => {
                                // Track cursor position on click
                                if (scrollManagerRef.current) {
                                    const textarea = e.target as HTMLTextAreaElement;
                                    scrollManagerRef.current.updateCursorPosition({
                                        selectionStart: textarea.selectionStart,
                                        selectionEnd: textarea.selectionEnd,
                                    });
                                }
                            }}
                            className="w-full p-6 resize-none bg-transparent border-none focus:ring-0 font-mono text-sm leading-relaxed outline-none block"
                            placeholder="Type your markdown here..."
                            spellCheck={false}
                            style={effectiveMode === "both" ? {
                                minHeight: '100%',
                                height: '100%',
                                overflow: 'auto'
                            } : {
                                minHeight: '600px',
                                overflow: 'visible',
                                display: 'block'
                            }}
                        />
                    </Card>
                </div>

                {/* Preview Section */}
                <div 
                    data-preview-section
                    className={`flex flex-col gap-2 ${
                        effectiveMode === "both" ? "h-full" : ""
                    } ${
                        // Mobile (< md): show based on isPreview state
                        !isPreview ? "hidden md:flex" : "flex"
                    } ${
                        // Desktop (>= md): show based on effectiveMode state
                        effectiveMode === "editor" ? "md:hidden" : ""
                    }`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                        <Eye className="w-4 h-4" /> Preview
                    </div>
                    <Card className={`p-6 overflow-hidden border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm ${
                        effectiveMode === "both" ? "flex-1" : ""
                    }`}>
                        <div ref={effectiveMode === "both" ? previewRef : undefined} className={`overflow-y-auto ${
                            effectiveMode === "both" ? "h-full" : "min-h-[600px]"
                        }`}>
                            <MarkdownViewer content={markdown} />
                        </div>
                    </Card>
                </div>
            </div>

            {showEmptySaveDialog && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowEmptySaveDialog(false);
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">
                                    Nothing to Save
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    The editor is empty. There's nothing to save. Add some content first!
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowEmptySaveDialog(false)}
                                className="h-6 w-6 p-0 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                onClick={() => setShowEmptySaveDialog(false)}
                                className="w-full"
                            >
                                Got it
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

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
