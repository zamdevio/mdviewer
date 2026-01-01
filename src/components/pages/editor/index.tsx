"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getApiConfigStatus } from "@/lib/config";
import { toast } from "sonner";
import { getSettings, onStorageChange, getActivateButtonDismissed, setActivateButtonDismissed, getEditingFileFromSavedFiles, clearAllEditingFlags, setFileAsEditing } from "@/lib/storage";
import { getShowDefaultContent, getTempFile, clearTempFile } from "@/lib/storage/helpers";
import {
    getInitialEditorState,
    saveFile as saveFileToStorage,
    loadFile as loadFileFromStorage,
    createNewFile as createNewFileState,
    createNewFileFromUrl,
    hasUnsavedContent,
    isContentEmpty,
    saveTempFile,
    getSuggestedFilename,
    DEFAULT_MARKDOWN,
    // URL helpers
    cleanEditorUrl,
    // Handler functions
    handleShare as handleShareLogic,
    getSaveAction,
    handleSaveConfirm as handleSaveConfirmLogic,
    getNewFileAction,
    getDeleteFileAction,
    handleDeleteConfirm as handleDeleteConfirmLogic,
    getImportFileAction,
    processImportFile,
    handleExportFile,
    handleLoadSharedContent as handleLoadSharedContentLogic,
    handleLoadFileConfirm as handleLoadFileConfirmLogic,
    saveFileWithState,
    type EditorState,
} from "@/lib/editor";
import { usePlatform } from "@/hooks/use-platform";
import { ScrollManager, type SoloMode } from "@/lib/scroll";

// Import extracted components
import { EditorControls } from "./EditorControls";
import { EditorSection } from "./EditorSection";
import { PreviewSection } from "./PreviewSection";
import { FileActionsBar } from "./FileActionsBar";
import { ApiWarningDialog } from "./dialogs/ApiWarning";
import { LoadFileDialog } from "./dialogs/LoadFile";
import { LoadSharedContentDialog } from "./dialogs/LoadSharedContent";
import { SaveDialog } from "./dialogs/Save";
import { EmptySaveDialog } from "./dialogs/EmptySave";
import { DeleteWarningDialog } from "./dialogs/DeleteWarning";
import { SharePanel } from "./dialogs/Share";

