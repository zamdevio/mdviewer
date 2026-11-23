
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { 
    Moon, 
    Sun, 
    FileText, 
    Lock, 
    Download, 
    Upload,
    Info,
    Shield,
    Eye,
    EyeOff,
    AlertTriangle,
    X,
    Check,
    AlertCircle,
    RefreshCw,
    Package,
    List,
    Share2,
    Loader2,
    Trash2,
    RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useImportExport } from "@/hooks/use-import-export";
import {
    getSettings,
    updateSetting,
    getContent,
    getEditingFile,
    getSavedFiles,
    getFileContent,
    clearAllData,
    getProjects,
    getTrash,
    restoreTrashEntry,
    restoreAllTrash,
    purgeTrashEntry,
    emptyTrash,
    onStorageChange,
    collectBoundShareIds,
    type TrashEntry,
} from "@/lib/storage";
import { encryptData } from "@/lib/utils";
import { truncateFilenameForDisplay } from "@/lib/editor";
import { getAppVersion, getCacheVersion, checkForUpdate, triggerUpdate } from "@/lib/pwa-version";
import {
    buildTimeConfig,
    clearApiOverride,
    getEffectiveApiConfig,
    hasApiOverride,
    setApiOverride,
} from "@/lib/config";
import {
    fetchCompatibility,
    isCorsFailure,
    rotateManageTokensBatched,
    testShareConnection,
} from "@/lib/api";
import { ModalShell } from "@/components/ui/modal-shell";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
    RotateManageResultsDialog,
    type RotateManageResults,
} from "@/components/share/RotateManageResultsDialog";
import { generateSharePassword } from "@/lib/share/ttl";
import { clearLocalShareBinding } from "@/lib/share/remote-delete";
import { shouldPersistNewManageToken } from "@/lib/share/rotate-manage";
import type { SavedFile } from "@/lib/storage";
import type { ExportImportData, ConflictFile, ConflictAction } from "@/types";

