/**
 * Centralized Storage System
 * 
 * This module provides a unified interface for all localStorage operations
 * to prevent duplication, errors, and ensure consistency across the app.
 */

export interface SettingsData {
    showDefaultContent: boolean;
    theme: 'light' | 'dark' | 'system';
    keyboardShortcuts: boolean;
    autoSave: boolean;
    itemsPerPage: number;
    defaultEditorMode: 'both' | 'editor' | 'preview';
}

export interface SavedFile {
    id: string;
    filename: string;
    content?: string;
    timestamp?: string;
    editing?: boolean; // Mark file as currently being edited
}

export interface SharedLink {
    id: string;
    shareId: string;
    url: string;
    preview?: string; // First 100 chars of content
    filename?: string;
    timestamp: string;
}

class StorageManager {
    private static instance: StorageManager;
    
    // Storage keys
    private readonly KEYS = {
        SETTINGS: 'mdviewer_settings',
        CONTENT: 'mdviewer_content',
        EDITING_FILE: 'mdviewer_editing_file',
        SAVED_FILES: 'mdviewer_saved_files',
        FILE_PREFIX: 'mdviewer_file_',
        ACTIVATE_DISMISSED: 'mdviewer_activate_dismissed',
        SHARED_LINKS: 'mdviewer_shared_links',
        TEMP_FILE: 'mdviewer_temp_file', // Temporary unsaved content
    } as const;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): StorageManager {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }

    // ============================================
    // Settings Operations
    // ============================================

    /**
     * Get all settings
     */
    getSettings(): SettingsData | null {
        if (typeof window === 'undefined') return null;
        
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            if (!data) return null;
            
            const parsed = JSON.parse(data) as Partial<SettingsData>;
            
            // Return with defaults for missing values
            return {
                showDefaultContent: parsed.showDefaultContent ?? true,
                theme: parsed.theme ?? 'system',
                keyboardShortcuts: parsed.keyboardShortcuts ?? true,
                autoSave: parsed.autoSave ?? true,
                itemsPerPage: parsed.itemsPerPage ?? 12,
                defaultEditorMode: parsed.defaultEditorMode ?? 'both',
            };
        } catch {
            return null;
        }
    }

    /**
     * Get a specific setting value
     */
    getSetting<K extends keyof SettingsData>(key: K): SettingsData[K] | null {
        const settings = this.getSettings();
        if (!settings) {
            // Return default values (first app usage)
            const defaults: SettingsData = {
                showDefaultContent: true,
                theme: 'system',
                keyboardShortcuts: true,
                autoSave: true,
                itemsPerPage: 12,
                defaultEditorMode: 'both',
            };
            return defaults[key];
        }
        return settings[key];
    }

    /**
     * Set settings (only call this on user action, not automatically)
     */
    setSettings(settings: Partial<SettingsData>): void {
        if (typeof window === 'undefined') return;
        
        try {
            const current = this.getSettings();
            const updated: SettingsData = {
                showDefaultContent: settings.showDefaultContent ?? current?.showDefaultContent ?? true,
                theme: settings.theme ?? current?.theme ?? 'system',
                keyboardShortcuts: settings.keyboardShortcuts ?? current?.keyboardShortcuts ?? true,
                autoSave: settings.autoSave ?? current?.autoSave ?? true,
                itemsPerPage: settings.itemsPerPage ?? current?.itemsPerPage ?? 12,
                defaultEditorMode: settings.defaultEditorMode ?? current?.defaultEditorMode ?? 'both',
            };
            
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(updated));
            // Trigger storage event for cross-tab/component sync
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    /**
     * Update a single setting (only call this on user action)
     */
    updateSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
        this.setSettings({ [key]: value } as Partial<SettingsData>);
    }

    // ============================================
    // File Content Operations
    // ============================================

    /**
     * Get current editor content
     */
    getContent(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(this.KEYS.CONTENT);
    }

    /**
     * Set current editor content (no event dispatch to avoid loops)
     */
    setContent(content: string): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(this.KEYS.CONTENT, content);
        // Don't dispatch storage event here - it causes infinite loops
        // Content is synced via editor state, not storage events
    }

    /**
     * Remove current editor content
     */
    removeContent(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.KEYS.CONTENT);
    }

    // ============================================
    // Editing File Operations
    // ============================================

    /**
     * Get currently editing file name (without .md extension)
     */
    getEditingFile(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(this.KEYS.EDITING_FILE);
    }

    /**
     * Set currently editing file name (without .md extension)
     */
    setEditingFile(filename: string): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(this.KEYS.EDITING_FILE, filename);
        window.dispatchEvent(new Event('storage'));
    }

    /**
     * Remove currently editing file
     */
    removeEditingFile(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.KEYS.EDITING_FILE);
        window.dispatchEvent(new Event('storage'));
    }

    // ============================================
    // Saved Files Metadata Operations
    // ============================================

    /**
     * Get all saved files metadata
     */
    getSavedFiles(): SavedFile[] {
        if (typeof window === 'undefined') return [];
        
        try {
            const data = localStorage.getItem(this.KEYS.SAVED_FILES);
            if (!data) return [];
            return JSON.parse(data) as SavedFile[];
        } catch {
            return [];
        }
    }

    /**
     * Set saved files metadata
     */
    setSavedFiles(files: SavedFile[]): void {
        if (typeof window === 'undefined') return;
        
        try {
            localStorage.setItem(this.KEYS.SAVED_FILES, JSON.stringify(files));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error saving files metadata:', error);
        }
    }

    /**
     * Add or update a file in saved files metadata
     */
    upsertSavedFile(file: SavedFile): void {
        const files = this.getSavedFiles();
        const index = files.findIndex(f => f.id === file.id || f.filename === file.filename);
        
        if (index >= 0) {
            files[index] = file;
        } else {
            files.push(file);
        }
        
        this.setSavedFiles(files);
    }

    /**
     * Clear editing flag from all files
     */
    clearAllEditingFlags(): void {
        const files = this.getSavedFiles();
        const updated = files.map(f => ({ ...f, editing: false }));
        this.setSavedFiles(updated);
    }

    /**
     * Set a file as editing (only one file can be editing at a time)
     */
    setFileAsEditing(fileId: string): void {
        const files = this.getSavedFiles();
        // Clear all editing flags first
        const cleared = files.map(f => ({ ...f, editing: false }));
        // Set the specified file as editing
        const index = cleared.findIndex(f => f.id === fileId);
        if (index >= 0) {
            cleared[index] = { ...cleared[index], editing: true };
        }
        this.setSavedFiles(cleared);
    }

    /**
     * Get the file that is currently being edited
     */
    getEditingFileFromSavedFiles(): SavedFile | null {
        const files = this.getSavedFiles();
        const editingFile = files.find(f => f.editing === true);
        // If multiple files are marked as editing, clear all and return null
        const editingFiles = files.filter(f => f.editing === true);
        if (editingFiles.length > 1) {
            this.clearAllEditingFlags();
            return null;
        }
        return editingFile || null;
    }

    /**
     * Remove a file from saved files metadata
     */
    removeSavedFile(fileId: string): void {
        const files = this.getSavedFiles();
        const filtered = files.filter(f => f.id !== fileId);
        this.setSavedFiles(filtered);
    }

    /**
     * Find a file by ID
     */
    findSavedFileById(fileId: string): SavedFile | null {
        const files = this.getSavedFiles();
        return files.find(f => f.id === fileId) || null;
    }

    /**
     * Find a file by filename
     */
    findSavedFileByFilename(filename: string): SavedFile | null {
        const files = this.getSavedFiles();
        return files.find(f => f.filename === filename) || null;
    }

    // ============================================
    // Individual File Content Operations
    // ============================================

    /**
     * Get file content by filename
     */
    getFileContent(filename: string): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(`${this.KEYS.FILE_PREFIX}${filename}`);
    }

    /**
     * Set file content by filename
     */
    setFileContent(filename: string, content: string): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(`${this.KEYS.FILE_PREFIX}${filename}`, content);
    }

    /**
     * Remove file content by filename
     */
    removeFileContent(filename: string): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(`${this.KEYS.FILE_PREFIX}${filename}`);
    }

    // ============================================
    // Event Listeners
    // ============================================

    // ============================================
    // UI State Operations
    // ============================================

    /**
     * Get activate button dismissed state
     */
    getActivateButtonDismissed(): boolean {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(this.KEYS.ACTIVATE_DISMISSED) === 'true';
    }

    /**
     * Set activate button dismissed state
     */
    setActivateButtonDismissed(dismissed: boolean): void {
        if (typeof window === 'undefined') return;
        if (dismissed) {
            localStorage.setItem(this.KEYS.ACTIVATE_DISMISSED, 'true');
        } else {
            localStorage.removeItem(this.KEYS.ACTIVATE_DISMISSED);
        }
    }

    // ============================================
    // Shared Links Operations
    // ============================================

    /**
     * Get all shared links
     */
    getSharedLinks(): SharedLink[] {
        if (typeof window === 'undefined') return [];
        
        try {
            const data = localStorage.getItem(this.KEYS.SHARED_LINKS);
            if (!data) return [];
            return JSON.parse(data) as SharedLink[];
        } catch {
            return [];
        }
    }

    /**
     * Add a shared link
     */
    addSharedLink(link: SharedLink): void {
        if (typeof window === 'undefined') return;
        
        try {
            const links = this.getSharedLinks();
            // Remove duplicate if exists (by shareId)
            const filtered = links.filter(l => l.shareId !== link.shareId);
            // Add new link at the beginning (most recent first)
            filtered.unshift(link);
            // Keep only last 50 links
            const limited = filtered.slice(0, 50);
            localStorage.setItem(this.KEYS.SHARED_LINKS, JSON.stringify(limited));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            // Silently fail - don't use console.error
        }
    }

    /**
     * Remove a shared link by shareId
     */
    removeSharedLink(shareId: string): void {
        if (typeof window === 'undefined') return;
        
        try {
            const links = this.getSharedLinks();
            const filtered = links.filter(l => l.shareId !== shareId);
            localStorage.setItem(this.KEYS.SHARED_LINKS, JSON.stringify(filtered));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            // Silently fail - don't use console.error
        }
    }

    /**
     * Clear all shared links
     */
    clearSharedLinks(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.KEYS.SHARED_LINKS);
        window.dispatchEvent(new Event('storage'));
    }

    // ============================================
    // Temp File Operations
    // ============================================

    /**
     * Get temp file content (unsaved content without filename)
     * Only one temp file exists at a time
     */
    getTempFile(): string | null {
        if (typeof window === 'undefined') return null;
        
        try {
            const content = localStorage.getItem(this.KEYS.TEMP_FILE);
            return content || null;
        } catch {
            return null;
        }
    }

    /**
     * Set temp file content (unsaved content without filename)
     * Only one temp file exists at a time
     */
    setTempFile(content: string): void {
        if (typeof window === 'undefined') return;
        
        try {
            if (content.trim()) {
                localStorage.setItem(this.KEYS.TEMP_FILE, content);
            } else {
                // Clear temp file if content is empty
                this.clearTempFile();
            }
            // Dispatch storage event for cross-component sync
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error setting temp file:', error);
        }
    }

    /**
     * Clear temp file
     */
    clearTempFile(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.KEYS.TEMP_FILE);
        // Dispatch storage event for cross-component sync
        window.dispatchEvent(new Event('storage'));
    }

    /**
     * Clear ALL user data - completely reset the application
     * This removes:
     * - All saved files and their content
     * - Settings (resets to defaults)
     * - Temp file content
     * - Shared links
     * - Editing file flags
     * - Activate button dismissed state
     * - Legacy content storage
     */
    clearAllData(): void {
        if (typeof window === 'undefined') return;
        
        try {
            // Clear all saved files and their content
            const savedFiles = this.getSavedFiles();
            for (const file of savedFiles) {
                this.removeFileContent(file.filename);
            }
            localStorage.removeItem(this.KEYS.SAVED_FILES);
            
            // Clear all other storage keys
            localStorage.removeItem(this.KEYS.CONTENT);
            localStorage.removeItem(this.KEYS.EDITING_FILE);
            localStorage.removeItem(this.KEYS.TEMP_FILE);
            localStorage.removeItem(this.KEYS.SHARED_LINKS);
            localStorage.removeItem(this.KEYS.ACTIVATE_DISMISSED);
            
            // Clear all editing flags from saved files
            this.clearAllEditingFlags();
            
            // Reset settings to defaults (same as first app usage)
            const defaultSettings: SettingsData = {
                showDefaultContent: true,
                theme: 'system',
                keyboardShortcuts: true,
                autoSave: true,
                itemsPerPage: 12,
                defaultEditorMode: 'both',
            };
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(defaultSettings));
            
            // Dispatch storage event for cross-component sync
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error clearing all data:', error);
            throw error;
        }
    }

    /**
     * Listen for storage changes (both cross-tab StorageEvent and same-window custom events)
     */
    onStorageChange(callback: (key: string | null) => void): () => void {
        if (typeof window === 'undefined') return () => {};
        
        // Single handler for both cross-tab and same-window events
        const storageHandler = (e: StorageEvent | Event) => {
            // StorageEvent has a key property (cross-tab), custom events don't
            const key = (e instanceof StorageEvent) ? e.key : null;
            callback(key);
        };
        
        // Listen for both cross-tab StorageEvent and custom events
        window.addEventListener('storage', storageHandler);
        
        return () => {
            window.removeEventListener('storage', storageHandler);
        };
    }
}