export default function EditorPage() {
    const { isMobile } = usePlatform();

    // Initialize editor state
    const [editorState, setEditorState] = useState<EditorState>(() => getInitialEditorState());
    const { markdown, currentFileName, currentFileId, isUntitled, isForked } = editorState;

    // Update markdown state when editorState changes
    // Also track cursor position for auto-focus restoration
    const updateMarkdown = (newMarkdown: string) => {
        setEditorState(prev => ({ ...prev, markdown: newMarkdown }));
        
        // Store cursor position when markdown changes
        if (textareaRef.current) {
            lastCursorPositionRef.current = textareaRef.current.selectionStart;
        }
    };

    // Track cursor position even when just moving cursor (not typing)
    const trackCursorPosition = useCallback(() => {
        if (textareaRef.current) {
            lastCursorPositionRef.current = textareaRef.current.selectionStart;
        }
    }, []);
    const [isPreview, setIsPreview] = useState(false);
    const [soloMode, setSoloMode] = useState<SoloMode>("both");

    // Computed mode: apply mobile fallback (split -> editor on mobile) but use current soloMode (user can change freely)
    // soloMode is the actual current view mode (can be changed by user via buttons, independent of settings)
    // defaultEditorMode is just the setting value (for reference, doesn't restrict user)
    const effectiveMode: SoloMode = (isMobile && soloMode === 'both') ? 'editor' : soloMode;
    const [mounted, setMounted] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [showSharePanel, setShowSharePanel] = useState(false);
    const [lastSharedContent, setLastSharedContent] = useState<string | null>(null);
    const [lastSharedFileName, setLastSharedFileName] = useState<string | null>(null);
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
    const [pendingImport, setPendingImport] = useState(false);
    const [saveDialogInitialValue, setSaveDialogInitialValue] = useState("");
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [showEmptySaveDialog, setShowEmptySaveDialog] = useState(false);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);
    const [showEditorStatusBar, setShowEditorStatusBar] = useState(true);
    const [showSpellChecker, setShowSpellChecker] = useState(true);
    const [isSpellCheckActive, setIsSpellCheckActive] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [timeSinceSave, setTimeSinceSave] = useState<number>(0);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'unsaved'>('idle');
    const [lastSavedContent, setLastSavedContent] = useState<string>('');
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoRenameTimerRef = useRef<NodeJS.Timeout | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastCursorPositionRef = useRef<number>(0);

    // Focus on editor function - used by split and edit-only buttons
    // Restores cursor position and scrolls to cursor
    const focusOnEditor = () => {
        if (textareaRef.current) {
            const textarea = textareaRef.current;
            const cursorPos = lastCursorPositionRef.current;
            
            // Focus the textarea
            textarea.focus();
            
            // Restore cursor position
            if (cursorPos >= 0 && cursorPos <= textarea.value.length) {
                textarea.setSelectionRange(cursorPos, cursorPos);
                
                // Scroll cursor into view
                const textBeforeCursor = textarea.value.substring(0, cursorPos);
                const textareaLineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
                const linesBeforeCursor = textBeforeCursor.split('\n').length;
                const scrollTop = (linesBeforeCursor - 1) * textareaLineHeight;
                
                // Scroll to cursor position
                textarea.scrollTop = Math.max(0, scrollTop - textarea.clientHeight / 2);
            } else {
                // Fallback: scroll into view if needed
                textarea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    };

    // Scroll Manager - handles all scroll logic
    const scrollManagerRef = useRef<ScrollManager | null>(null);

    // Initialize scroll manager
    useEffect(() => {
        if (!mounted) return;

        if (!scrollManagerRef.current) {
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
            (scrollManagerRef.current as ScrollManager).config.effectiveMode = effectiveMode;
        }
    }, [mounted, effectiveMode]);

    // Auto-focus editor when switching to editor-only or split mode
    useEffect(() => {
        if (!mounted || !textareaRef.current) return;
        
        // Only auto-focus when switching to editor or both mode (not preview)
        if (effectiveMode === 'editor' || effectiveMode === 'both') {
            // Small delay to ensure DOM is ready after mode change
            const timeoutId = setTimeout(() => {
                focusOnEditor();
            }, 100);
            
            return () => clearTimeout(timeoutId);
        }
    }, [effectiveMode, mounted]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Load default editor mode from settings on mount and apply mobile fallback
    // After mount, user can freely change view mode via buttons (session-only)
    useEffect(() => {
        if (!mounted) return;

        const settings = getSettings();
        const savedMode = settings?.defaultEditorMode ?? 'both';
        setSoloMode(savedMode as SoloMode);

        // Apply mobile fallback: if split mode is set but we're on mobile, use editor
        // But keep the actual setting value intact
        if (isMobile && savedMode === 'both') {
            setSoloMode('editor');
        } else {
            // Use the actual setting value
            setSoloMode(savedMode as SoloMode);
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

        // Use hasUnsavedContent which treats DEFAULT_MARKDOWN as empty
        if (loadId && hasUnsavedContent(markdown)) {
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
            setLastSavedContent(loadedState.markdown);
            setSaveStatus('idle');

            // Set editing mode AFTER all checks are done (temp content cleared, file loaded successfully)
            // This ensures editing mode is only set for real files, not temp content
            setFileAsEditing(fileId);

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

        // Use handler logic
        const result = handleLoadFileConfirmLogic(saveCurrent);

        if (result.savedFilename) {
            toast.success(`Current content saved as ${result.savedFilename}.md`);
        }

        if (result.shouldLoad) {
            await loadFileContentByFileId(fileId, '', false, false);
        } else if (result.error) {
            toast.error(result.error);
            return;
        }

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
            // Temp file exists - clear editing mode so files page doesn't show temp content as editing
            // Temp content is not a real saved file, so it shouldn't be marked as editing
            clearAllEditingFlags();

            // Use temp content and don't load editing file
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
                    setLastSavedContent(newState.markdown);
                    setSaveStatus('idle');
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


    // Load shared content
    const handleLoadSharedContent = async (shareId: string, saveCurrent: boolean) => {
        setLoadingSharedContent(true);

        try {
            const result = await handleLoadSharedContentLogic(
                shareId,
                saveCurrent,
                editorState,
                markdown,
                lastSavedContent,
                saveStatus,
                currentFileName
            );

            if (!result.success) {
                toast.error(result.error || "Failed to load shared content");
                setLoadingSharedContent(false);
                return;
            }

            if (result.newState) {
                setEditorState(result.newState);
                setLastSavedContent('');
                setSaveStatus('unsaved');

                // Reset undo/redo history
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.value = '';
                        textareaRef.current.value = result.newState!.markdown;
                    }
                }, 0);

                toast.success("Shared content loaded! Please save with a filename to share or save again.");

                // Clean URL
                cleanEditorUrl();

                // Close dialog
                setShowLoadDialog(false);
                setLoadShareId(null);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load shared content");
        } finally {
            setLoadingSharedContent(false);
        }
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
            setSaveStatus('saving');

            setTimeout(() => {
                if (currentFileName && currentFileId) {
                    // File is open, save to file (only if content is not empty)
                    if (markdown.trim()) {
                        const result = saveFileToStorage(currentFileName, markdown, currentFileId);
                        if (result.success) {
                            setLastSaved(new Date());
                            setLastSavedContent(markdown);
                            setSaveStatus('saved');
                            // Update state with file ID if it was generated
                            if (result.file && result.file.id !== currentFileId) {
                                setEditorState(prev => ({ ...prev, currentFileId: result.file!.id }));
                            }
                        } else {
                            setSaveStatus('idle');
                        }
                    } else {
                        setSaveStatus('idle');
                    }
                } else {
                    // No file open, handle temp file
                    if (markdown.trim()) {
                        // Save to temp file if content exists
                        try {
                            saveTempFile(markdown);
                            // Clear editing mode when saving to temp file
                            // Temp content is not a real saved file, so it shouldn't be marked as editing
                            clearAllEditingFlags();
                            setLastSaved(new Date());
                            setLastSavedContent(markdown);
                            setSaveStatus('saved');
                        } catch (error) {
                            toast.error(`Error saving temp file: ${error instanceof Error ? error.message : 'Unknown error'}`);
                            setSaveStatus('idle');
                        }
                    } else {
                        // Clear temp file if content is empty
                        try {
                            clearTempFile();
                            // Clear editing mode when clearing temp file (no content = no editing file)
                            clearAllEditingFlags();
                            setLastSavedContent('');
                            setSaveStatus('idle');
                        } catch (error) {
                            toast.error("Error clearing temp file: " + (error instanceof Error ? error.message : "Unknown error"));
                            setSaveStatus('idle');
                        }
                    }
                }

                // Return to idle after showing 'saved' for a bit
                setTimeout(() => setSaveStatus('idle'), 2000);
            }, 300); // Small artificial delay to show "saving" state

            autoSaveTimerRef.current = null;
        }, 2000); // Save every 2 seconds

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
                autoSaveTimerRef.current = null;
            }
        };
    }, [markdown, mounted, autoSaveEnabled, currentFileName, currentFileId]);

    // Check for unsaved changes
    useEffect(() => {
        if (!mounted || saveStatus === 'saving' || saveStatus === 'saved') return;

        // If we have a saved file and content differs, mark as unsaved
        if (currentFileName && currentFileId) {
            if (markdown !== lastSavedContent && lastSavedContent !== '') {
                // Only mark as unsaved if we have a saved baseline to compare against
                setSaveStatus('unsaved');
            } else if (saveStatus === 'unsaved' && markdown === lastSavedContent) {
                // Content matches saved, but status was unsaved - reset to idle
                setSaveStatus('idle');
            }
        } else if (lastSavedContent && lastSavedContent !== '') {
            // No file open but we have saved content (temp file)
            if (markdown !== lastSavedContent) {
                setSaveStatus('unsaved');
            } else if (saveStatus === 'unsaved' && markdown === lastSavedContent) {
                setSaveStatus('idle');
            }
        } else if (!currentFileName && !lastSavedContent && markdown.trim()) {
            // New content with no saved baseline - show as unsaved
            setSaveStatus('unsaved');
        } else if (!currentFileName && !lastSavedContent && !markdown.trim()) {
            // Empty content with no saved baseline - show as idle
            if (saveStatus === 'unsaved') {
                setSaveStatus('idle');
            }
        }
    }, [markdown, lastSavedContent, currentFileName, currentFileId, saveStatus, mounted]);

    // Clear share URL when content or filename changes to allow sharing updated version
    // This prevents re-uploading the same content and ensures users can share their latest changes
    useEffect(() => {
        if (!mounted || !shareUrl) return;

        // Only clear if content or filename has actually changed from what was last shared
        // This prevents unnecessary clearing and allows re-sharing the same content
        const contentChanged = lastSharedContent !== null && lastSharedContent !== markdown;
        const filenameChanged = lastSharedFileName !== null && lastSharedFileName !== currentFileName;

        if (contentChanged || filenameChanged) {
            // User made changes - clear share URL so they can share the updated version
            setShareUrl(null);
            setShowSharePanel(false);
            setLastSharedContent(null);
            setLastSharedFileName(null);
        }
    }, [markdown, currentFileName, mounted, shareUrl, lastSharedContent, lastSharedFileName]);

    // Save temp file on unmount if there's unsaved content
    useEffect(() => {
        return () => {
            // Save temp file on component unmount if there's unsaved content
            if (!currentFileName && markdown.trim()) {
                try {
                    saveTempFile(markdown);
                } catch (error) {
                    toast.error("Error saving temp file on unmount: " + (error instanceof Error ? error.message : "Unknown error"));
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
    }, [markdown, mounted, isUntitled, currentFileName]);

    // Load settings for auto-save and keyboard shortcuts
    useEffect(() => {
        if (!mounted) return;

        const settings = getSettings();
        if (settings) {
            setAutoSaveEnabled(settings.autoSave ?? true);
            setKeyboardShortcutsEnabled(settings.keyboardShortcuts ?? true);
            setShowEditorStatusBar(settings.showEditorStatusBar ?? true);
            setShowSpellChecker(settings.showSpellChecker ?? true);
        }

        // Listen for settings changes
        const unsubscribe = onStorageChange((key) => {
            if (key === 'mdviewer_settings') {
                const updatedSettings = getSettings();
                if (updatedSettings) {
                    setAutoSaveEnabled(updatedSettings.autoSave ?? true);
                    setKeyboardShortcutsEnabled(updatedSettings.keyboardShortcuts ?? true);
                    setShowEditorStatusBar(updatedSettings.showEditorStatusBar ?? true);
                    setShowSpellChecker(updatedSettings.showSpellChecker ?? true);
                }
            }
        });

        return unsubscribe;
    }, [mounted]);

    // Sync spellcheck state with textarea attribute
    useEffect(() => {
        if (!mounted || !textareaRef.current) return;

        const textarea = textareaRef.current;

        // Initialize spellcheck based on setting
        if (showSpellChecker) {
            textarea.spellcheck = true;
            setIsSpellCheckActive(true);
        } else {
            textarea.spellcheck = false;
            setIsSpellCheckActive(false);
        }
    }, [mounted, showSpellChecker]);

    // Monitor textarea spellcheck attribute changes
    useEffect(() => {
        if (!mounted || !textareaRef.current) return;

        const textarea = textareaRef.current;

        // Check spellcheck status periodically and on focus
        const checkSpellCheckStatus = () => {
            if (textarea) {
                setIsSpellCheckActive(textarea.spellcheck);
            }
        };

        // Check on mount
        checkSpellCheckStatus();

        // Check on focus
        textarea.addEventListener('focus', checkSpellCheckStatus);

        // Check periodically (in case it's changed externally)
        const interval = setInterval(checkSpellCheckStatus, 1000);

        return () => {
            textarea.removeEventListener('focus', checkSpellCheckStatus);
            clearInterval(interval);
        };
    }, [mounted, markdown]);

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

                // Check if content is empty before saving (treat DEFAULT_MARKDOWN as normal content for save)
                if (isContentEmpty(markdown, false)) {
                    // Show dialog telling user there's nothing to save
                    setShowEmptySaveDialog(true);
                } else {
                    // Always handle save in editor
                    handleSave();
                }
                return false;
            }

            // Ctrl+N or Cmd+N - New file (prevent browser new window)
            if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                handleNewFile();
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

            // Ctrl+O or Cmd+O - Import markdown file
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                e.stopPropagation();
                handleImport();
                return;
            }

            // Ctrl+/ or Cmd+/ - Cycle through view modes: editor -> preview -> split -> editor (loop)
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                // Cycle: editor -> preview -> split (both) -> editor (loop)
                if (soloMode === 'editor') {
                    setSoloMode('preview');
                } else if (soloMode === 'preview') {
                    setSoloMode('both');
                } else if (soloMode === 'both') {
                    setSoloMode('editor');
                }
                return;
            }

            // Escape - Close dialogs
            if (e.key === 'Escape') {
                if (showSharePanel) {
                    setShowSharePanel(false);
                    return;
                }
                if (showApiWarning) {
                    setShowApiWarning(false);
                    return;
                }
                if (showDeleteWarning) {
                    setShowDeleteWarning(false);
                    return;
                }
                if (showEmptySaveDialog) {
                    setShowEmptySaveDialog(false);
                    return;
                }
                if (showSaveDialog) {
                    setShowSaveDialog(false);
                    setSaveFileName("");
                    setPendingNewFile(false);
                    setPendingImport(false);
                    return;
                }
                if (showLoadDialog) {
                    setShowLoadDialog(false);
                    setLoadShareId(null);
                    return;
                }
                if (showLoadFileDialog) {
                    setShowLoadFileDialog(false);
                    setPendingFileId(null);
                    return;
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

    // Check API configuration on mount
    useEffect(() => {
        if (mounted) {
            const apiStatus = getApiConfigStatus();
            if (!apiStatus.isConfigured) {
                setShowApiWarning(true);
            }
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
        // Check if file needs to be saved first (before showing loading)
        if (!currentFileName) {
            toast.info("Please save this content with a filename before sharing");
            setSaveDialogMode('save');
            setPendingNewFile(false);
            setSaveFileName("");
            setSaveDialogInitialValue("");
            setShowSaveDialog(true);
            return;
        }

        setIsSharing(true);
        toast.loading("Sharing your markdown...", { id: "sharing" });

        try {
            const result = await handleShareLogic(markdown, editorState);

            if (result.requiresSave) {
                toast.dismiss("sharing");
                toast.info(result.error || "Please save this content with a filename before sharing");
                setSaveDialogMode('save');
                setPendingNewFile(false);
                setSaveFileName("");
                setSaveDialogInitialValue("");
                setShowSaveDialog(true);
                setIsSharing(false);
                return;
            }

            if (result.shouldShowApiWarning) {
                setShowApiWarning(true);
                toast.warning(result.error || "API not configured", { id: "sharing" });
                setIsSharing(false);
                return;
            }

            if (!result.success) {
                toast.error(result.error || "Failed to share", { id: "sharing" });
                setIsSharing(false);
                return;
            }

            if (result.shareUrl) {
                const url = result.shareUrl;
                setShareUrl(url);
                // Track what was shared so we can detect changes later
                setLastSharedContent(markdown);
                setLastSharedFileName(currentFileName);
                setShowApiWarning(false);
                setShowSharePanel(true);
                toast.success("Share link created!", { id: "sharing" });
            } else {
                toast.success("Shared via Web Share!", { id: "sharing" });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to share", { id: "sharing" });
        } finally {
            setIsSharing(false);
        }
    };


    // Export markdown to file
    const handleExport = async () => {
        const result = handleExportFile(markdown, currentFileName);

        if (result.success) {
            toast.success("Markdown exported!");
        } else {
            toast.error("Failed to export file: " + (result.error || "Unknown error"));
        }
    };

    // Import markdown from file
    const handleImport = () => {
        // Check if can import BEFORE opening file picker (like New button does)
        const action = getImportFileAction(editorState, markdown, lastSavedContent, saveStatus);

        if (!action.canExecute) {
            if (action.infoMessage) {
                toast.info(action.infoMessage);
            } else if (action.warningMessage) {
                toast.warning(action.warningMessage);
            }
            return;
        }

        // If requires save dialog, show it first (user will need to save before importing)
        if (action.requiresDialog && action.dialogType) {
            setSaveDialogMode(action.dialogType);
            setPendingNewFile(false);
            setSaveFileName("");
            setSaveDialogInitialValue("");
            setShowSaveDialog(true);

            // Store a flag to open file picker after save
            setPendingImport(true);
            return;
        }

        // Can proceed directly - open file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt,text/markdown,text/plain';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const result = await processImportFile(file);

            if (result.success && result.newState) {
                setEditorState(result.newState);

                // Reset undo/redo history
                setTimeout(() => {
                    if (textareaRef.current && result.content) {
                        textareaRef.current.value = '';
                        textareaRef.current.value = result.content;
                    }
                }, 0);
                toast.success("File imported successfully!");
            } else if (result.success && result.content) {
                // If save failed, just set the content
                setEditorState(prev => ({ ...prev, markdown: result.content! }));

                // Reset undo/redo history
                setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.value = '';
                        textareaRef.current.value = result.content!;
                    }
                }, 0);
                toast.success("File imported successfully!");
            } else {
                toast.error("Failed to import file: " + (result.error || "Unknown error"));
            }
        };
        input.click();
    };

    // Save file function (wrapper for editor.ts saveFile)
    const saveFile = async (filename: string, showToast: boolean = true): Promise<boolean> => {
        setSaveStatus('saving');
        const result = saveFileWithState(filename, markdown, currentFileId);

        if (result.success && result.newState) {
            setEditorState(result.newState);
            if (showToast) {
                toast.success("File saved!");
            }
            if (result.lastSaved) {
                setLastSaved(result.lastSaved);
            }
            if (result.lastSavedContent) {
                setLastSavedContent(result.lastSavedContent);
            }
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
            return true;
        } else {
            setSaveStatus('idle');
            if (showToast) {
                toast.error(result.error || "Failed to save file");
            }
            return false;
        }
    };

    // Handle new file button click
    const handleNewFile = () => {
        const action = getNewFileAction(editorState, markdown, lastSavedContent, saveStatus);

        if (!action.canExecute) {
            if (action.infoMessage) {
                toast.info(action.infoMessage);
            } else if (action.warningMessage) {
                toast.warning(action.warningMessage);
            }
            return;
        }

        if (action.requiresDialog && action.dialogType) {
            setSaveDialogMode(action.dialogType);
            setPendingNewFile(action.dialogType === 'new');
            setSaveFileName("");
            setSaveDialogInitialValue("");
            setShowSaveDialog(true);
            return;
        }

        // Proceed to create new file
        if (action.newState) {
            // Clear editing mode when creating new file - new file is not a saved file yet
            // This ensures files page doesn't show new/unsaved content as currently editing
            clearAllEditingFlags();

            setEditorState(action.newState);
            setLastSavedContent(action.newState.markdown);
            setSaveStatus('idle');
            // Reset undo/redo history
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.value = action.newState!.markdown;
                }
            }, 0);
            toast.success("New file created");
        }
    };

    // Handle delete file
    const handleDeleteFile = () => {
        const action = getDeleteFileAction(currentFileName);
        if (action.canExecute && action.requiresDialog) {
            setShowDeleteWarning(true);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!currentFileName || !currentFileId) return;
        setShowDeleteWarning(false);

        const result = handleDeleteConfirmLogic(currentFileName, currentFileId);

        if (result.success && result.newState) {
            setEditorState(result.newState);
            setLastSavedContent(result.newState.markdown);
            setSaveStatus('idle');
            // Reset undo/redo history
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.value = '';
                    textareaRef.current.value = result.newState!.markdown;
                }
            }, 0);
            setShareUrl(null);
            setLastSaved(null);
            toast.success("File deleted");
        } else {
            toast.error(result.error || "Failed to delete file");
        }
    };


    // Handle save button click
    const handleSave = async () => {
        const action = getSaveAction(editorState, markdown, isForked);

        if (!action.canExecute) {
            if (action.infoMessage) {
                setShowEmptySaveDialog(true);
            }
            return;
        }

        if (action.requiresDialog && action.dialogType) {
            setSaveDialogMode(action.dialogType);
            setPendingNewFile(false);
            setSaveFileName("");
            setSaveDialogInitialValue("");
            setShowSaveDialog(true);
            if (action.infoMessage) {
                toast.info(action.infoMessage);
            }
            return;
        }

        // File already exists, just save it
        if (currentFileName) {
            await saveFile(currentFileName);
        }
    };

    // Handle save dialog confirm
    const handleSaveConfirm = async () => {
        const result = handleSaveConfirmLogic(
            saveFileName,
            saveDialogMode,
            markdown,
            currentFileId
        );

        if (!result.success) {
            toast.error(result.error || "Failed to save");
            return;
        }

        if (result.newState) {
            setEditorState(result.newState);
            if (result.lastSavedContent) {
                setLastSavedContent(result.lastSavedContent);
            }
            setSaveStatus('idle');
        }

        // Always close dialog after save attempt
        setShowSaveDialog(false);
        setSaveFileName("");
        setSaveDialogInitialValue("");

        if (saveDialogMode === 'rename') {
            toast.success("File renamed");
        } else if (result.success) {
            // State is already updated in saveFile function

            // If this was for creating a new file, clear and create new
            if (pendingNewFile) {
                setPendingNewFile(false);
                // Small delay to show save success, then create new
                setTimeout(() => {
                    // Clear editing mode when creating new file after save
                    // New file is not saved yet, so it shouldn't be marked as editing
                    clearAllEditingFlags();

                    const newState = createNewFileState();
                    setEditorState(newState);
                    toast.success("New file created");
                }, 500);
            } else if (pendingImport) {
                // If this was for importing, trigger import file picker after save
                setPendingImport(false);
                // Small delay to show save success, then open file picker
                setTimeout(() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.md,.txt,text/markdown,text/plain';
                    input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;

                        const importResult = await processImportFile(file);

                        if (importResult.success && importResult.newState) {
                            setEditorState(importResult.newState);

                            // Reset undo/redo history
                            setTimeout(() => {
                                if (textareaRef.current && importResult.content) {
                                    textareaRef.current.value = '';
                                    textareaRef.current.value = importResult.content;
                                }
                            }, 0);
                            toast.success("File imported successfully!");
                        } else if (importResult.success && importResult.content) {
                            // If save failed, just set the content
                            setEditorState(prev => ({ ...prev, markdown: importResult.content! }));

                            // Reset undo/redo history
                            setTimeout(() => {
                                if (textareaRef.current) {
                                    textareaRef.current.value = '';
                                    textareaRef.current.value = importResult.content!;
                                }
                            }, 0);
                            toast.success("File imported successfully!");
                        } else {
                            toast.error("Failed to import file: " + (importResult.error || "Unknown error"));
                        }
                    };
                    input.click();
                }, 500);
            }
        } else {
            // Save failed, clear pending flags
            if (pendingNewFile) {
                setPendingNewFile(false);
            }
            if (pendingImport) {
                setPendingImport(false);
            }
        }
    };

    // Load file from files page (this function is not used anymore, files page uses setFileAsEditing)
    // Keeping for backward compatibility but it's handled by the storage listener

    if (!mounted) return null;

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-200px)] flex flex-col gap-4 animate-fade-in">
            {/* API Configuration Warning */}
            <ApiWarningDialog show={showApiWarning} onClose={() => setShowApiWarning(false)} />

            <LoadFileDialog
                show={showLoadFileDialog}
                pendingFileId={pendingFileId}
                onSaveAndLoad={() => handleLoadFileConfirm(true)}
                onLoadWithoutSaving={() => handleLoadFileConfirm(false)}
                onCancel={() => {
                    setShowLoadFileDialog(false);
                    setPendingFileId(null);
                    const url = new URL(window.location.href);
                    url.searchParams.delete('file');
                    window.history.replaceState({}, '', url.toString());
                }}
            />

            <LoadSharedContentDialog
                show={showLoadDialog}
                loadShareId={loadShareId}
                loading={loadingSharedContent}
                onSaveAndLoad={() => loadShareId && handleLoadSharedContent(loadShareId, true)}
                onLoadWithoutSaving={() => loadShareId && handleLoadSharedContent(loadShareId, false)}
                onCancel={() => {
                    setShowLoadDialog(false);
                    setLoadShareId(null);
                    const url = new URL(window.location.href);
                    url.searchParams.delete('load');
                    window.history.replaceState({}, '', url.toString());
                }}
            />

            {/* Import/Export/Save Buttons - Outside Live Editor */}
            <FileActionsBar
                currentFileName={currentFileName}
                markdown={markdown}
                autoSaveEnabled={autoSaveEnabled}
                onRename={() => {
                    setSaveDialogMode('rename');
                    setSaveFileName(currentFileName || '');
                    setSaveDialogInitialValue(currentFileName || '');
                    setShowSaveDialog(true);
                }}
                onDelete={handleDeleteFile}
                onNewFile={handleNewFile}
                onImport={handleImport}
                onSave={handleSave}
                onExport={handleExport}
                isClosed={isClosed}
                isActivateButtonDismissed={isActivateButtonDismissed}
                onActivate={() => {
                    setIsClosed(false);
                    setIsActivateButtonDismissed(false);
                    setActivateButtonDismissed(false);
                }}
            />

            <SaveDialog
                show={showSaveDialog}
                mode={saveDialogMode}
                fileName={saveFileName}
                initialValue={saveDialogInitialValue}
                onChange={setSaveFileName}
                onConfirm={handleSaveConfirm}
                onCancel={() => {
                    setShowSaveDialog(false);
                    setSaveFileName("");
                    setSaveDialogInitialValue("");
                    setPendingNewFile(false);
                    setPendingImport(false);
                }}
            />

            {/* Sticky Controls Bar */}
            <EditorControls
                isClosed={isClosed}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
                showThemeToggle={showThemeToggle}
                markdown={markdown}
                shareUrl={shareUrl}
                isSharing={isSharing}
                effectiveMode={effectiveMode}
                isSpellCheckActive={isSpellCheckActive}
                showSpellChecker={showSpellChecker}
                textareaRef={textareaRef}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                onClose={() => {
                    setIsClosed(true);
                    setIsActivateButtonDismissed(false);
                    setActivateButtonDismissed(false);
                    toast.info("Live Editor closed. Use the activate button to get it back.", {
                        duration: 5000,
                    });
                }}
                onCopyAll={async () => {
                    try {
                        await navigator.clipboard.writeText(markdown);
                        toast.success("All content copied to clipboard!");
                    } catch (err) {
                        toast.error("Failed to copy content: " + (err instanceof Error ? err.message : "Unknown error"));
                    }
                }}
                onShare={handleShare}
                onShowSharePanel={() => setShowSharePanel(true)}
                onSetSoloMode={setSoloMode}
                onSetIsPreview={setIsPreview}
                onFocusEditor={focusOnEditor}
                onToggleSpellCheck={() => {
                    const textarea = textareaRef.current;
                    if (textarea) {
                        const newSpellCheckState = !textarea.spellcheck;
                        textarea.spellcheck = newSpellCheckState;
                        setIsSpellCheckActive(newSpellCheckState);
                        toast.info(
                            newSpellCheckState
                                ? "Spell checker enabled"
                                : "Spell checker disabled",
                            { duration: 2000 }
                        );
                    }
                }}
            />

            {/* Editor Content */}
            <div className={`grid gap-6 ${effectiveMode === "both"
                ? "flex-1 grid-cols-1 md:grid-cols-2 min-h-[600px]"
                : "grid-cols-1"
                }`}>
                <EditorSection
                    markdown={markdown}
                    effectiveMode={effectiveMode}
                    isPreview={isPreview}
                    showEditorStatusBar={showEditorStatusBar}
                    saveStatus={saveStatus}
                    lastSaved={lastSaved}
                    timeSinceSave={timeSinceSave}
                    isAutoSave={autoSaveEnabled}
                    showSpellChecker={showSpellChecker}
                    textareaRef={textareaRef}
                    onMarkdownChange={updateMarkdown}
                    onCursorChange={trackCursorPosition}
                />
                <PreviewSection
                    markdown={markdown}
                    effectiveMode={effectiveMode}
                    isPreview={isPreview}
                    previewRef={previewRef}
                />
            </div>

            <EmptySaveDialog show={showEmptySaveDialog} onClose={() => setShowEmptySaveDialog(false)} />
            <DeleteWarningDialog
                show={showDeleteWarning}
                fileName={currentFileName}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteWarning(false)}
            />
            <SharePanel
                show={showSharePanel}
                shareUrl={shareUrl ?? ''}
                fileName={currentFileName}
                onClose={() => setShowSharePanel(false)}
                onCopy={() => {
                    // Copy handled in SharePanel component
                }}
                onWebShare={() => {
                    setShowSharePanel(false);
                }}
            />
        </div>
    );
}
