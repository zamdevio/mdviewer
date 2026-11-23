
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Loader2, FileText, Trash2, Edit3, Pencil, Check, X, Database, Clock, HardDrive, Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, LayoutGrid, FolderTree, Upload } from "lucide-react";
import { toast } from "sonner";
import { getSettings, updateSetting, getSavedFiles, setSavedFiles, getFileContent, setFileContent, upsertSavedFile, onStorageChange, clearAllEditingFlags, getEditingFileFromSavedFiles, getProjects, upsertProject, trashOrDeleteFile, trashOrDeleteProject, isTrashEnabled, addSharedLink, type SavedFile, type Project } from "@/lib/storage";
import { truncateFilenameForDisplay, truncateFilename, validateFileName, sanitizeFileName, MAX_FILENAME_LENGTH, renameFile, processImportedFile, saveFile } from "@/lib/editor";
import { FilesTree } from "@/components/pages/files/FilesTree";
import { ProjectPicker } from "@/components/pages/files/ProjectPicker";
import { packProject } from "@/lib/project-pack";
import {
    uploadMarkdown,
    replaceSharedMarkdown,
    patchShareViewProtect,
    isCorsFailure,
} from "@/lib/api";
import { isApiConfigured, getEffectiveApiConfig } from "@/lib/config";
import { ShareComposeDialog, type ShareComposeConfirm } from "@/components/share/ShareComposeDialog";
import { SharePanel } from "@/components/pages/editor/dialogs/Share";

