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
    showEditorStatusBar: boolean;
    showSpellChecker: boolean;
    filesLayout: 'grid' | 'tree';
    /** Soft-delete files/projects into Trash (default on). */
    trashEnabled: boolean;
    /** Default password offered in Share compose (also Settings #password). */
    defaultSharePassword: string;
}

export interface Project {
    id: string;
    name: string;
    createdAt: string;
    /** Bound remote share id (Phase D) */
    shareId?: string;
    /** Local-only password for mutate/delete of that share */
    sharePassword?: string;
}

export interface SavedFile {
    id: string;
    filename: string;
    content?: string;
    timestamp?: string;
    editing?: boolean; // Mark file as currently being edited
    projectId?: string; // Virtual project / folder (optional)
    /** Bound remote share id (Phase D) */
    shareId?: string;
    /** Local-only password for mutate/delete of that share */
    sharePassword?: string;
}

export type TrashEntry =
    | {
          id: string;
          kind: 'file';
          trashedAt: string;
          file: SavedFile;
          content: string;
      }
    | {
          id: string;
          kind: 'project';
          trashedAt: string;
          project: Project;
          /** File ids that belonged to the project at delete time. */
          fileIds: string[];
      };

const TRASH_MAX = 50;

export interface SharedLink {
    id: string;
    shareId: string;
    url: string;
    preview?: string; // First 100 chars of content
    filename?: string;
    timestamp: string;
    /** Local-only — enables remote DELETE from Shares page */
    password?: string;
    expiresAt?: string;
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
        PROJECTS: 'mdviewer_projects',
        TRASH: 'mdviewer_trash',
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
                showEditorStatusBar: parsed.showEditorStatusBar ?? true,
                showSpellChecker: parsed.showSpellChecker ?? true,
                filesLayout: parsed.filesLayout === 'tree' ? 'tree' : 'grid',
                trashEnabled: parsed.trashEnabled ?? true,
                defaultSharePassword: parsed.defaultSharePassword ?? '',
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
                showEditorStatusBar: true,
                showSpellChecker: true,
                filesLayout: 'grid',
                trashEnabled: true,
                defaultSharePassword: '',
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
                showEditorStatusBar: settings.showEditorStatusBar ?? current?.showEditorStatusBar ?? true,
                showSpellChecker: settings.showSpellChecker ?? current?.showSpellChecker ?? true,
                filesLayout: settings.filesLayout ?? current?.filesLayout ?? 'grid',
                trashEnabled: settings.trashEnabled ?? current?.trashEnabled ?? true,
                defaultSharePassword:
                    settings.defaultSharePassword ?? current?.defaultSharePassword ?? '',
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
    // ============================================
    // Projects (virtual folders)
    // ============================================

    getProjects(): Project[] {
        if (typeof window === 'undefined') return [];
        try {
            const data = localStorage.getItem(this.KEYS.PROJECTS);
            if (!data) return [];
            return JSON.parse(data) as Project[];
        } catch {
            return [];
        }
    }

