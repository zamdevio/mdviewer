import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";

export function ConfirmDeleteDialog({
    open,
    title = "Delete",
    name,
    description,
    confirmLabel = "Delete",
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title?: string;
    /** Highlighted item name (file, project, …). */
    name: string | null;
    /** Extra warning line under the name. */
    description?: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <ModalShell
            open={open && !!name}
            onClose={onCancel}
            title={title}
            showTitle={false}
            showCloseButton
        >
            <div className="flex items-start gap-3 mb-4 pr-8">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 text-destructive">{title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Are you sure you want to delete{" "}
                        <span
                            className="font-medium text-foreground break-all"
                            title={name ?? undefined}
                        >
                            {name}
                        </span>
                        ?
                    </p>
                    <p className="text-sm font-medium text-destructive">
                        {description || "This action cannot be undone!"}
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <Button variant="destructive" onClick={onConfirm} className="gap-2 w-full">
                    <Trash2 className="w-4 h-4" />
                    {confirmLabel}
                </Button>
                <Button variant="outline" onClick={onCancel} className="w-full">
                    Cancel
                </Button>
            </div>
        </ModalShell>
    );
}
