"use client";

import { useState } from "react";
import { toast } from "sonner";
import { setSettings as updateSettings, getSavedFiles, setSavedFiles, getFileContent, setFileContent, setContent, setEditingFile, type SettingsData } from "@/lib/storage";
import { encodeBase64, decodeBase64, decryptData, isEncryptedFormat } from "@/lib/utils";

interface ConflictFile {
    imported: any;
    existing: any;
    conflictType: 'filename' | 'id';
}

export function useImportExport() {
    const [conflicts, setConflicts] = useState<ConflictFile[]>([]);
    const [pendingImport, setPendingImport] = useState<any>(null);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
    const [showInvalidFilesDialog, setShowInvalidFilesDialog] = useState(false);
    const [showPasswordPanel, setShowPasswordPanel] = useState(false);
    const [pendingEncryptedFile, setPendingEncryptedFile] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const performImport = async (data: any, conflictActions: Map<string, 'skip' | 'replace' | 'keepBoth'> = new Map(), onSettingsUpdate?: (settings: any) => void, keepDialogOpen?: boolean) => {
        try {
            // Import settings
            if (data.settings) {
                const settings: SettingsData = {
                    showDefaultContent: data.settings.showDefaultContent ?? false,
                    keyboardShortcuts: data.settings.keyboardShortcuts ?? true,
                    autoSave: data.settings.autoSave ?? true,
                    theme: data.settings.theme || 'system',
                    itemsPerPage: data.settings.itemsPerPage ?? 12,
                };
                updateSettings(settings);
                // Call callback if provided
                if (onSettingsUpdate) {
                    onSettingsUpdate(settings);
                }
            }

            // Process files based on conflict actions
            const filesToImport: any[] = [];
            const existingFiles = getSavedFiles();
            
            for (const file of data.files) {
                const fileKey = file.id || file.filename;
                const action = conflictActions.get(fileKey);
                
                if (action === 'skip') continue;
                
                if (action === 'keepBoth') {
                    // Rename file and generate new ID
                    const nameWithoutExt = file.filename.replace(/\.md$/i, '');
                    const ext = file.filename.match(/\.md$/i) ? '.md' : '';
                    let newName = `${nameWithoutExt}-1${ext}`;
                    let counter = 1;
                    while (existingFiles.some((f: any) => f.filename === newName)) {
                        newName = `${nameWithoutExt}-${++counter}${ext}`;
                    }
                    filesToImport.push({
                        ...file,
                        filename: newName,
                        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                    });
                } else {
                    filesToImport.push(file);
                }
            }
            
            // Use web storage (localStorage) for all files
            const savedFiles = getSavedFiles();
            filesToImport.forEach((file) => {
                setFileContent(file.filename, file.content || '');
                const existingIndex = savedFiles.findIndex((f: any) => f.filename === file.filename);
                const fileData = {
                    id: file.id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                    filename: file.filename,
                    timestamp: file.timestamp || new Date().toISOString(),
                };
                existingIndex >= 0 ? savedFiles[existingIndex] = fileData : savedFiles.push(fileData);
            });
            setSavedFiles(savedFiles);

            // Import current content if exists
            if (data.currentContent) {
                setContent(data.currentContent);
            }

            // Import editing file if exists
            if (data.editingFile) {
                setEditingFile(data.editingFile);
            }

            if (!keepDialogOpen) {
                const allConflictsResolved = conflicts.length > 0 && conflicts.every((c: ConflictFile) => 
                    conflictActions.has(c.imported.id || c.imported.filename)
                );
                
                if (allConflictsResolved) {
                    toast.success("Data imported successfully! Please refresh the page.");
                    setConflicts([]);
                    setPendingImport(null);
                    setShowConflictDialog(false);
                } else {
                    const appliedCount = conflictActions.size;
                    if (appliedCount > 0) {
                        toast.success(`${appliedCount} file(s) imported. Continue resolving remaining conflicts.`);
                    }
                }
            } else {
                toast.success("File imported successfully!");
            }
        } catch (error) {
            toast.error("Failed to import data");
            console.error(error);
        }
    };

    const tryDecryptFile = async (fileText: string, password: string): Promise<any> => {
        // Try new AES-GCM format first, then fallback to old format
        try {
            return JSON.parse(await decryptData(fileText, password));
        } catch {
            // Try old format
            try {
                const decoded = decodeBase64(fileText);
                const passwordHash = encodeBase64(password).substring(0, 16);
                if (decoded.startsWith(passwordHash + ':')) {
                    return JSON.parse(decoded.substring(passwordHash.length + 1));
                }
                throw new Error("Incorrect password");
            } catch {
                throw new Error("Incorrect password or corrupted file");
            }
        }
    };

    const handleImport = async (importPassword?: string) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const text = await file.text();
                
                if (!text || text.trim().length === 0) {
                    toast.error("File is empty");
                    return;
                }

                let data: any;

                if (isEncryptedFormat(text)) {
                    if (!importPassword?.trim()) {
                        setPendingEncryptedFile(text);
                        setShowPasswordPanel(true);
                        setPasswordError(null);
                        return;
                    }
                    try {
                        data = await tryDecryptFile(text, importPassword);
                    } catch (error) {
                        const errorMsg = error instanceof Error ? error.message : "Unknown error";
                        setPasswordError(errorMsg.includes("password") || errorMsg.includes("Incorrect")
                            ? "Incorrect password. Please try again."
                            : errorMsg.includes("corrupted") || errorMsg.includes("Corrupted")
                            ? "File appears to be corrupted. Please verify the file is complete."
                            : "Decryption failed: " + errorMsg);
                        return;
                    }
                } else {
                    try {
                        const trimmedText = text.trim();
                        if (!trimmedText) {
                            toast.error("File is empty");
                            return;
                        }
                        data = JSON.parse(trimmedText);
                        if (!data || typeof data !== 'object') {
                            toast.error("Invalid file format. Expected a JSON object.");
                            return;
                        }
                    } catch {
                        if (text.length > 100 && /^[A-Za-z0-9+/=]+$/.test(text.trim())) {
                            toast.error("File appears to be encrypted. Please try entering a password.");
                        } else {
                            toast.error("Invalid file format. The file is not valid JSON.");
                        }
                        return;
                    }
                }

                // Process decrypted data
                await processDecryptedData(data);
            } catch (error) {
                toast.error("Failed to import data");
                console.error(error);
            }
        };
        input.click();
    };

    const processDecryptedData = async (data: any) => {
        if (!data.version || !data.files) {
            toast.error("Invalid backup file format");
            return;
        }

        // Validate and filter files
        const validFiles: any[] = [];
        const invalidFilesList: string[] = [];
        
        data.files.forEach((file: any, i: number) => {
            if (!file || typeof file !== 'object' || !file.filename?.trim() || !file.id?.trim()) {
                invalidFilesList.push(`File ${i + 1}: ${!file ? 'Invalid object' : !file.filename?.trim() ? 'Missing filename' : 'Missing ID'}`);
                return;
            }
            validFiles.push(file);
        });
        
        if (invalidFilesList.length > 0) {
            setInvalidFiles(invalidFilesList);
            setShowInvalidFilesDialog(true);
            if (validFiles.length > 0) {
                toast.warning(`${validFiles.length} valid file(s) will be imported. ${invalidFilesList.length} invalid file(s) skipped.`, { duration: 6000 });
            }
        }
        
        if (validFiles.length === 0) {
            toast.error("No valid files to import");
            return;
        }

        // Check for conflicts
        const existingFiles = getSavedFiles();
        const conflictList: ConflictFile[] = validFiles
            .map((importedFile: any) => {
                const existing = existingFiles.find((f: any) => 
                    f.filename === importedFile.filename || (f.id && importedFile.id && f.id === importedFile.id)
                );
                return existing ? {
                    imported: importedFile,
                    existing,
                    conflictType: existingFiles.some((f: any) => f.filename === importedFile.filename) ? 'filename' : 'id',
                } : null;
            })
            .filter(Boolean) as ConflictFile[];

        if (conflictList.length > 0) {
            setConflicts(conflictList);
            setPendingImport({ ...data, files: validFiles });
            setShowConflictDialog(true);
            return;
        }

        await performImport({ ...data, files: validFiles });
    };

    const handlePasswordSubmit = async (password: string) => {
        if (!pendingEncryptedFile) return;
        setPasswordError(null);
        
        try {
            const data = await tryDecryptFile(pendingEncryptedFile, password);
            setShowPasswordPanel(false);
            setPendingEncryptedFile(null);
            setPasswordError(null);
            await processDecryptedData(data);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : "Unknown error";
            setPasswordError(errorMsg.includes("password") || errorMsg.includes("Incorrect")
                ? "Incorrect password. Please try again."
                : errorMsg.includes("corrupted") || errorMsg.includes("Corrupted")
                ? "File appears to be corrupted. Please verify the file is complete."
                : "Decryption failed: " + errorMsg);
        }
    };

    const closePasswordPanel = () => {
        setShowPasswordPanel(false);
        setPendingEncryptedFile(null);
        setPasswordError(null);
    };

    const handleConflictResolution = async (conflictActions: Map<string, 'skip' | 'replace' | 'keepBoth'>, onSettingsUpdate?: (settings: any) => void, keepDialogOpen?: boolean) => {
        if (!pendingImport) return;
        await performImport(pendingImport, conflictActions, onSettingsUpdate, keepDialogOpen);
    };

    return {
        conflicts,
        pendingImport,
        showConflictDialog,
        setShowConflictDialog,
        handleImport,
        handleConflictResolution,
        invalidFiles,
        showInvalidFilesDialog,
        setShowInvalidFilesDialog,
        showPasswordPanel,
        setShowPasswordPanel,
        pendingEncryptedFile,
        passwordError,
        handlePasswordSubmit,
        closePasswordPanel,
    };
}