// Export singleton instance
export const storage = StorageManager.getInstance();

// Export convenience functions
export const getSettings = () => storage.getSettings();
export const getSetting = <K extends keyof SettingsData>(key: K) => storage.getSetting(key);
export const setSettings = (settings: Partial<SettingsData>) => storage.setSettings(settings);
export const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => storage.updateSetting(key, value);

export const getContent = () => storage.getContent();
export const setContent = (content: string) => storage.setContent(content);
export const removeContent = () => storage.removeContent();

export const getEditingFile = () => storage.getEditingFile();
export const setEditingFile = (filename: string) => storage.setEditingFile(filename);
export const removeEditingFile = () => storage.removeEditingFile();

export const getSavedFiles = () => storage.getSavedFiles();
export const setSavedFiles = (files: SavedFile[]) => storage.setSavedFiles(files);
export const upsertSavedFile = (file: SavedFile) => storage.upsertSavedFile(file);
export const removeSavedFile = (fileId: string) => storage.removeSavedFile(fileId);
export const findSavedFileById = (fileId: string) => storage.findSavedFileById(fileId);
export const findSavedFileByFilename = (filename: string) => storage.findSavedFileByFilename(filename);

export const getFileContent = (filename: string) => storage.getFileContent(filename);
export const setFileContent = (filename: string, content: string) => storage.setFileContent(filename, content);
export const removeFileContent = (filename: string) => storage.removeFileContent(filename);

export const getActivateButtonDismissed = () => storage.getActivateButtonDismissed();
export const setActivateButtonDismissed = (dismissed: boolean) => storage.setActivateButtonDismissed(dismissed);

export const getSharedLinks = () => storage.getSharedLinks();
export const addSharedLink = (link: SharedLink) => storage.addSharedLink(link);
export const removeSharedLink = (shareId: string) => storage.removeSharedLink(shareId);
export const clearSharedLinks = () => storage.clearSharedLinks();

export const clearAllEditingFlags = () => storage.clearAllEditingFlags();
export const setFileAsEditing = (fileId: string) => storage.setFileAsEditing(fileId);

export const clearAllData = () => storage.clearAllData();
export const getEditingFileFromSavedFiles = () => storage.getEditingFileFromSavedFiles();

export const onStorageChange = (callback: (key: string | null) => void) => storage.onStorageChange(callback);

