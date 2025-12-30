"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { 
    Settings as SettingsIcon, 
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
    AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useImportExport } from "@/hooks/use-import-export";
import { getSettings, setSettings, updateSetting, getContent, getEditingFile, getSavedFiles, getFileContent, setSavedFiles, removeContent, removeEditingFile, removeFileContent, clearAllData, type SettingsData } from "@/lib/storage";
import { usePlatform } from "@/hooks/use-platform";
import { encodeBase64, encryptData } from "@/lib/utils";


interface ConflictFile {
    imported: any;
    existing: any;
    conflictType: 'filename' | 'id';
}

export default function SettingsPage(): React.JSX.Element {
    const { isMobile } = usePlatform();
    const [showDefaultContent, setShowDefaultContent] = useState(false);
    const [keyboardShortcuts, setKeyboardShortcuts] = useState(true);
    const [autoSave, setAutoSave] = useState(true);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [defaultEditorMode, setDefaultEditorMode] = useState<'both' | 'editor' | 'preview'>('both');
    const [exportPassword, setExportPassword] = useState("");
    const [importPassword, setImportPassword] = useState("");
    const [showExportPassword, setShowExportPassword] = useState(false);
    const [showImportPassword, setShowImportPassword] = useState(false);
    const [conflictActions, setConflictActions] = useState<Map<string, 'skip' | 'replace' | 'keepBoth'>>(new Map());
    const [appliedFiles, setAppliedFiles] = useState<Set<string>>(new Set()); // Track which files have been applied
    const [lastChosenAction, setLastChosenAction] = useState<'skip' | 'replace' | 'keepBoth'>('skip'); // Default to 'skip'
    const [showExportWarning, setShowExportWarning] = useState(false);
    const [showClearDataWarning, setShowClearDataWarning] = useState(false);
    const [clearDataConfirmText, setClearDataConfirmText] = useState("");
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { conflicts, pendingImport, showConflictDialog, setShowConflictDialog, handleImport, handleConflictResolution, invalidFiles, showInvalidFilesDialog, setShowInvalidFilesDialog, showPasswordPanel, setShowPasswordPanel, passwordError, handlePasswordSubmit, closePasswordPanel } = useImportExport();
    const [mounted, setMounted] = useState(false);
    
    // Prevent hydration mismatch by waiting for mount
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Load settings only on mount
        if (!mounted) return;
        
        const settings = getSettings();
        if (settings) {
            setShowDefaultContent(settings.showDefaultContent);
            setKeyboardShortcuts(settings.keyboardShortcuts);
            setAutoSave(settings.autoSave);
            setItemsPerPage(settings.itemsPerPage);
            setDefaultEditorMode(settings.defaultEditorMode ?? 'both');
        }
    }, [mounted]);
    
    // Reload settings when component becomes visible (user returns to page)
    useEffect(() => {
        if (!mounted) return;
        
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Page is now visible, reload settings
                const settings = getSettings();
                if (settings) {
                    setShowDefaultContent(settings.showDefaultContent);
                    setKeyboardShortcuts(settings.keyboardShortcuts);
                    setAutoSave(settings.autoSave);
                    setItemsPerPage(settings.itemsPerPage);
                    setDefaultEditorMode(settings.defaultEditorMode ?? 'both');
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [mounted]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showExportWarning, showClearDataWarning, showConflictDialog, showInvalidFilesDialog, setShowConflictDialog, setShowInvalidFilesDialog]);

    const saveSettings = () => {
        setSettings({
            showDefaultContent,
            theme: theme as 'light' | 'dark' | 'system',
            keyboardShortcuts: keyboardShortcuts,
            autoSave: autoSave,
            itemsPerPage: itemsPerPage,
            defaultEditorMode: defaultEditorMode,
        });
        // Trigger storage event to notify editor
        window.dispatchEvent(new Event('storage'));
    };

    // Only save settings when user explicitly changes a setting
    // Don't auto-save on mount or when values change programmatically
    const handleSettingChange = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
        // Update local state
        if (key === 'showDefaultContent') setShowDefaultContent(value as boolean);
        else if (key === 'keyboardShortcuts') setKeyboardShortcuts(value as boolean);
        else if (key === 'autoSave') setAutoSave(value as boolean);
        else if (key === 'itemsPerPage') setItemsPerPage(value as number);
        else if (key === 'defaultEditorMode') setDefaultEditorMode(value as 'both' | 'editor' | 'preview');
        else if (key === 'theme') setTheme(value as 'light' | 'dark' | 'system');
        
        // Save immediately on user action
        saveSettings();
    };
    
    // Sync theme changes between localStorage and next-themes cookie
    useEffect(() => {
        if (mounted && theme) {
            // Update cookie for next-themes (it uses _th cookie)
            document.cookie = `_th=${theme}; path=/; max-age=31536000; SameSite=Lax`;
            // Update storage if theme changed
            const currentSettings = getSettings();
            if (currentSettings && currentSettings.theme !== theme) {
                updateSetting('theme', theme as 'light' | 'dark' | 'system');
            }
        }
    }, [theme, mounted]);

    const handleExportClick = () => {
        setShowExportWarning(true);
    };

    const handleExportConfirm = async () => {
        setShowExportWarning(false);
        try {
            // Collect all data
            const data: any = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                settings: {
                    showDefaultContent,
                    theme,
                },
                files: [],
                currentContent: getContent(),
                editingFile: getEditingFile(),
            };

            // Collect all files
            const savedFiles = getSavedFiles();
            data.files = savedFiles.map((file: any) => ({
                id: file.id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Only for export, not saved
                filename: file.filename,
                content: getFileContent(file.filename) || '',
                timestamp: file.timestamp,
            }));

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

            {/* Theme Settings */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    {mounted && resolvedTheme === 'dark' ? (
                        <Moon className="w-5 h-5 text-primary" />
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
                <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">Editor</h2>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Show Default Content</p>
                            <p className="text-xs text-muted-foreground">
                                Show example markdown content when creating new files or when editor is empty
                            </p>
                        </div>
                        <Button
                            variant={mounted && showDefaultContent ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                const newValue = !showDefaultContent;
                                setShowDefaultContent(newValue);
                                updateSetting('showDefaultContent', newValue);
                            }}
                            disabled={!mounted}
                        >
                            {mounted ? (showDefaultContent ? "On" : "Off") : "..."}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Auto Save</p>
                            <p className="text-xs text-muted-foreground">
                                Automatically save files every 2 seconds when editing. Temp content is cleared if editor is empty for 2 seconds.
                            </p>
                        </div>
                        <Button
                            variant={mounted && autoSave ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                const newValue = !autoSave;
                                setAutoSave(newValue);
                                updateSetting('autoSave', newValue);
                            }}
                            disabled={!mounted}
                        >
                            {mounted ? (autoSave ? "On" : "Off") : "..."}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Default Editor Mode</p>
                            <p className="text-xs text-muted-foreground">
                                Choose the default view mode when the editor page loads. This setting only applies on page load. You can change the view mode anytime using the buttons in the editor (changes are session-only and won't be saved). Split view will automatically fallback to editor-only on mobile/small screens.
                            </p>
                        </div>
                        <select
                            value={mounted ? defaultEditorMode : 'both'}
                            onChange={(e) => {
                                const newValue = e.target.value as 'both' | 'editor' | 'preview';
                                setDefaultEditorMode(newValue);
                                updateSetting('defaultEditorMode', newValue);
                            }}
                            disabled={!mounted}
                            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        >
                            <option value="both">Split View</option>
                            <option value="editor">Editor Only</option>
                            <option value="preview">Preview Only</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Keyboard Shortcuts</p>
                            <p className="text-xs text-muted-foreground">
                                Enable keyboard shortcuts for quick actions
                            </p>
                        </div>
                        <Button
                            variant={mounted && keyboardShortcuts ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                                const newValue = !keyboardShortcuts;
                                setKeyboardShortcuts(newValue);
                                updateSetting('keyboardShortcuts', newValue);
                            }}
                            disabled={!mounted}
                        >
                            {mounted ? (keyboardShortcuts ? "On" : "Off") : "..."}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex-1">
                            <p className="text-sm font-medium mb-1">Items Per Page</p>
                            <p className="text-xs text-muted-foreground">
                                Number of files to show per page in the Files page
                            </p>
                        </div>
                        <select
                            value={mounted ? itemsPerPage : 12}
                            onChange={(e) => {
                                const newValue = Number(e.target.value);
                                setItemsPerPage(newValue);
                                updateSetting('itemsPerPage', newValue);
                            }}
                            disabled={!mounted}
                            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        >
                            <option value={6}>6</option>
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                            <option value={96}>96</option>
                        </select>
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
                                        <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl/Cmd + N</kbd>
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
                            {conflicts.map((conflict: any, index: number) => {
                                const fileKey = conflict.imported.id || conflict.imported.filename;
                                // First conflict defaults to 'skip', others use last chosen action or 'skip'
                                const currentAction = conflictActions.get(fileKey) || (index === 0 ? 'skip' : lastChosenAction);
                                const isApplied = appliedFiles.has(fileKey);
                                
                                const handleActionClick = (action: 'skip' | 'replace' | 'keepBoth') => {
                                    const newActions = new Map(conflictActions);
                                    
                                    // Set action for this file (just select, don't apply yet)
                                    newActions.set(fileKey, action);
                                    
                                    // Set same action for all remaining conflicts (as selection)
                                    conflicts.forEach((c: any, idx: number) => {
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
                                
                                const handleActionDoubleClick = (action: 'skip' | 'replace' | 'keepBoth') => {
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
                                    const singleFileActions = new Map<string, 'skip' | 'replace' | 'keepBoth'>();
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
                                                    <p className="font-semibold truncate" title={conflict.imported.filename}>{conflict.imported.filename}</p>
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
                                                    <p className="font-semibold truncate" title={conflict.existing.filename}>{conflict.existing.filename}</p>
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
                                    const allActions = new Map<string, 'skip' | 'replace' | 'keepBoth'>();
                                    
                                    // Apply the last chosen action to all unapplied files
                                    conflicts.forEach((conflict: any) => {
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