export default function FilesPage(): React.JSX.Element {
    const [files, setFiles] = useState<SavedFile[]>([]);
    const [projects, setProjectsState] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [renamingFile, setRenamingFile] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [showDeleteWarning, setShowDeleteWarning] = useState<{ filename: string; fileId?: string } | null>(null);
    const [showDeleteProject, setShowDeleteProject] = useState<Project | null>(null);
    const navigate = useNavigate();
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [currentPage, setCurrentPage] = useState(1);
    const [filesLayout, setFilesLayout] = useState<'grid' | 'tree'>('grid');
    const [projectPickerFor, setProjectPickerFor] = useState<string | null>(null);
    const [shareTarget, setShareTarget] = useState<
        | { kind: "file"; file: SavedFile }
        | { kind: "project"; project: Project }
        | null
    >(null);
    const [shareSubmitting, setShareSubmitting] = useState(false);
    const [shareSuccessUrl, setShareSuccessUrl] = useState<string | null>(null);
    const [shareSuccessExpires, setShareSuccessExpires] = useState<string | null>(null);
    const [shareSuccessName, setShareSuccessName] = useState<string | null>(null);

    // Load items per page setting
    useEffect(() => {
        const settings = getSettings();
        if (settings && settings.itemsPerPage) {
            setItemsPerPage(settings.itemsPerPage);
        }
        if (settings?.filesLayout) {
            setFilesLayout(settings.filesLayout);
        }
        
        // Listen for settings changes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'mdviewer_settings' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    if (parsed.itemsPerPage) {
                        setItemsPerPage(parsed.itemsPerPage);
                        setCurrentPage(1); // Reset to first page when items per page changes
                    }
                    if (parsed.filesLayout === 'tree' || parsed.filesLayout === 'grid') {
                        setFilesLayout(parsed.filesLayout);
                    }
                } catch {
                    // Ignore
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        loadFiles();
        // Check which file is currently being edited using lib/editor function
        const editingFileData = getEditingFileFromSavedFiles();
        if (editingFileData) {
            setEditingFileId(editingFileData.id);
        }
        
        // Listen for storage changes to sync with editor (only reload if files actually changed)
        const unsubscribe = onStorageChange((key) => {
            // Only reload if mdviewer_saved_files / projects changed, not just editing_file
            if (key === 'mdviewer_saved_files' || key === 'mdviewer_projects' || key === null) {
                loadFiles();
                // Update editing file status after reloading files
                const editingFileData = getEditingFileFromSavedFiles();
                if (editingFileData) {
                    setEditingFileId(editingFileData.id);
                } else {
                    setEditingFileId(null);
                }
            }
        });
        
        // Check for editing file changes (but don't reload files unnecessarily)
        const interval = setInterval(() => {
            const editingFileData = getEditingFileFromSavedFiles();
            const currentEditingFileId = editingFileData?.id || null;
            if (currentEditingFileId !== editingFileId) {
                setEditingFileId(currentEditingFileId);
            }
        }, 2000);
        
        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, [ editingFileId ]);

    const loadFiles = async () => {
        setLoading(true);
        try {
            // Load from storage - use IDs as primary identifier
            const savedFiles = getSavedFiles();
            // Use Map to deduplicate by ID (allows multiple files with same name but different IDs)
            const filesById = new Map<string, SavedFile>();
            let needsUpdate = false;
            
            savedFiles.forEach((file: SavedFile) => {
                if (file.id) {
                    // File has ID - use it as unique key (allows duplicates by name)
                    if (!filesById.has(file.id)) {
                        filesById.set(file.id, file);
                    }
                } else {
                    // File missing ID - generate once and save
                    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                    const fileWithId = { ...file, id: fileId };
                    filesById.set(fileId, fileWithId);
                    needsUpdate = true;
                }
            });
            
            // Update storage if any files were missing IDs (one-time operation)
            if (needsUpdate) {
                setSavedFiles(Array.from(filesById.values()));
            }
            
            // Get the currently editing file to check editing status
            const editingFileData = getEditingFileFromSavedFiles();
            const editingFileId = editingFileData?.id || null;
            
            setProjectsState(getProjects());

            const filesWithContent = Array.from(filesById.values()).map((file: SavedFile) => {
                const content = getFileContent(file.filename) || undefined;
                return {
                    id: file.id!,
                    filename: file.filename,
                    content,
                    timestamp: file.timestamp,
                    projectId: file.projectId,
                    editing: file.id === editingFileId, // Mark as editing if this file's ID matches
                };
            });
            setFiles(filesWithContent);
        } catch (error) {
            console.error('Error loading files:', error);
            toast.error("Failed to load files");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (filename: string, fileId?: string) => {
        setShowDeleteWarning({ filename, fileId });
    };

    const handleDeleteConfirm = async () => {
        if (!showDeleteWarning) return;
        
        const { filename, fileId } = showDeleteWarning;
        setShowDeleteWarning(null);
        
        try {
            const id =
                fileId ||
                getSavedFiles().find((f: SavedFile) => f.filename === filename)?.id;
            if (!id) {
                toast.error("File not found");
                return;
            }
            const result = trashOrDeleteFile(id);
            if (!result.success) {
                toast.error(result.error || "Failed to delete file");
                return;
            }
            toast.success(result.soft ? "Moved to Trash" : "File deleted");
            loadFiles();
        } catch (error) {
            toast.error("Failed to delete file: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const handleRename = (filename: string, fileId: string) => {
        const nameWithoutExt = filename.replace(/\.md$/i, '');
        setRenamingFile(fileId); // Use ID instead of filename
        setRenameValue(nameWithoutExt);
    };

    const handleRenameConfirm = async (fileId: string) => {
        if (!renameValue.trim()) {
            toast.error("Please enter a filename");
            return;
        }

        // Sanitize and validate filename
        const cleanName = sanitizeFileName(renameValue.trim());
        const validation = validateFileName(cleanName);
        if (!validation.valid) {
            toast.error(validation.error || "Invalid filename");
            return;
        }

        // Truncate if needed
        const truncatedName = truncateFilename(cleanName);
        const newName = truncatedName.replace(/\.md$/i, '');

        try {
            // Find file by ID to get current content
            const savedFiles = getSavedFiles();
            const file = savedFiles.find((f: SavedFile) => f.id === fileId);
            
            if (!file) {
                toast.error("File not found");
                return;
            }

            const oldFilename = file.filename;
            const oldNameWithoutExt = oldFilename.replace(/\.md$/i, '');

            if (newName === oldNameWithoutExt) {
                setRenamingFile(null);
                setRenameValue("");
                return;
            }

            // Get file content using the file ID (find by ID, then get content by filename)
            const content = getFileContent(oldFilename);

            if (!content) {
                toast.error("File content not found");
                return;
            }

            // Use the rename function from lib/editor which always uses file ID
            // This ensures we're always renaming by ID, not by filename
            const result = renameFile(fileId, newName, content);

            if (result.success && result.file) {
                // Editing file ID is preserved automatically by renameFile function
                // No need to update editingFileId here

                toast.success("File renamed");
                setRenamingFile(null);
                setRenameValue("");
                loadFiles();
            } else {
                toast.error(result.error || "Failed to rename file");
            }
        } catch (error) {
            toast.error("Failed to rename file: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const handleLoadToEditor = async (filename: string, content: string, fileId?: string) => {
        try {
            // Ensure file content is stored in file-specific storage
            setFileContent(filename, content);
            
            // Ensure file is in saved files list
            const savedFiles = getSavedFiles();
            const existingFile = fileId 
                ? savedFiles.find(f => f.id === fileId)
                : savedFiles.find(f => f.filename === filename);
            
            let targetFileId: string;
            if (!existingFile) {
                // File not in saved files list, add it
                targetFileId = fileId || `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                const newFile: SavedFile = {
                    id: targetFileId,
                    filename: filename,
                    timestamp: new Date().toISOString(),
                };
                upsertSavedFile(newFile);
            } else {
                targetFileId = existingFile.id;
            }
            
            // Navigate to editor with file ID - editor will handle temp content warning and set editing mode
            // Editor page will set editing mode after all checks (temp content, etc.)
            navigate(`/editor?file=${targetFileId}`);
        } catch (error) {
            toast.error("Failed to load file to editor: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const handleExport = (filename: string, content: string) => {
        try {
            if (!content) {
                toast.error("File content is empty");
                return;
            }

            // Ensure filename doesn't exceed limit
            const exportFilename = truncateFilename(filename);

            // Create blob and download
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = exportFilename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success(`File "${truncateFilenameForDisplay(exportFilename)}" exported successfully!`);
        } catch (error) {
            toast.error("Failed to export file: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    // Reset to first page when search/filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, sortOrder]);

    if (loading) {
        return (
            <div className="container mx-auto p-4 h-[calc(100vh-100px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading files...</p>
                </div>
            </div>
        );
    }

    // Filter and sort files
    const filteredFiles = files.filter(file => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return file.filename.toLowerCase().includes(query) || 
               file.id.toLowerCase().includes(query) ||
               (file.content && file.content.toLowerCase().includes(query));
    });

    const sortedFiles = [...filteredFiles].sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'name') {
            comparison = a.filename.localeCompare(b.filename);
        } else if (sortBy === 'date') {
            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            comparison = dateA - dateB;
        } else if (sortBy === 'size') {
            const sizeA = a.content?.length || 0;
            const sizeB = b.content?.length || 0;
            comparison = sizeA - sizeB;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const totalPages = Math.ceil(sortedFiles.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedFiles = sortedFiles.slice(startIndex, endIndex);

    // Calculate stats (from all files, not filtered)
    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + (file.content?.length || 0), 0);
    const lastEdit = files.length > 0 
        ? files.reduce((latest, file) => {
            if (!file.timestamp) return latest;
            const fileDate = new Date(file.timestamp);
            return !latest || fileDate > latest ? fileDate : latest;
        }, null as Date | null)
        : null;

    return (
        <div className={`container mx-auto p-4 min-h-[calc(100vh-100px)] flex flex-col gap-6 animate-fade-in`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Saved Files
                </h1>
                <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-md border border-border p-0.5">
                        <Button
                            type="button"
                            size="sm"
                            variant={filesLayout === 'grid' ? 'default' : 'ghost'}
                            className="gap-1.5 h-8"
                            onClick={() => {
                                setFilesLayout('grid');
                                updateSetting('filesLayout', 'grid');
                            }}
                            title="Grid layout"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline">Grid</span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={filesLayout === 'tree' ? 'default' : 'ghost'}
                            className="gap-1.5 h-8"
                            onClick={() => {
                                setFilesLayout('tree');
                                updateSetting('filesLayout', 'tree');
                            }}
                            title="Tree / projects layout"
                        >
                            <FolderTree className="w-4 h-4" />
                            <span className="hidden sm:inline">Tree</span>
                        </Button>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".md,.txt,text/markdown,text/plain";
                            input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (!file) return;
                                try {
                                    const { filename, content } =
                                        await processImportedFile(file);
                                    // Ungrouped: no projectId; keep import name (unique if clash)
                                    const result = saveFile(filename, content, null, true);
                                    if (!result.success || !result.file) {
                                        toast.error(
                                            result.error || "Failed to import file"
                                        );
                                        return;
                                    }
                                    clearAllEditingFlags();
                                    loadFiles();
                                    toast.success(
                                        `Imported “${truncateFilenameForDisplay(result.file.filename)}” (Ungrouped)`
                                    );
                                } catch (error) {
                                    toast.error(
                                        error instanceof Error
                                            ? error.message
                                            : "Failed to import file"
                                    );
                                }
                            };
                            input.click();
                        }}
                    >
                        <Upload className="w-4 h-4" />
                        <span className="hidden sm:inline">Import</span>
                    </Button>
                    <Link to="/editor?new" onClick={() => clearAllEditingFlags()}>
                        <Button variant="default" className="gap-2">
                            <Edit3 className="w-4 h-4" />
                            New Editor
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            {files.length > 0 && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Database className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Files</p>
                                <p className="text-2xl font-bold">{totalFiles}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <HardDrive className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Size</p>
                                <p className="text-2xl font-bold">
                                    {totalSize < 1024 
                                        ? `${totalSize} B` 
                                        : totalSize < 1024 * 1024 
                                        ? `${(totalSize / 1024).toFixed(1)} KB` 
                                        : `${(totalSize / (1024 * 1024)).toFixed(1)} MB`}
                                </p>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Last Edit</p>
                                <p className="text-sm font-semibold">
                                    {lastEdit 
                                        ? new Date(lastEdit).toLocaleDateString() + ' ' + new Date(lastEdit).toLocaleTimeString()
                                        : 'Never'}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Search and Filter Bar */}
            {files.length > 0 && (
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search files by name, ID, or content..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                        
                        {/* Sort */}
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                                className="px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="name">Sort by Name</option>
                                <option value="size">Sort by Size</option>
                            </select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="gap-2"
                                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                            >
                                <Filter className="w-4 h-4" />
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </Button>
                        </div>
                    </div>
                    
                    {/* Results count */}
                    {searchQuery && (
                        <p className="text-sm text-muted-foreground mt-3">
                            Found {filteredFiles.length} of {files.length} file(s)
                        </p>
                    )}
                </Card>
            )}

            {files.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">No saved files yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Save from the editor, or fork a shared link — files show up here for quick reopen.
                    </p>
                    <Button asChild>
                        <Link to="/editor?new" onClick={() => clearAllEditingFlags()}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Create a file
                        </Link>
                    </Button>
                </Card>
            ) : filteredFiles.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">No matches</h2>
                    <p className="text-muted-foreground mb-6">
                        Nothing matched “{searchQuery}”. Try another name or clear the filter.
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                        Clear search
                    </Button>
                </Card>
            ) : filesLayout === 'tree' ? (
                <FilesTree
                    projects={projects}
                    files={filteredFiles}
                    onOpenFile={(file) => {
                        if (file.content !== undefined) {
                            handleLoadToEditor(file.filename, file.content || '', file.id);
                        } else {
                            const content = getFileContent(file.filename) || '';
                            handleLoadToEditor(file.filename, content, file.id);
                        }
                    }}
                    onCreateProject={(name) => {
                        if (
                            projects.some(
                                (p) => p.name.toLowerCase() === name.toLowerCase()
                            )
                        ) {
                            toast.error("A project with that name already exists");
                            return;
                        }
                        const project: Project = {
                            id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                            name,
                            createdAt: new Date().toISOString(),
                        };
                        upsertProject(project);
                        setProjectsState(getProjects());
                        toast.success(`Project “${name}” created`);
                    }}
                    onRenameProject={(id, name) => {
                        const existing = projects.find((p) => p.id === id);
                        if (!existing) return;
                        const clash = projects.some(
                            (p) => p.id !== id && p.name.toLowerCase() === name.toLowerCase()
                        );
                        if (clash) {
                            toast.error("A project with that name already exists");
                            return;
                        }
                        upsertProject({ ...existing, name });
                        setProjectsState(getProjects());
                        toast.success("Project renamed");
                    }}
                    onDeleteProject={(id) => {
                        const project = projects.find((p) => p.id === id);
                        if (project) setShowDeleteProject(project);
                    }}
                    onAssignProject={(fileId, projectId) => {
                        const file = files.find((f) => f.id === fileId);
                        if (!file) return;
                        upsertSavedFile({
                            id: file.id,
                            filename: file.filename,
                            timestamp: file.timestamp,
                            projectId,
                            editing: file.editing,
                        });
                        loadFiles();
                    }}
                    onRenameFile={(fileId, name) => {
                        const file = files.find((f) => f.id === fileId);
                        if (!file) return;
                        const clean = sanitizeFileName(name.trim());
                        const validation = validateFileName(clean);
                        if (!validation.valid) {
                            toast.error(validation.error || "Invalid filename");
                            return;
                        }
                        const newName = truncateFilename(clean).replace(/\.md$/i, "");
                        const result = renameFile(
                            fileId,
                            newName,
                            getFileContent(file.filename) || file.content || ""
                        );
                        if (!result.success) {
                            toast.error(result.error || "Rename failed");
                            return;
                        }
                        toast.success("File renamed");
                        loadFiles();
                    }}
                    onDeleteFile={(file) => {
                        handleDelete(file.filename, file.id);
                    }}
                    onShareFile={(file) => {
                        if (!isApiConfigured()) {
                            toast.error("Configure share API in Settings");
                            return;
                        }
                        const content = getFileContent(file.filename) || file.content || "";
                        if (!content.trim()) {
                            toast.error("Nothing to share");
                            return;
                        }
                        setShareTarget({ kind: "file", file });
                    }}
                    onShareProject={(project) => {
                        if (!isApiConfigured()) {
                            toast.error("Configure share API in Settings");
                            return;
                        }
                        const kids = files.filter((f) => f.projectId === project.id);
                        if (kids.length === 0) {
                            toast.error("Project has no files to share");
                            return;
                        }
                        setShareTarget({ kind: "project", project });
                    }}
                />
            ) : (
                <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedFiles.map((file) => (
                        <Card key={file.id || file.filename} className="p-4 flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    {renamingFile === file.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={renameValue}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    // Limit to max filename length
                                                    if (value.length <= MAX_FILENAME_LENGTH) {
                                                        setRenameValue(value);
                                                    }
                                                }}
                                                onKeyPress={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleRenameConfirm(file.id);
                                                    } else if (e.key === "Escape") {
                                                        setRenamingFile(null);
                                                        setRenameValue("");
                                                    }
                                                }}
                                                maxLength={MAX_FILENAME_LENGTH}
                                                className="flex-1 px-2 py-1 rounded border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                autoFocus
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRenameConfirm(file.id)}
                                                className="h-6 w-6 p-0"
                                            >
                                                <Check className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setRenamingFile(null);
                                                    setRenameValue("");
                                                }}
                                                className="h-6 w-6 p-0"
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 min-w-0">
                                            <h3 className="font-semibold truncate flex-1" title={file.filename}>{truncateFilenameForDisplay(file.filename)}</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRename(file.filename, file.id)}
                                                className="h-6 w-6 p-0"
                                                title="Rename file"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                    {file.timestamp && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(file.timestamp).toLocaleString()}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1 font-mono truncate" title={file.id}>
                                        ID: <span className="truncate inline-block max-w-full">{file.id}</span>
                                    </p>
                                    <div className="relative mt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-between text-xs h-8"
                                            onClick={() =>
                                                setProjectPickerFor(
                                                    projectPickerFor === file.id ? null : file.id
                                                )
                                            }
                                        >
                                            <span className="truncate">
                                                {projects.find((p) => p.id === file.projectId)?.name ||
                                                    "Ungrouped"}
                                            </span>
                                            <span className="text-muted-foreground">▾</span>
                                        </Button>
                                        {projectPickerFor === file.id && (
                                            <div className="absolute left-0 right-0 top-full mt-1 z-20">
                                                <ProjectPicker
                                                    projects={projects}
                                                    currentProjectId={file.projectId}
                                                    onSelect={(projectId) => {
                                                        upsertSavedFile({
                                                            id: file.id,
                                                            filename: file.filename,
                                                            timestamp: file.timestamp,
                                                            projectId,
                                                            editing: file.editing,
                                                        });
                                                        loadFiles();
                                                    }}
                                                    onClose={() => setProjectPickerFor(null)}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {file.content && (
                                        <>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Size: {file.content.length < 1024 
                                                    ? `${file.content.length} B` 
                                                    : `${(file.content.length / 1024).toFixed(1)} KB`}
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                                {file.content.substring(0, 100)}
                                                {file.content.length > 100 ? "..." : ""}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {file.content && (
                                    <Button
                                        variant={editingFileId === file.id ? "default" : "default"}
                                        size="sm"
                                        onClick={() => handleLoadToEditor(file.filename, file.content!, file.id)}
                                        className="flex-1 gap-2"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        {editingFileId === file.id ? "Editing" : "Load"}
                                    </Button>
                                )}
                                {file.content && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleExport(file.filename, file.content!)}
                                        className="gap-2"
                                        title={`Export ${file.filename}`}
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(file.filename, file.id)}
                                    className="gap-2"
                                    disabled={editingFileId === file.id}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            {editingFileId === file.id && (
                                <div className="flex items-center gap-1 text-xs text-primary font-medium mt-1">
                                    <Edit3 className="w-3 h-3" />
                                    Currently editing in editor
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Card className="p-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} - {Math.min(endIndex, sortedFiles.length)} of {sortedFiles.length} file(s)
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="gap-1"
                                    title="First page"
                                >
                                    <ChevronsLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">First</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="gap-1"
                                    title="Previous page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Prev</span>
                                </Button>
                                
                                {/* Page numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum: number;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className="min-w-[2.5rem]"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="gap-1"
                                    title="Next page"
                                >
                                    <span className="hidden sm:inline">Next</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="gap-1"
                                    title="Last page"
                                >
                                    <span className="hidden sm:inline">Last</span>
                                    <ChevronsRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}
                </>
            )}

            <ConfirmDeleteDialog
                open={!!showDeleteWarning}
                title="Delete file"
                name={showDeleteWarning?.filename ?? null}
                description={
                    isTrashEnabled()
                        ? "It will move to Trash in Settings (you can restore later)."
                        : "This action cannot be undone!"
                }
                onConfirm={handleDeleteConfirm}
                onCancel={() => setShowDeleteWarning(null)}
            />

            <ConfirmDeleteDialog
                open={!!showDeleteProject}
                title="Delete project"
                name={showDeleteProject?.name ?? null}
                description={
                    isTrashEnabled()
                        ? "Project moves to Trash. Files become ungrouped until you restore."
                        : "Files in this project become ungrouped — they are not deleted."
                }
                confirmLabel="Delete project"
                onConfirm={() => {
                    if (!showDeleteProject) return;
                    const result = trashOrDeleteProject(showDeleteProject.id);
                    setShowDeleteProject(null);
                    if (!result.success) {
                        toast.error(result.error || "Failed to delete project");
                        return;
                    }
                    setProjectsState(getProjects());
                    loadFiles();
                    toast.success(result.soft ? "Project moved to Trash" : "Project deleted");
                }}
                onCancel={() => setShowDeleteProject(null)}
            />

            <ShareComposeDialog
                open={!!shareTarget}
                title={shareTarget?.kind === "project" ? "Share project" : "Share file"}
                filename={
                    shareTarget?.kind === "file"
                        ? shareTarget.file.filename
                        : shareTarget?.kind === "project"
                          ? shareTarget.project.name
                          : null
                }
                existingShareId={
                    shareTarget?.kind === "file"
                        ? shareTarget.file.shareId
                        : shareTarget?.kind === "project"
                          ? shareTarget.project.shareId
                          : null
                }
                existingViewPassword={
                    shareTarget?.kind === "file"
                        ? shareTarget.file.sharePassword
                        : shareTarget?.kind === "project"
                          ? shareTarget.project.sharePassword
                          : null
                }
                submitting={shareSubmitting}
                onClose={() => !shareSubmitting && setShareTarget(null)}
                onConfirm={async (opts: ShareComposeConfirm) => {
                    if (!shareTarget) return;
                    if (opts.mode === "existing") {
                        setShareTarget(null);
                        return;
                    }
                    const manageToken = getSettings()?.manageToken?.trim() ?? "";
                    if (!manageToken) {
                        toast.error("Manage token required — open Settings → Manage token");
                        return;
                    }
                    setShareSubmitting(true);
                    try {
                        const { FRONTEND_URL } = getEffectiveApiConfig();
                        const viewPassword = opts.viewProtected
                            ? opts.viewPassword || undefined
                            : undefined;
                        if (shareTarget.kind === "file") {
                            const file = shareTarget.file;
                            const content =
                                getFileContent(file.filename) || file.content || "";
                            let id: string;
                            let url: string;
                            let expiresAt: string | undefined;
                            if (opts.mode === "replace" && file.shareId) {
                                const updated = await replaceSharedMarkdown(
                                    file.shareId,
                                    content,
                                    manageToken,
                                    { filename: file.filename },
                                );
                                id = updated.id;
                                expiresAt = updated.expiresAt;
                                url = `${FRONTEND_URL}/share/${encodeURIComponent(id)}`;
                                await patchShareViewProtect(id, manageToken, {
                                    viewProtected: opts.viewProtected,
                                    viewPassword,
                                });
                            } else {
                                const result = await uploadMarkdown(content, {
                                    manageToken,
                                    viewPassword,
                                    ttlSeconds: opts.ttlSeconds,
                                    viewProtected: opts.viewProtected,
                                    filename: file.filename,
                                    type: "file",
                                });
                                id = result.id;
                                expiresAt = result.expiresAt;
                                url =
                                    result.frontendShareUrl ||
                                    `${FRONTEND_URL}/share/${encodeURIComponent(id)}`;
                            }
                            upsertSavedFile({
                                ...file,
                                shareId: id,
                                sharePassword: viewPassword,
                            });
                            addSharedLink({
                                id: `link_${Date.now()}`,
                                shareId: id,
                                url,
                                preview: content.slice(0, 100),
                                filename: file.filename,
                                timestamp: new Date().toISOString(),
                                password: viewPassword,
                                expiresAt,
                            });
                            setShareSuccessUrl(url);
                            setShareSuccessExpires(expiresAt ?? null);
                            setShareSuccessName(file.filename);
                        } else {
                            const project = shareTarget.project;
                            const kids = files.filter((f) => f.projectId === project.id);
                            const pack = packProject(
                                project.name,
                                kids.map((f) => ({
                                    filename: f.filename,
                                    content:
                                        getFileContent(f.filename) || f.content || "",
                                })),
                            );
                            let id: string;
                            let url: string;
                            let expiresAt: string | undefined;
                            if (opts.mode === "replace" && project.shareId) {
                                const updated = await replaceSharedMarkdown(
                                    project.shareId,
                                    pack,
                                    manageToken,
                                    { filename: `${project.name}.project.md` },
                                );
                                id = updated.id;
                                expiresAt = updated.expiresAt;
                                url = `${FRONTEND_URL}/share/${encodeURIComponent(id)}`;
                                await patchShareViewProtect(id, manageToken, {
                                    viewProtected: opts.viewProtected,
                                    viewPassword,
                                });
                            } else {
                                const result = await uploadMarkdown(pack, {
                                    manageToken,
                                    viewPassword,
                                    ttlSeconds: opts.ttlSeconds,
                                    viewProtected: opts.viewProtected,
                                    filename: `${project.name}.project.md`,
                                    type: "project",
                                });
                                id = result.id;
                                expiresAt = result.expiresAt;
                                url =
                                    result.frontendShareUrl ||
                                    `${FRONTEND_URL}/share/${encodeURIComponent(id)}`;
                            }
                            upsertProject({
                                ...project,
                                shareId: id,
                                sharePassword: viewPassword,
                            });
                            addSharedLink({
                                id: `link_${Date.now()}`,
                                shareId: id,
                                url,
                                preview: `Project: ${project.name} (${kids.length} files)`,
                                filename: `${project.name}.project`,
                                timestamp: new Date().toISOString(),
                                password: viewPassword,
                                expiresAt,
                            });
                            setShareSuccessUrl(url);
                            setShareSuccessExpires(expiresAt ?? null);
                            setShareSuccessName(project.name);
                            setProjectsState(getProjects());
                        }
                        loadFiles();
                        setShareTarget(null);
                        toast.success("Share ready");
                    } catch (error) {
                        if (isCorsFailure(error)) {
                            toast.error("CORS blocked — check ALLOWED_ORIGINS");
                        } else {
                            toast.error(
                                error instanceof Error ? error.message : "Share failed",
                            );
                        }
                    } finally {
                        setShareSubmitting(false);
                    }
                }}
            />

            <SharePanel
                show={!!shareSuccessUrl}
                shareUrl={shareSuccessUrl ?? ""}
                fileName={shareSuccessName}
                expiresAt={shareSuccessExpires}
                onClose={() => {
                    setShareSuccessUrl(null);
                    setShareSuccessExpires(null);
                    setShareSuccessName(null);
                }}
            />
        </div>
    );
}