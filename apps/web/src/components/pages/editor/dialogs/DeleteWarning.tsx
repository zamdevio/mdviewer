import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";

export function DeleteWarningDialog({
    show,
    fileName,
    onConfirm,
    onCancel,
}: {
    show: boolean;
    fileName: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <ModalShell open={show && !!fileName} onClose={onCancel} title="Delete file">
            <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 text-destructive">Delete File</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-foreground truncate block" title={`${fileName}.md`}>
                            {fileName}.md
                        </span>
                        ?
                    </p>
                    <p className="text-sm font-medium text-destructive">This action cannot be undone!</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    className="h-6 w-6 p-0 flex-shrink-0"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
            <div className="flex flex-col gap-2">
                <Button variant="destructive" onClick={onConfirm} className="gap-2 w-full">
                    <Trash2 className="w-4 h-4" />
                    Delete
                </Button>
                <Button variant="outline" onClick={onCancel} className="w-full">
                    Cancel
                </Button>
            </div>
        </ModalShell>
    );
}