    setProjects(projects: Project[]): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(this.KEYS.PROJECTS, JSON.stringify(projects));
        window.dispatchEvent(new Event('storage'));
    }

    upsertProject(project: Project): void {
        const projects = this.getProjects();
        const idx = projects.findIndex((p) => p.id === project.id);
        if (idx >= 0) {
            projects[idx] = project;
        } else {
            projects.push(project);
        }
        this.setProjects(projects);
    }

    removeProject(projectId: string): void {
        this.setProjects(this.getProjects().filter((p) => p.id !== projectId));
        // Unassign files from deleted project
        const files = this.getSavedFiles().map((f) =>
            f.projectId === projectId ? { ...f, projectId: undefined } : f
        );
        this.setSavedFiles(files);
    }

    // ============================================
    // Trash (soft-delete)
    // ============================================

    isTrashEnabled(): boolean {
        return this.getSetting('trashEnabled') ?? true;
    }

    getTrash(): TrashEntry[] {
        if (typeof window === 'undefined') return [];
        try {
            const data = localStorage.getItem(this.KEYS.TRASH);
            if (!data) return [];
            const parsed = JSON.parse(data) as TrashEntry[];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    setTrash(entries: TrashEntry[]): void {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(this.KEYS.TRASH, JSON.stringify(entries.slice(0, TRASH_MAX)));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error saving trash:', error);
            throw error;
        }
    }

    /** Soft-delete a file into trash (or hard-delete if trash disabled). */
    trashOrDeleteFile(fileId: string): { success: boolean; soft: boolean; error?: string } {
        const file = this.findSavedFileById(fileId);
        if (!file) return { success: false, soft: false, error: 'File not found' };

        if (!this.isTrashEnabled()) {
            this.removeFileContent(file.filename);
            this.removeSavedFile(fileId);
            return { success: true, soft: false };
        }

        const content = this.getFileContent(file.filename) || '';
        const entry: TrashEntry = {
            id: `trash_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            kind: 'file',
            trashedAt: new Date().toISOString(),
            file: {
                id: file.id,
                filename: file.filename,
                timestamp: file.timestamp,
                projectId: file.projectId,
            },
            content,
        };
        const trash = [entry, ...this.getTrash()].slice(0, TRASH_MAX);
        this.setTrash(trash);
        this.removeFileContent(file.filename);
        this.removeSavedFile(fileId);
        return { success: true, soft: true };
    }

    /** Soft-delete a project into trash (or hard-delete if trash disabled). */
    trashOrDeleteProject(projectId: string): { success: boolean; soft: boolean; error?: string } {
        const project = this.getProjects().find((p) => p.id === projectId);
        if (!project) return { success: false, soft: false, error: 'Project not found' };

        const fileIds = this.getSavedFiles()
            .filter((f) => f.projectId === projectId)
            .map((f) => f.id);

        if (!this.isTrashEnabled()) {
            this.removeProject(projectId);
            return { success: true, soft: false };
        }

        const entry: TrashEntry = {
            id: `trash_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            kind: 'project',
            trashedAt: new Date().toISOString(),
            project,
            fileIds,
        };
        const trash = [entry, ...this.getTrash()].slice(0, TRASH_MAX);
        this.setTrash(trash);
        this.removeProject(projectId);
        return { success: true, soft: true };
    }

    restoreTrashEntry(entryId: string): { success: boolean; error?: string } {
        const trash = this.getTrash();
        const entry = trash.find((e) => e.id === entryId);
        if (!entry) return { success: false, error: 'Not found in trash' };

        if (entry.kind === 'file') {
            let filename = entry.file.filename;
            const existing = this.getSavedFiles();
            if (existing.some((f) => f.filename === filename)) {
                const base = filename.replace(/\.md$/i, '');
                let n = 1;
                while (existing.some((f) => f.filename === `${base}-restored-${n}.md`)) n += 1;
                filename = `${base}-restored-${n}.md`;
            }
            const id =
                entry.file.id && !existing.some((f) => f.id === entry.file.id)
                    ? entry.file.id
                    : `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            this.setFileContent(filename, entry.content);
            this.upsertSavedFile({
                id,
                filename,
                timestamp: new Date().toISOString(),
                projectId: entry.file.projectId,
            });
        } else {
            let name = entry.project.name;
            const projects = this.getProjects();
            if (projects.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
                let n = 1;
                while (
                    projects.some(
                        (p) => p.name.toLowerCase() === `${entry.project.name} (${n})`.toLowerCase()
                    )
                ) {
                    n += 1;
                }
                name = `${entry.project.name} (${n})`;
            }
            const id =
                entry.project.id && !projects.some((p) => p.id === entry.project.id)
                    ? entry.project.id
                    : `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            this.upsertProject({
                id,
                name,
                createdAt: entry.project.createdAt || new Date().toISOString(),
            });
            const files = this.getSavedFiles().map((f) =>
                entry.fileIds.includes(f.id) ? { ...f, projectId: id } : f
            );
            this.setSavedFiles(files);
        }

        this.setTrash(trash.filter((e) => e.id !== entryId));
        return { success: true };
    }

    purgeTrashEntry(entryId: string): void {
        this.setTrash(this.getTrash().filter((e) => e.id !== entryId));
    }

    emptyTrash(): void {
        this.setTrash([]);
    }

    /** Restore every trash entry (newest-first order preserved via restore). */
    restoreAllTrash(): { restored: number; failed: number } {
        const ids = this.getTrash().map((e) => e.id);
        let restored = 0;
        let failed = 0;
        for (const id of ids) {
            const result = this.restoreTrashEntry(id);
            if (result.success) restored += 1;
            else failed += 1;
        }
        return { restored, failed };
    }

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
        } catch {}
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
        } catch {}
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
        } catch {}
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
            localStorage.removeItem('mdviewer_api_override');
            localStorage.removeItem('mdviewer_projects');
            localStorage.removeItem(this.KEYS.TRASH);
            
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
                showEditorStatusBar: true,
                defaultSharePassword: '',
                showSpellChecker: true,
                filesLayout: 'grid',
                trashEnabled: true,
            };
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(defaultSettings));
            
            // Dispatch storage event for cross-component sync
            window.dispatchEvent(new Event('storage'));
        } catch {}
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
export const setSettings = (settings: Partial<SettingsData>) => storage.setSettings(settings);
export const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => storage.updateSetting(key, value);

export const getContent = () => storage.getContent();
export const setContent = (content: string) => storage.setContent(content);

export const getEditingFile = () => storage.getEditingFile();
export const setEditingFile = (filename: string) => storage.setEditingFile(filename);

export const getSavedFiles = () => storage.getSavedFiles();
export const setSavedFiles = (files: SavedFile[]) => storage.setSavedFiles(files);
export const upsertSavedFile = (file: SavedFile) => storage.upsertSavedFile(file);
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

export const getProjects = () => storage.getProjects();
export const setProjects = (projects: Project[]) => storage.setProjects(projects);
export const upsertProject = (project: Project) => storage.upsertProject(project);

export const isTrashEnabled = () => storage.isTrashEnabled();
export const getTrash = () => storage.getTrash();
export const trashOrDeleteFile = (fileId: string) => storage.trashOrDeleteFile(fileId);
export const trashOrDeleteProject = (projectId: string) => storage.trashOrDeleteProject(projectId);
export const restoreTrashEntry = (entryId: string) => storage.restoreTrashEntry(entryId);
export const purgeTrashEntry = (entryId: string) => storage.purgeTrashEntry(entryId);
export const emptyTrash = () => storage.emptyTrash();
export const restoreAllTrash = () => storage.restoreAllTrash();

