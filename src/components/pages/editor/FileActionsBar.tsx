import { Button } from "@/components/ui/button";
import { FileText, Plus, Upload, Save, FileDown, Pencil, Trash2, Edit3 } from "lucide-react";
import { isContentEmpty, truncateFilenameForDisplay } from "@/lib/editor";

export function FileActionsBar({
    currentFileName,
    markdown,
    autoSaveEnabled,
    onRename,
    onDelete,
    onNewFile,
    onImport,
    onSave,
    onExport,
    isClosed,
    isActivateButtonDismissed,
    onActivate,
}: {
    currentFileName: string | null;
    markdown: string;
    autoSaveEnabled: boolean;
    onRename: () => void;
    onDelete: () => void;
    onNewFile: () => void;
    onImport: () => void;
    onSave: () => void;
    onExport: () => void;
    isClosed: boolean;
    isActivateButtonDismissed: boolean;
    onActivate: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-2">
            {currentFileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline flex-shrink-0">Editing: </span>
                    <span className="font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-none" title={`${currentFileName}.md`}>
                        {truncateFilenameForDisplay(`${currentFileName}.md`)}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRename}
                        className="h-6 w-6 p-0 ml-1"
                        title="Rename file"
                    >
                        <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
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
                        onClick={onActivate}
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
                    onClick={onNewFile}
                    disabled={isContentEmpty(markdown)}
                    className="gap-2"
                    title={isContentEmpty(markdown) ? "You already have an empty new file open" : "Create new file"}
                >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">New</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onImport}
                    className="gap-2"
                    title="Import markdown file"
                >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Import</span>
                </Button>
                <Button
                    variant={currentFileName ? (autoSaveEnabled ? "default" : "outline") : "outline"}
                    size="sm"
                    onClick={onSave}
                    disabled={isContentEmpty(markdown, false)}
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
                    onClick={onExport}
                    disabled={!markdown.trim()}
                    className="gap-2"
                    title="Export markdown to file"
                >
                    <FileDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                </Button>
            </div>
        </div>
    );
}

