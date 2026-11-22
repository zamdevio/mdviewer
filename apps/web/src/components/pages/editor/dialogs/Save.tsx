import { Button } from "@/components/ui/button";
import { Save, Plus, Pencil } from "lucide-react";
import { MAX_FILENAME_LENGTH } from "@/lib/editor";
import { ModalShell } from "@/components/ui/modal-shell";

export function SaveDialog({
    show,
    mode,
    fileName,
    initialValue,
    onChange,
    onConfirm,
    onCancel,
}: {
    show: boolean;
    mode: "save" | "new" | "rename";
    fileName: string;
    initialValue: string;
    onChange: (value: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const title =
        mode === "rename" ? "Rename file" : mode === "new" ? "Save current file" : "Save file";
    const isEditMode = mode === "rename";
    const hasChanges = fileName !== initialValue;
    const allowBackdropClose = !(isEditMode && hasChanges);

    return (
        <ModalShell
            open={show}
            onClose={onCancel}
            title={title}
            closeOnBackdrop={allowBackdropClose}
        >
            <div className="flex items-start gap-3">
                {mode === "rename" ? (
                    <Pencil className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                ) : mode === "new" ? (
                    <Plus className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                ) : (
                    <Save className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1">
                        {mode === "rename"
                            ? "Rename File"
                            : mode === "new"
                              ? "Save Current File"
                              : "Save File"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {mode === "rename"
                            ? "Enter a new filename for this file."
                            : mode === "new"
                              ? "Please save your current file before creating a new one."
                              : "Enter a filename to save your markdown content."}
                    </p>
                    <input
                        type="text"
                        placeholder="Enter filename (without .md)"
                        value={fileName}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= MAX_FILENAME_LENGTH) {
                                onChange(value);
                            }
                        }}
                        maxLength={MAX_FILENAME_LENGTH}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onConfirm();
                            }
                        }}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        autoFocus
                    />
                    <p className="text-xs text-muted-foreground mb-4">
                        Max {MAX_FILENAME_LENGTH} characters
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button variant="default" size="sm" onClick={onConfirm} className="w-full">
                            {mode === "rename" ? "Rename" : "Save"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={onCancel} className="w-full">
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}
