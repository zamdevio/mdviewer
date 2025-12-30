"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Trash2, Download, Edit3, Pencil, Check, X, Database, Clock, HardDrive, Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSettings, getEditingFile, getSavedFiles, setSavedFiles, getFileContent, setFileContent, removeFileContent, removeSavedFile, upsertSavedFile, setEditingFile, onStorageChange, setFileAsEditing, clearAllEditingFlags, type SavedFile } from "@/lib/storage";

export default function FilesPage(): React.JSX.Element {
    const [files, setFiles] = useState<SavedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [renamingFile, setRenamingFile] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [showDeleteWarning, setShowDeleteWarning] = useState<{ filename: string; fileId?: string } | null>(null);
    const router = useRouter();
    
    // Search and filter states
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [currentPage, setCurrentPage] = useState(1);

    // Load items per page setting
    useEffect(() => {
        const settings = getSettings();
        if (settings && settings.itemsPerPage) {
            setItemsPerPage(settings.itemsPerPage);
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
        // Check which file is currently being edited
        const editing = getEditingFile();
        if (editing) {
            setEditingFile(editing);
        }
        
        // Listen for storage changes to sync with editor (only reload if files actually changed)
        const unsubscribe = onStorageChange((key) => {
            // Only reload if mdviewer_saved_files changed, not just editing_file
            if (key === 'mdviewer_saved_files') {
                loadFiles();
            }
            const editing = getEditingFile();
            if (editing !== editingFile) {
                setEditingFile(editing);
            }
        });
        
        // Check for editing file changes (but don't reload files unnecessarily)
        const interval = setInterval(() => {
            const editing = getEditingFile();
            if (editing !== editingFile) {
                setEditingFile(editing);
                // Only reload if we need to update the "Currently editing" badge
                // Don't reload the entire file list
            }
        }, 2000);
        
        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

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
            
            const filesWithContent = Array.from(filesById.values()).map((file: SavedFile) => {
                const content = getFileContent(file.filename) || undefined;
                return {
                    id: file.id!,
                    filename: file.filename,
                    content,
                    timestamp: file.timestamp,
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
            removeFileContent(filename);
            // Delete by ID if provided (more accurate), otherwise by filename
            if (fileId) {
                removeSavedFile(fileId);
            } else {
                const savedFiles = getSavedFiles();
                const updated = savedFiles.filter((f: SavedFile) => f.filename !== filename);
                setSavedFiles(updated);
            }
            toast.success("File deleted");
            loadFiles();
        } catch (error) {
            toast.error("Failed to delete file");
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

        const newName = renameValue.trim().replace(/\.md$/i, '');
        const newFilename = `${newName}.md`;

        try {
            // Find file by ID (not filename)
            const savedFiles = getSavedFiles();
            const fileIndex = savedFiles.findIndex((f: SavedFile) => f.id === fileId);
            
            if (fileIndex === -1) {
                toast.error("File not found");
                return;
            }

            const file = savedFiles[fileIndex];
            const oldFilename = file.filename;
            const oldNameWithoutExt = oldFilename.replace(/\.md$/i, '');

            if (newName === oldNameWithoutExt) {
                setRenamingFile(null);
                setRenameValue("");
                return;
            }

            // Get file content
            const content = getFileContent(oldFilename);

            if (!content) {
                toast.error("File content not found");
                return;
            }

            // Use existing file ID (preserve it)
            const existingId = file.id;

            // Save with new name (preserve ID)
            setFileContent(newFilename, content);
            removeFileContent(oldFilename);
            // Update metadata (preserve ID)
            savedFiles[fileIndex] = {
                id: existingId,
                filename: newFilename,
                timestamp: file.timestamp,
            };
            setSavedFiles(savedFiles);

            // Update editing file if it was the renamed file
            if (editingFile === oldNameWithoutExt) {
                setEditingFile(newName);
            }

            toast.success("File renamed");
            setRenamingFile(null);
            setRenameValue("");
            loadFiles();
        } catch (error) {
            toast.error("Failed to rename file");
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
            
            // Navigate to editor with file ID - editor will handle temp content warning
            router.push(`/editor?file=${targetFileId}`);
        } catch (error) {
            toast.error("Failed to load file to editor");
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
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Saved Files
                </h1>
                <Link href="/editor?new" onClick={() => clearAllEditingFlags()}>
                    <Button variant="default" className="gap-2">
                        <Edit3 className="w-4 h-4" />
                        New Editor
                    </Button>
                </Link>
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
                <Card className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">No Saved Files</h2>
                    <p className="text-muted-foreground mb-4">
                        Files saved when forking shared content will appear here.
                    </p>
                    <Link href="/editor">
                        <Button variant="outline">Go to Editor</Button>
                    </Link>
                </Card>
            ) : filteredFiles.length === 0 ? (
                <Card className="p-8 text-center">
                    <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">No Files Found</h2>
                    <p className="text-muted-foreground mb-4">
                        No files match your search query.
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                        Clear Search
                    </Button>
                </Card>
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
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleRenameConfirm(file.id);
                                                    } else if (e.key === "Escape") {
                                                        setRenamingFile(null);
                                                        setRenameValue("");
                                                    }
                                                }}
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
                                            <h3 className="font-semibold truncate flex-1" title={file.filename}>{file.filename}</h3>
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
                                        variant={editingFile === file.filename.replace(/\.md$/i, '') ? "default" : "default"}
                                        size="sm"
                                        onClick={() => handleLoadToEditor(file.filename, file.content!, file.id)}
                                        className="flex-1 gap-2"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        {editingFile === file.filename.replace(/\.md$/i, '') ? "Editing" : "Load"}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(file.filename, file.id)}
                                    className="gap-2"
                                    disabled={editingFile === file.filename.replace(/\.md$/i, '')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            {editingFile === file.filename.replace(/\.md$/i, '') && (
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

            {showDeleteWarning && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDeleteWarning(null);
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
                                    Are you sure you want to delete <span className="font-medium text-foreground truncate block" title={showDeleteWarning.filename}>{showDeleteWarning.filename}</span>?
                                </p>
                                <p className="text-sm font-medium text-destructive">
                                    This action cannot be undone!
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteWarning(null)}
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
                                onClick={() => setShowDeleteWarning(null)}
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