export default function SettingsPage(): React.JSX.Element {
    // Use lazy initialization to load settings from localStorage without useEffect
    const [showDefaultContent, setShowDefaultContent] = useState(() => {
        if (typeof window === 'undefined') return false;
        const settings = getSettings();
        return settings?.showDefaultContent ?? false;
    });
    const [keyboardShortcuts, setKeyboardShortcuts] = useState(() => {
        if (typeof window === 'undefined') return true;
        const settings = getSettings();
        return settings?.keyboardShortcuts ?? true;
    });
    const [autoSave, setAutoSave] = useState(() => {
        if (typeof window === 'undefined') return true;
        const settings = getSettings();
        return settings?.autoSave ?? true;
    });
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        if (typeof window === 'undefined') return 12;
        const settings = getSettings();
        return settings?.itemsPerPage ?? 12;
    });
    const [defaultEditorMode, setDefaultEditorMode] = useState<'both' | 'editor' | 'preview'>(() => {
        if (typeof window === 'undefined') return 'both';
        const settings = getSettings();
        return settings?.defaultEditorMode ?? 'both';
    });
    const [showEditorStatusBar, setShowEditorStatusBar] = useState(() => {
        if (typeof window === 'undefined') return true;
        const settings = getSettings();
        return settings?.showEditorStatusBar ?? true;
    });
    const [showSpellChecker, setShowSpellChecker] = useState(() => {
        if (typeof window === 'undefined') return true;
        const settings = getSettings();
        return settings?.showSpellChecker ?? true;
    });
    const [trashEnabled, setTrashEnabled] = useState(() => {
        if (typeof window === 'undefined') return true;
        const settings = getSettings();
        return settings?.trashEnabled ?? true;
    });
    const [trashItems, setTrashItems] = useState<TrashEntry[]>(() => {
        if (typeof window === 'undefined') return [];
        return getTrash();
    });
    const [confirmDisableTrash, setConfirmDisableTrash] = useState(false);
    const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
    const [confirmPurgeTrashId, setConfirmPurgeTrashId] = useState<string | null>(null);
    const [exportPassword, setExportPassword] = useState("");
    const [importPassword, setImportPassword] = useState("");
    const [showExportPassword, setShowExportPassword] = useState(false);
    const [showImportPassword, setShowImportPassword] = useState(false);
    const [conflictActions, setConflictActions] = useState<Map<string, ConflictAction>>(new Map());
    const [appliedFiles, setAppliedFiles] = useState<Set<string>>(new Set()); // Track which files have been applied
    const [lastChosenAction, setLastChosenAction] = useState<ConflictAction>('skip'); // Default to 'skip'
    const [showExportWarning, setShowExportWarning] = useState(false);
    const [showClearDataWarning, setShowClearDataWarning] = useState(false);
    const [showResetShareWarning, setShowResetShareWarning] = useState(false);
    const [shareApiUrl, setShareApiUrl] = useState(() => {
        if (typeof window === "undefined") return "";
        return getEffectiveApiConfig().API_URL;
    });
    const [shareFrontendUrl, setShareFrontendUrl] = useState(() => {
        if (typeof window === "undefined") return "";
        return getEffectiveApiConfig().FRONTEND_URL;
    });
    const [testingShare, setTestingShare] = useState(false);
    const [manageToken, setManageToken] = useState(() => {
        if (typeof window === "undefined") return "";
        return getSettings()?.manageToken ?? "";
    });
    const [showManageToken, setShowManageToken] = useState(false);
    const [pendingTokenRotate, setPendingTokenRotate] = useState<string | null>(null);
    const [rotatingToken, setRotatingToken] = useState(false);
    const [rotateResults, setRotateResults] = useState<RotateManageResults | null>(null);
    const [clearDataConfirmText, setClearDataConfirmText] = useState("");
    const [cacheVersion, setCacheVersion] = useState<string | null>(null);
    const [updateStatus, setUpdateStatus] = useState<{ hasUpdate: boolean; waiting: boolean; installing: boolean } | null>(null);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { conflicts, pendingImport, showConflictDialog, setShowConflictDialog, handleImport, handleConflictResolution, invalidFiles, showInvalidFilesDialog, setShowInvalidFilesDialog, showPasswordPanel, passwordError, handlePasswordSubmit, closePasswordPanel } = useImportExport();
    
    // Properly handle mounting to prevent hydration errors
    const [isMounted, setIsMounted] = useState(false);

    const persistPreference = (apply: () => void) => {
        apply();
        toast.success("Preference saved", { id: "settings-saved", duration: 1600 });
    };
    
    useEffect(() => {
        requestAnimationFrame(() => {
            setIsMounted(true);
        });
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const hash = window.location.hash;
        if (hash === "#password") {
            window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#token`);
        }
        const target =
            hash === "#share"
                ? "share"
                : hash === "#token" || hash === "#password"
                  ? "token"
                  : null;
        if (!target) return;
        const el = document.getElementById(target);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [isMounted]);

    useEffect(() => {
        if (!isMounted) return;
        const refreshTrash = () => setTrashItems(getTrash());
        refreshTrash();
        return onStorageChange((key) => {
            if (key === "mdviewer_trash" || key === "mdviewer_settings" || key === null) {
                refreshTrash();
                const settings = getSettings();
                if (settings) setTrashEnabled(settings.trashEnabled ?? true);
            }
        });
    }, [isMounted]);
    
    // Load cache version and update status
    useEffect(() => {
        if (!isMounted) return;

        const loadVersionInfo = async () => {
            const cacheVer = await getCacheVersion();
            setCacheVersion(cacheVer);
            
            const updateInfo = await checkForUpdate();
            setUpdateStatus(updateInfo);
        };

        loadVersionInfo();
    }, [isMounted]);

    // Reload settings when component becomes visible (user returns to page)
    useEffect(() => {
        if (!isMounted) return;
        
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Page is now visible, reload settings and check for updates
                const settings = getSettings();
                if (settings) {
                    // Also refresh update status
                    checkForUpdate().then(setUpdateStatus);
                    setShowDefaultContent(settings.showDefaultContent);
                    setKeyboardShortcuts(settings.keyboardShortcuts);
                    setAutoSave(settings.autoSave);
                    setItemsPerPage(settings.itemsPerPage);
                    setDefaultEditorMode(settings.defaultEditorMode ?? 'both');
                    setShowEditorStatusBar(settings.showEditorStatusBar ?? true);
                    setShowSpellChecker(settings.showSpellChecker ?? true);
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isMounted]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                if (e.key === 'Escape') {
                    // Still allow Escape to close dialogs
                    if (showExportWarning) {
                        setShowExportWarning(false);
                    } else if (showClearDataWarning) {
                        setShowClearDataWarning(false);
                        setClearDataConfirmText("");
                    } else if (showConflictDialog) {
                        setShowConflictDialog(false);
                        setConflictActions(new Map());
                        setLastChosenAction('skip');
                        setImportPassword("");
                    } else if (showInvalidFilesDialog) {
                        setShowInvalidFilesDialog(false);
                    } else if (showPasswordPanel) {
                        closePasswordPanel();
                    }
                }
                return;
            }

            // Check if keyboard shortcuts are enabled
            if (!keyboardShortcuts) return;

            // Ctrl+O or Cmd+O - Import JSON data (settings import)
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                e.stopPropagation();
                handleImport();
                return;
            }

            // Escape key - Close dialogs
            if (e.key === 'Escape') {
                if (showExportWarning) {
                    setShowExportWarning(false);
                } else if (showClearDataWarning) {
                    setShowClearDataWarning(false);
                    setClearDataConfirmText("");
                } else if (showConflictDialog) {
                    setShowConflictDialog(false);
                    setConflictActions(new Map());
                    setLastChosenAction('skip');
                    setImportPassword("");
                } else if (showInvalidFilesDialog) {
                    setShowInvalidFilesDialog(false);
                } else if (showPasswordPanel) {
                    closePasswordPanel();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [keyboardShortcuts, showExportWarning, showClearDataWarning, showConflictDialog, showInvalidFilesDialog, showPasswordPanel, closePasswordPanel, setShowConflictDialog, setShowInvalidFilesDialog, handleImport]);

    // Sync theme changes between localStorage and next-themes cookie
    useEffect(() => {
        if (isMounted && theme) {
            // Update cookie for next-themes (it uses _th cookie)
            document.cookie = `_th=${theme}; path=/; max-age=31536000; SameSite=Lax`;
            // Update storage if theme changed
            const currentSettings = getSettings();
            if (currentSettings && currentSettings.theme !== theme) {
                updateSetting('theme', theme as 'light' | 'dark' | 'system');
            }
        }
    }, [theme, isMounted]);

    const handleExportClick = () => {
        setShowExportWarning(true);
    };

    const handleExportConfirm = async () => {
        setShowExportWarning(false);
        try {
            // Collect all data
            const data: ExportImportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                settings: {
                    showDefaultContent,
                    theme: theme as 'light' | 'dark' | 'system',
                    trashEnabled,
                    manageToken: getSettings()?.manageToken ?? manageToken,
                },
                files: [],
                currentContent: getContent(),
                editingFile: getEditingFile(),
            };

            // Collect all files
            const savedFiles = getSavedFiles();
            data.files = savedFiles.map((file: SavedFile) => ({
                id: file.id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Only for export, not saved
                filename: file.filename,
                content: getFileContent(file.filename) || '',
                timestamp: file.timestamp,
                projectId: file.projectId,
            }));
            data.projects = getProjects();

            // Encrypt if password provided
            let exportData: string;
            try {
                exportData = JSON.stringify(data, null, 2);
                
                if (!exportData || exportData.trim().length === 0) {
                    toast.error("No data to export");
                    return;
                }
            } catch (error) {
                toast.error("Failed to serialize data for export: " + (error instanceof Error ? error.message : "Unknown error"));
                return;
            }

            if (exportPassword.trim()) {
                // Use AES-GCM encryption with PBKDF2 key derivation
                // This provides real, secure encryption
                try {
                    exportData = await encryptData(exportData, exportPassword);
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : "Unknown error";
                    if (errorMsg.includes("password") || errorMsg.includes("Password")) {
                        toast.error("Invalid password. Please enter a valid password.");
                    } else if (errorMsg.includes("data") || errorMsg.includes("encode")) {
                        toast.error("Failed to encrypt data. The data may be too large or invalid.");
                    } else {
                        toast.error("Encryption failed: " + errorMsg);
                    }
                    return;
                }
            }

            // Download as JSON file
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mdviewer-backup-${Date.now()}${exportPassword.trim() ? '-encrypted' : ''}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Data exported successfully!");
            setExportPassword("");
        } catch (error) {
            toast.error("Failed to export data");
            console.error(error);
        }
    };


    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex flex-col gap-6 animate-fade-in max-w-4xl">
            <div className="text-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-2">
                    Settings
                </h1>
                <p className="text-muted-foreground">
                    Customize your MD Viewer experience
                </p>
            </div>

            {/* Share API — deep link /settings#share */}
            <Card id="share" className="p-6 scroll-mt-24">
                <div className="flex items-center gap-3 mb-1">
                    <Share2 className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Share API</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                    Point MDViewer at your own Workers backend, or keep the build-time defaults.
                    {hasApiOverride() ? " Using a browser override." : " Using build-time / empty defaults."}
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block" htmlFor="share-api-url">
                            Worker API URL
                        </label>
                        <input
                            id="share-api-url"
                            type="text"
                            inputMode="url"
                            placeholder={buildTimeConfig.API_URL || "/api"}
                            value={shareApiUrl}
                            onChange={(e) => setShareApiUrl(e.target.value)}
                            disabled={!isMounted}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Absolute Worker URL, or same-origin path like{" "}
                            <code className="bg-muted px-1 rounded text-[0.7rem]">/api</code>{" "}
                            (unified Appflare install).
                        </p>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block" htmlFor="share-frontend-url">
                            Frontend URL (for share links)
                        </label>
                        <input
                            id="share-frontend-url"
                            type="text"
                            inputMode="url"
                            placeholder={
                                buildTimeConfig.FRONTEND_URL ||
                                (typeof window !== "undefined"
                                    ? window.location.origin
                                    : "same-origin")
                            }
                            value={shareFrontendUrl}
                            onChange={(e) => setShareFrontendUrl(e.target.value)}
                            disabled={!isMounted}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Absolute SPA origin, or leave empty /{" "}
                            <code className="bg-muted px-1 rounded text-[0.7rem]">same-origin</code>{" "}
                            when API is <code className="bg-muted px-1 rounded text-[0.7rem]">/api</code>.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            size="sm"
                            className="gap-2"
                            disabled={!isMounted}
                            onClick={() => {
                                const api = shareApiUrl.trim();
                                let frontend = shareFrontendUrl.trim();
                                if (!api) {
                                    toast.error("API URL is required");
                                    return;
                                }
                                if (
                                    !frontend &&
                                    (api.startsWith("/") && !api.startsWith("//"))
                                ) {
                                    frontend = "same-origin";
                                }
                                if (!frontend) {
                                    toast.error("Frontend URL is required (or use /api + same-origin)");
                                    return;
                                }
                                try {
                                    setApiOverride({
                                        apiUrl: api,
                                        frontendUrl: frontend,
                                    });
                                    toast.success("Share API settings saved", {
                                        id: "settings-saved",
                                    });
                                } catch (error) {
                                    toast.error(
                                        error instanceof Error
                                            ? error.message
                                            : "Invalid share API URL"
                                    );
                                }
                            }}
                        >
                            <Check className="w-4 h-4" />
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={!isMounted || testingShare}
                            onClick={async () => {
                                setTestingShare(true);
                                try {
                                    // Persist draft URLs for the probe if API is filled
                                    if (shareApiUrl.trim()) {
                                        const api = shareApiUrl.trim();
                                        let frontend = shareFrontendUrl.trim();
                                        if (
                                            !frontend &&
                                            api.startsWith("/") &&
                                            !api.startsWith("//")
                                        ) {
                                            frontend = "same-origin";
                                        }
                                        if (frontend) {
                                            try {
                                                setApiOverride({
                                                    apiUrl: api,
                                                    frontendUrl: frontend,
                                                });
                                            } catch (error) {
                                                toast.error(
                                                    error instanceof Error
                                                        ? error.message
                                                        : "Invalid share API URL"
                                                );
                                                return;
                                            }
                                        }
                                    }
                                    const result = await testShareConnection();
                                    if (result.compatibility) {
                                        toast.success(
                                            `Connected — ${result.compatibility.name} v${result.compatibility.version} (protocol ${result.compatibility.protocol})`
                                        );
                                    } else {
                                        toast.success("Health OK (no /compatibility response)");
                                    }
                                } catch (error) {
                                    if (isCorsFailure(error)) {
                                        toast.error(error instanceof Error ? error.message : "CORS blocked");
                                    } else {
                                        toast.error(
                                            error instanceof Error ? error.message : "Connection test failed"
                                        );
                                    }
                                } finally {
                                    setTestingShare(false);
                                }
                            }}
                        >
                            {testingShare ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            Test connection
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={!isMounted}
                            onClick={() => setShowResetShareWarning(true)}
                        >
                            Default
                        </Button>
                    </div>
                    {(buildTimeConfig.API_URL || buildTimeConfig.FRONTEND_URL) && (
                        <p className="text-xs text-muted-foreground">
                            Build defaults:{" "}
                            <code className="bg-muted px-1 rounded text-[10px]">
                                {buildTimeConfig.API_URL || "(no API)"}
                            </code>
                            {" · "}
                            <code className="bg-muted px-1 rounded text-[10px]">
                                {buildTimeConfig.FRONTEND_URL || "(no frontend)"}
                            </code>
                        </p>
                    )}
                </div>
            </Card>

            {/* Manage token — deep link /settings#token (#password redirects here) */}
            <Card id="token" className="p-6 scroll-mt-24">
                <div className="flex items-center gap-3 mb-1">
                    <Lock className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Manage token</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                    Creator secret for this device. Required to create, update, or delete shares.
                    Stored only in this browser — never put it in the public link. View passwords are
                    separate and disposable per share.
                </p>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type={showManageToken ? "text" : "password"}
                            autoComplete="new-password"
                            value={manageToken}
                            onChange={(e) => setManageToken(e.target.value)}
                            disabled={!isMounted}
                            placeholder="Required to share"
                            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm font-mono"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={!isMounted}
                            onClick={() => setShowManageToken((v) => !v)}
                            aria-label={showManageToken ? "Hide token" : "Show token"}
                        >
                            {showManageToken ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            className="gap-2"
                            disabled={!isMounted || !manageToken.trim()}
                            onClick={() => {
                                const next = manageToken.trim();
                                const prev = getSettings()?.manageToken ?? "";
                                const bound = collectBoundShareIds();
                                if (prev && next && prev !== next && bound.length > 0) {
                                    setPendingTokenRotate(next);
                                    return;
                                }
                                updateSetting("manageToken", next);
                                toast.success("Manage token saved", { id: "settings-saved" });
                            }}
                        >
                            <Check className="w-4 h-4" />
                            Save
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!isMounted}
                            onClick={() => {
                                const next = generateSharePassword(24);
                                const prev = getSettings()?.manageToken ?? "";
                                const bound = collectBoundShareIds();
                                setManageToken(next);
                                if (prev && bound.length > 0) {
                                    setPendingTokenRotate(next);
                                    return;
                                }
                                updateSetting("manageToken", next);
                                toast.success("Generated and saved");
                            }}
                        >
                            Auto-generate
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={!isMounted || !manageToken}
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(manageToken);
                                    toast.success("Copied");
                                } catch {
                                    toast.error("Copy failed");
                                }
                            }}
                        >
                            Copy
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Theme Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    {isMounted ? (
                        resolvedTheme === 'dark' ? (
                            <Moon className="w-5 h-5 text-primary" />
                        ) : (
                            <Sun className="w-5 h-5 text-primary" />
                        )
                    ) : (
                        <Sun className="w-5 h-5 text-primary" />
                    )}
                    <h2 className="text-xl font-semibold">Theme</h2>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium mb-1">Appearance</p>
                        <p className="text-xs text-muted-foreground">
                            Choose your preferred theme
                        </p>
                    </div>
                    <ThemeToggle />
                </div>
            </Card>

            {/* Editor Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-1">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Editor</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Writing surface defaults — applied when you open the editor.</p>
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1">Show default content</p>
                            <p className="text-xs text-muted-foreground">
                                Example markdown when the editor is empty or a new file is created
                            </p>
                        </div>
                        <Button
                            variant={isMounted && showDefaultContent ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                const newValue = !showDefaultContent;
                                persistPreference(() => {
                                    setShowDefaultContent(newValue);
                                    updateSetting('showDefaultContent', newValue);
                                });
                            }}
                            disabled={!isMounted}
                        >
                            {isMounted ? (showDefaultContent ? "On" : "Off") : "..."}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1">Auto save</p>
                            <p className="text-xs text-muted-foreground">
                                Save about every 2s while editing; empty draft clears after 2s idle
                            </p>
                        </div>
                        <Button
                            variant={isMounted && autoSave ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                const newValue = !autoSave;
                                persistPreference(() => {
                                    setAutoSave(newValue);
                                    updateSetting('autoSave', newValue);
                                });
                            }}
                            disabled={!isMounted}
                        >
                            {isMounted ? (autoSave ? "On" : "Off") : "..."}
                        </Button>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1">Default editor mode</p>
                            <p className="text-xs text-muted-foreground">
                                Initial layout on load only. Toolbar changes stay session-local. Split falls back to editor-only on small screens.
                            </p>
                        </div>
                        <select
                            value={isMounted ? defaultEditorMode : 'both'}
                            onChange={(e) => {
                                const newValue = e.target.value as 'both' | 'editor' | 'preview';
                                persistPreference(() => {
                                    setDefaultEditorMode(newValue);
                                    updateSetting('defaultEditorMode', newValue);
                                });
                            }}
                            disabled={!isMounted}
                            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 shrink-0"
                        >
                            <option value="both">Split view</option>
                            <option value="editor">Editor only</option>
                            <option value="preview">Preview only</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1">Status bar</p>
                            <p className="text-xs text-muted-foreground">
                                Word/character counts and save status under the editor
                            </p>
                        </div>
                        <Button
                            variant={isMounted && showEditorStatusBar ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                const newValue = !showEditorStatusBar;
                                persistPreference(() => {
                                    setShowEditorStatusBar(newValue);
                                    updateSetting('showEditorStatusBar', newValue);
                                });
                            }}
                            disabled={!isMounted}
                        >
                            {isMounted ? (showEditorStatusBar ? "On" : "Off") : "..."}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1">Spell checker</p>
                            <p className="text-xs text-muted-foreground">
                                Toolbar toggle and browser spellcheck in the textarea
                            </p>
                        </div>
                        <Button
                            variant={isMounted && showSpellChecker ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                const newValue = !showSpellChecker;
                                persistPreference(() => {
                                    setShowSpellChecker(newValue);
                                    updateSetting('showSpellChecker', newValue);
                                });
                            }}
                            disabled={!isMounted}
                        >
                            {isMounted ? (showSpellChecker ? "On" : "Off") : "..."}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t pt-4">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium mb-1">Keyboard shortcuts</p>
                            <p className="text-xs text-muted-foreground">
                                Enable quick actions (save, new, import, preview, …)
                            </p>
                        </div>
                        <Button
                            variant={isMounted && keyboardShortcuts ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                const newValue = !keyboardShortcuts;
                                persistPreference(() => {
                                    setKeyboardShortcuts(newValue);
                                    updateSetting('keyboardShortcuts', newValue);
                                });
                            }}
                            disabled={!isMounted}
                        >
                            {isMounted ? (keyboardShortcuts ? "On" : "Off") : "..."}
                        </Button>
                    </div>
                    {keyboardShortcuts && (
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border-t">
                            <p className="text-xs font-medium mb-3">Available Shortcuts:</p>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl/Cmd + S</kbd>
                                        <span className="text-muted-foreground">Save</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/70">Editor</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl/Cmd + Alt + N</kbd>
                                        <span className="text-muted-foreground">New File</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/70">Editor</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl/Cmd + E</kbd>
                                        <span className="text-muted-foreground">Export</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/70">Editor (current file)</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl/Cmd + O</kbd>
                                        <span className="text-muted-foreground">Import</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/70">All Pages</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl/Cmd + /</kbd>
                                        <span className="text-muted-foreground">Toggle Preview</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/70">Editor</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl/Cmd + M</kbd>
                                        <span className="text-muted-foreground">Cycle Live Editor (Expand → Collapse → Close)</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/70">Editor</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Esc</kbd>
                                        <span className="text-muted-foreground">Close Dialogs</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground/70">All Pages</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Files & lists */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-1">
                    <List className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Files & lists</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">Pagination for the saved-files list.</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1">Items per page</p>
                        <p className="text-xs text-muted-foreground">
                            How many files show per page on Files
                        </p>
                    </div>
                    <select
                        value={isMounted ? itemsPerPage : 12}
                        onChange={(e) => {
                            const newValue = Number(e.target.value);
                            persistPreference(() => {
                                setItemsPerPage(newValue);
                                updateSetting('itemsPerPage', newValue);
                            });
                        }}
                        disabled={!isMounted}
                        className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 shrink-0"
                    >
                        <option value={6}>6</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                        <option value={96}>96</option>
                    </select>
                </div>
            </Card>

            {/* App Version & Updates */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Package className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">App Version & Updates</h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium mb-1">App Version</p>
                            <p className="text-xs text-muted-foreground">
                                Current version: {getAppVersion()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium mb-1">Cache Version</p>
                            <p className="text-xs text-muted-foreground">
                                {cacheVersion ? cacheVersion : "Not cached"}
                            </p>
                        </div>
                    </div>
                    {updateStatus && (updateStatus.waiting || updateStatus.installing) && (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-primary" />
                                <p className="text-sm font-medium">Update Available</p>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                                A new version is {updateStatus.waiting ? "ready" : "installing"}. Click update to reload with the latest version.
                            </p>
                            <Button
                                size="sm"
                                variant="default"
                                onClick={async () => {
                                    const success = await triggerUpdate();
                                    if (success) {
                                        toast.success("Updating...");
                                    } else {
                                        toast.error("Failed to trigger update");
                                    }
                                }}
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Update Now
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t pt-4">
                        <div>
                            <p className="text-sm font-medium mb-1">Check for Updates</p>
                            <p className="text-xs text-muted-foreground">
                                Manually check if a new version is available
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                                setIsCheckingUpdate(true);
                                const updateInfo = await checkForUpdate();
                                setUpdateStatus(updateInfo);
                                setIsCheckingUpdate(false);
                                
                                if (updateInfo.hasUpdate) {
                                    toast.info("Update available! Click 'Update Now' to install.");
                                } else {
                                    toast.success("You're using the latest version");
                                }
                            }}
                            disabled={isCheckingUpdate || !isMounted}
                            className="gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? "animate-spin" : ""}`} />
                            {isCheckingUpdate ? "Checking..." : "Check"}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Privacy & Data */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Privacy & Data</h2>
                </div>
                <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-2 mb-2">
                            <Info className="w-4 h-4 text-primary mt-0.5" />
                            <h3 className="font-medium text-sm">How We Handle Your Data</h3>
                        </div>
                        <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                            <li>All files are stored locally in your browser using localStorage</li>
                            <li>We never send your content to any server unless you explicitly share it</li>
                            <li>Shared content is stored in Cloudflare R2 (only when you use the share feature)</li>
                            <li>You can export all your data at any time</li>
                            <li>You can delete your data by clearing browser storage</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Export/Import */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Download className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Backup & Restore</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-2">Export All Data</p>
                        <p className="text-xs text-muted-foreground mb-3">
                            Export all your files, settings, and data as a JSON file. You can optionally protect it with a password.
                        </p>
                        <div className="flex gap-2 mb-2">
                            <div className="flex-1 relative">
                                <input
                                    type={showExportPassword ? "text" : "password"}
                                    placeholder="Password (optional)"
                                    value={exportPassword}
                                    onChange={(e) => setExportPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowExportPassword(!showExportPassword)}
                                    className="absolute right-0 top-0 h-full px-2"
                                >
                                    {showExportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                            <Button
                                variant="default"
                                onClick={handleExportClick}
                                className="gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </Button>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2">Import Data</p>
                        <p className="text-xs text-muted-foreground mb-3">
                            Import previously exported data. If the file is password protected, enter the password.
                        </p>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type={showImportPassword ? "text" : "password"}
                                    placeholder="Password (if file is protected)"
                                    value={importPassword}
                                    onChange={(e) => setImportPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowImportPassword(!showImportPassword)}
                                    className="absolute right-0 top-0 h-full px-2"
                                >
                                    {showImportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => handleImport(importPassword)}
                                className="gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Import
                            </Button>
                        </div>
                    </div>

                    <div className="border-t pt-4" id="trash">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <p className="text-sm font-medium mb-1 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Trash
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    When on, deleted files and projects move here so you can restore them.
                                    When off, delete is permanent after confirm. Trash is local-only and
                                    not included in export.
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                variant={trashEnabled ? "default" : "outline"}
                                onClick={() => {
                                    if (trashEnabled) {
                                        // Turning off — warn if trash has items (they get cleared)
                                        if (trashItems.length > 0) {
                                            setConfirmDisableTrash(true);
                                            return;
                                        }
                                        persistPreference(() => {
                                            setTrashEnabled(false);
                                            updateSetting("trashEnabled", false);
                                        });
                                        return;
                                    }
                                    persistPreference(() => {
                                        setTrashEnabled(true);
                                        updateSetting("trashEnabled", true);
                                    });
                                }}
                            >
                                {trashEnabled ? "On" : "Off"}
                            </Button>
                        </div>

                        {trashItems.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-2">Trash is empty.</p>
                        ) : (
                            <div className="space-y-2">
                                <div className="max-h-56 overflow-y-auto space-y-2 rounded-md border border-border p-2">
                                    {trashItems.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate font-medium">
                                                    {entry.kind === "file"
                                                        ? entry.file.filename
                                                        : entry.project.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {entry.kind === "file" ? "File" : "Project"} ·{" "}
                                                    {new Date(entry.trashedAt).toLocaleString()}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-7 gap-1 shrink-0"
                                                onClick={() => {
                                                    const result = restoreTrashEntry(entry.id);
                                                    if (!result.success) {
                                                        toast.error(result.error || "Restore failed");
                                                        return;
                                                    }
                                                    setTrashItems(getTrash());
                                                    toast.success("Restored");
                                                }}
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                Restore
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 w-7 p-0 shrink-0 text-destructive"
                                                title="Delete forever"
                                                onClick={() => setConfirmPurgeTrashId(entry.id)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => {
                                            const { restored, failed } = restoreAllTrash();
                                            setTrashItems(getTrash());
                                            if (failed > 0) {
                                                toast.warning(
                                                    `Restored ${restored}, ${failed} failed`
                                                );
                                            } else {
                                                toast.success(
                                                    `Restored ${restored} item${restored === 1 ? "" : "s"}`
                                                );
                                            }
                                        }}
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Restore all
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="gap-2"
                                        onClick={() => setConfirmEmptyTrash(true)}
                                    >
                                        Empty trash
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-2 text-destructive">Clear All Data</p>
                        <p className="text-xs text-muted-foreground mb-3">
                            Permanently delete all files, settings, and data. This action cannot be undone.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={() => setShowClearDataWarning(true)}
                            className="gap-2"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Clear All Data
                        </Button>
                    </div>
                </div>
            </Card>

            {showExportWarning && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowExportWarning(false);
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">
                                    Export All Data
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    This will export all your files, settings, and current editor content to a JSON file. The export will include all your saved files and can be password protected.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowExportWarning(false)}
                                className="h-6 w-6 p-0 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                onClick={handleExportConfirm}
                                className="gap-2 w-full"
                            >
                                <Download className="w-4 h-4" />
                                Continue Export
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowExportWarning(false)}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {showClearDataWarning && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowClearDataWarning(false);
                            setClearDataConfirmText("");
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1 text-destructive">
                                    Clear All Data
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    This will permanently delete:
                                </p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-3">
                                    <li>All saved files</li>
                                    <li>All settings</li>
                                    <li>Current editor content</li>
                                    <li>All application data</li>
                                </ul>
                                <p className="text-sm font-medium text-destructive mb-3">
                                    This action cannot be undone!
                                </p>
                                <div className="mb-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            // Export before clearing
                                            await handleExportConfirm();
                                            toast.info("Data exported. You can now proceed with deletion.");
                                        }}
                                        className="gap-2 w-full"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export Data First
                                    </Button>
                                </div>
                                <div className="mb-2">
                                    <label className="text-sm font-medium text-foreground mb-1 block">
                                        Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm:
                                    </label>
                                    <input
                                        type="text"
                                        value={clearDataConfirmText}
                                        onChange={(e) => setClearDataConfirmText(e.target.value)}
                                        placeholder="DELETE"
                                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono uppercase"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setShowClearDataWarning(false);
                                    setClearDataConfirmText("");
                                }}
                                className="h-6 w-6 p-0 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    if (clearDataConfirmText !== "DELETE") {
                                        toast.error("Please type DELETE in capital letters to confirm");
                                        return;
                                    }
                                    
                                    setShowClearDataWarning(false);
                                    setClearDataConfirmText("");
                                    
                                    try {
                                        // Use the centralized clearAllData function
                                        // This clears everything: files, settings, temp content, shared links, etc.
                                        clearAllData();
                                        
                                        toast.success("All data cleared successfully");
                                    } catch (error) {
                                        console.error('Error clearing all data:', error);
                                        toast.error("Failed to clear all data");
                                    }
                                }}
                                disabled={clearDataConfirmText !== "DELETE"}
                                className="gap-2 w-full"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Clear All Data
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowClearDataWarning(false);
                                    setClearDataConfirmText("");
                                }}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {showConflictDialog && conflicts.length > 0 && pendingImport && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowConflictDialog(false);
                            setConflictActions(new Map());
                            setLastChosenAction('skip');
                            setImportPassword("");
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">
                                    File Conflicts Detected
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {conflicts.length} file(s) already exist. Choose how to handle them:
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                            {conflicts.map((conflict: ConflictFile, index: number) => {
                                const fileKey = conflict.imported.id || conflict.imported.filename;
                                // First conflict defaults to 'skip', others use last chosen action or 'skip'
                                const currentAction = conflictActions.get(fileKey) || (index === 0 ? 'skip' : lastChosenAction);
                                const isApplied = appliedFiles.has(fileKey);
                                
                                const handleActionClick = (action: ConflictAction) => {
                                    const newActions = new Map(conflictActions);
                                    
                                    // Set action for this file (just select, don't apply yet)
                                    newActions.set(fileKey, action);
                                    
                                    // Set same action for all remaining conflicts (as selection)
                                    conflicts.forEach((c: ConflictFile, idx: number) => {
                                        if (idx > index) {
                                            const otherKey = c.imported.id || c.imported.filename;
                                            if (!newActions.has(otherKey) && !appliedFiles.has(otherKey)) {
                                                newActions.set(otherKey, action);
                                            }
                                        }
                                    });
                                    
                                    setConflictActions(newActions);
                                    setLastChosenAction(action);
                                };
                                
                                const handleActionDoubleClick = (action: ConflictAction) => {
                                    if (isApplied) return; // Already applied
                                    
                                    // Mark as applied first
                                    const newApplied = new Set(appliedFiles);
                                    newApplied.add(fileKey);
                                    setAppliedFiles(newApplied);
                                    
                                    // Update actions
                                    const newActions = new Map(conflictActions);
                                    newActions.set(fileKey, action);
                                    setConflictActions(newActions);
                                    
                                    // Create a map with only this file's action for immediate resolution
                                    const singleFileActions = new Map<string, ConflictAction>();
                                    singleFileActions.set(fileKey, action);
                                    
                                    // Apply this single file immediately (keep dialog open for other files)
                                    handleConflictResolution(singleFileActions, (settings) => {
                                        if (settings) {
                                            setShowDefaultContent(settings.showDefaultContent);
                                            setKeyboardShortcuts(settings.keyboardShortcuts);
                                            setAutoSave(settings.autoSave);
                                            if (settings.theme) {
                                                setTheme(settings.theme);
                                            }
                                        }
                                    }, true); // Keep dialog open
                                    
                                    // Update last chosen action
                                    setLastChosenAction(action);
                                    
                                    // Check if all files are now applied
                                    if (newApplied.size === conflicts.length) {
                                        // All files applied, close dialog
                                        setTimeout(() => {
                                            setImportPassword("");
                                            setConflictActions(new Map());
                                            setAppliedFiles(new Set());
                                            setLastChosenAction('skip');
                                        }, 500);
                                    }
                                };
                                
                                return (
                                    <Card key={index} className="p-4 bg-muted/50">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                                <span className="text-sm font-medium">
                                                    Conflict: {conflict.conflictType === 'filename' ? 'Same filename' : 'Same ID'}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="min-w-0">
                                                    <p className="font-medium mb-1 text-muted-foreground">Imported File:</p>
                                                    <p className="font-semibold truncate" title={conflict.imported.filename}>{truncateFilenameForDisplay(conflict.imported.filename)}</p>
                                                    <p className="text-xs text-muted-foreground font-mono truncate" title={conflict.imported.id || 'N/A'}>
                                                        ID: <span className="truncate inline-block max-w-full">{conflict.imported.id || 'N/A'}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Size: {conflict.imported.content 
                                                            ? (conflict.imported.content.length < 1024 
                                                                ? `${conflict.imported.content.length} B` 
                                                                : `${(conflict.imported.content.length / 1024).toFixed(1)} KB`)
                                                            : '0 B'}
                                                    </p>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium mb-1 text-muted-foreground">Existing File:</p>
                                                    <p className="font-semibold truncate" title={conflict.existing.filename}>{truncateFilenameForDisplay(conflict.existing.filename)}</p>
                                                    <p className="text-xs text-muted-foreground font-mono truncate" title={conflict.existing.id || 'N/A'}>
                                                        ID: <span className="truncate inline-block max-w-full">{conflict.existing.id || 'N/A'}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {conflict.existing.timestamp 
                                                            ? `Modified: ${new Date(conflict.existing.timestamp).toLocaleString()}`
                                                            : 'No timestamp'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-2 border-t">
                                                <Button
                                                    variant={currentAction === 'skip' ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleActionClick('skip')}
                                                    onDoubleClick={() => handleActionDoubleClick('skip')}
                                                    className="flex-1"
                                                    disabled={isApplied}
                                                    title={isApplied ? "Already applied" : "Click to select, double-click to apply"}
                                                >
                                                    <X className="w-3 h-3 mr-1" />
                                                    Skip {isApplied && "✓"}
                                                </Button>
                                                <Button
                                                    variant={currentAction === 'replace' ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleActionClick('replace')}
                                                    onDoubleClick={() => handleActionDoubleClick('replace')}
                                                    className="flex-1"
                                                    disabled={isApplied}
                                                    title={isApplied ? "Already applied" : "Click to select, double-click to apply"}
                                                >
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Replace {isApplied && "✓"}
                                                </Button>
                                                <Button
                                                    variant={currentAction === 'keepBoth' ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleActionClick('keepBoth')}
                                                    onDoubleClick={() => handleActionDoubleClick('keepBoth')}
                                                    className="flex-1"
                                                    disabled={isApplied}
                                                    title={isApplied ? "Already applied" : "Click to select, double-click to apply"}
                                                >
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    Keep Both {isApplied && "✓"}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                onClick={() => {
                                    // Apply last chosen action to all files that haven't been applied yet
                                    const actionToApply = lastChosenAction;
                                    const allActions = new Map<string, ConflictAction>();
                                    
                                    // Apply the last chosen action to all unapplied files
                                    conflicts.forEach((conflict: ConflictFile) => {
                                        const fileKey = conflict.imported.id || conflict.imported.filename;
                                        if (!appliedFiles.has(fileKey)) {
                                            allActions.set(fileKey, actionToApply);
                                        } else {
                                            // Keep existing action for already applied files
                                            const existingAction = conflictActions.get(fileKey);
                                            if (existingAction) {
                                                allActions.set(fileKey, existingAction);
                                            }
                                        }
                                    });
                                    
                                    handleConflictResolution(allActions, (settings) => {
                                        if (settings) {
                                            setShowDefaultContent(settings.showDefaultContent);
                                            setKeyboardShortcuts(settings.keyboardShortcuts);
                                            setAutoSave(settings.autoSave);
                                            if (settings.theme) {
                                                setTheme(settings.theme);
                                            }
                                        }
                                    });
                                    setImportPassword("");
                                    setConflictActions(new Map());
                                    setAppliedFiles(new Set());
                                    setLastChosenAction('skip');
                                }}
                                className="w-full gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Apply All ({lastChosenAction === 'skip' ? 'Skip' : lastChosenAction === 'replace' ? 'Replace' : 'Keep Both'})
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowConflictDialog(false);
                                    setConflictActions(new Map());
                                    setLastChosenAction('skip');
                                    setImportPassword("");
                                }}
                                className="w-full gap-2"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {showPasswordPanel && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full flex flex-col transform transition-all p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <Lock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-lg">
                                        Password Required
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={closePasswordPanel}
                                        className="h-8 w-8"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    This file is password protected. Please enter the password to decrypt and import it.
                                </p>
                            </div>
                        </div>

                        {passwordError && (
                            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                                    <span className="text-destructive">{passwordError}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type={showImportPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    value={importPassword}
                                    onChange={(e) => {
                                        setImportPassword(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && importPassword.trim()) {
                                            handlePasswordSubmit(importPassword);
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 pr-10"
                                    autoFocus
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowImportPassword(!showImportPassword)}
                                    className="absolute right-0 top-0 h-full px-2"
                                >
                                    {showImportPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        if (importPassword.trim()) {
                                            handlePasswordSubmit(importPassword);
                                        } else {
                                            toast.error("Please enter a password");
                                        }
                                    }}
                                    className="w-full gap-2"
                                    disabled={!importPassword.trim()}
                                >
                                    <Lock className="w-4 h-4" />
                                    Decrypt & Import
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        closePasswordPanel();
                                        setImportPassword("");
                                    }}
                                    className="w-full gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            <ConfirmDeleteDialog
                open={confirmDisableTrash}
                title="Turn off Trash"
                name={`${trashItems.length} item(s) in Trash`}
                description="Turning Trash off permanently deletes everything currently in Trash. New deletes will be permanent after confirm."
                confirmLabel="Empty Trash & turn off"
                onConfirm={() => {
                    emptyTrash();
                    setTrashItems([]);
                    setConfirmDisableTrash(false);
                    persistPreference(() => {
                        setTrashEnabled(false);
                        updateSetting("trashEnabled", false);
                    });
                    toast.success("Trash emptied and turned off");
                }}
                onCancel={() => setConfirmDisableTrash(false)}
            />

            <ConfirmDeleteDialog
                open={confirmEmptyTrash}
                title="Empty Trash"
                name={`${trashItems.length} item(s)`}
                description="Permanently delete everything in Trash. This cannot be undone."
                confirmLabel="Empty Trash"
                onConfirm={() => {
                    emptyTrash();
                    setTrashItems([]);
                    setConfirmEmptyTrash(false);
                    toast.success("Trash emptied");
                }}
                onCancel={() => setConfirmEmptyTrash(false)}
            />

            <ConfirmDeleteDialog
                open={!!confirmPurgeTrashId}
                title="Delete forever"
                name={(() => {
                    const entry = trashItems.find((e) => e.id === confirmPurgeTrashId);
                    if (!entry) return null;
                    return entry.kind === "file" ? entry.file.filename : entry.project.name;
                })()}
                description="Permanently remove this item from Trash. This cannot be undone."
                confirmLabel="Delete forever"
                onConfirm={() => {
                    if (!confirmPurgeTrashId) return;
                    purgeTrashEntry(confirmPurgeTrashId);
                    setTrashItems(getTrash());
                    setConfirmPurgeTrashId(null);
                    toast.success("Deleted forever");
                }}
                onCancel={() => setConfirmPurgeTrashId(null)}
            />

            <ModalShell
                open={pendingTokenRotate != null}
                onClose={() => {
                    if (rotatingToken) return;
                    setPendingTokenRotate(null);
                    setManageToken(getSettings()?.manageToken ?? "");
                }}
                title="Rotate manage token"
            >
                <div className="flex items-start gap-3 mb-4 pr-8">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            This will re-key{" "}
                            <strong>{collectBoundShareIds().length}</strong> locally
                            tracked share(s) on the Worker. Shares that fail stay on the
                            old token until wiped or rotated again.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                disabled={rotatingToken || !pendingTokenRotate}
                                onClick={async () => {
                                    if (!pendingTokenRotate) return;
                                    const oldToken = getSettings()?.manageToken ?? "";
                                    const newToken = pendingTokenRotate;
                                    const ids = collectBoundShareIds();
                                    setRotatingToken(true);
                                    try {
                                        let maxBatch = 50;
                                        try {
                                            const compat = await fetchCompatibility();
                                            maxBatch =
                                                compat.limits?.rotateManageMaxIds ?? 50;
                                        } catch {
                                            /* default */
                                        }
                                        const result = await rotateManageTokensBatched(
                                            ids,
                                            oldToken,
                                            newToken,
                                            maxBatch,
                                        );
                                        const persist = shouldPersistNewManageToken(
                                            result.updated,
                                            result.failed,
                                        );
                                        if (persist) {
                                            updateSetting("manageToken", newToken);
                                            setManageToken(newToken);
                                        } else {
                                            setManageToken(oldToken);
                                        }
                                        setPendingTokenRotate(null);
                                        setRotateResults({
                                            updated: result.updated,
                                            failed: result.failed,
                                            tokenPersisted: persist,
                                        });
                                    } catch (error) {
                                        if (isCorsFailure(error)) {
                                            toast.error("CORS blocked rotate");
                                        } else {
                                            toast.error(
                                                error instanceof Error
                                                    ? error.message
                                                    : "Rotate failed",
                                            );
                                        }
                                    } finally {
                                        setRotatingToken(false);
                                    }
                                }}
                                className="w-full gap-2"
                            >
                                {rotatingToken ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : null}
                                Confirm rotate
                            </Button>
                            <Button
                                variant="outline"
                                disabled={rotatingToken}
                                onClick={() => {
                                    setPendingTokenRotate(null);
                                    setManageToken(getSettings()?.manageToken ?? "");
                                }}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </ModalShell>

            <RotateManageResultsDialog
                open={rotateResults != null}
                results={rotateResults}
                onClose={() => setRotateResults(null)}
                onPruneLocal={(shareIds) => {
                    for (const id of shareIds) clearLocalShareBinding(id);
                    toast.success(
                        shareIds.length === 1
                            ? "Removed local share binding"
                            : `Removed ${shareIds.length} local share bindings`,
                    );
                }}
            />

            <ModalShell
                open={showResetShareWarning}
                onClose={() => setShowResetShareWarning(false)}
                title="Reset share API to defaults"
            >
                <div className="flex items-start gap-3 mb-4 pr-8">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">Reset to build defaults?</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            This clears your browser override and restores the build-time API / frontend
                            URLs. Unsaved edits in the fields above will be discarded.
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                            Defaults:{" "}
                            <code className="bg-muted px-1 rounded">
                                {buildTimeConfig.API_URL || "(empty)"}
                            </code>
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                onClick={() => {
                                    clearApiOverride();
                                    setShareApiUrl(buildTimeConfig.API_URL);
                                    setShareFrontendUrl(buildTimeConfig.FRONTEND_URL);
                                    setShowResetShareWarning(false);
                                    toast.success("Share API reset to defaults", {
                                        id: "settings-saved",
                                    });
                                }}
                                className="w-full"
                            >
                                Reset to defaults
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowResetShareWarning(false)}
                                className="w-full"
                            >
                                Keep my URLs
                            </Button>
                        </div>
                    </div>
                </div>
            </ModalShell>

            {showInvalidFilesDialog && invalidFiles.length > 0 && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowInvalidFilesDialog(false);
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-lg">
                                        Invalid Files Detected
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowInvalidFilesDialog(false)}
                                        className="h-8 w-8"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {invalidFiles.length} file(s) failed validation and will be skipped:
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
                            {invalidFiles.map((error, index) => (
                                <div
                                    key={index}
                                    className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm"
                                >
                                    <div className="flex items-start gap-2 min-w-0">
                                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                                        <span className="text-foreground truncate flex-1" title={error}>{error}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                onClick={() => setShowInvalidFilesDialog(false)}
                                className="w-full gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Continue Import
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
}

