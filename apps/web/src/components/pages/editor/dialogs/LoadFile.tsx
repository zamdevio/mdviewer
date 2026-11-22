import { Button } from "@/components/ui/button";
import { AlertTriangle, Save } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";

export function LoadFileDialog({
    show,
    pendingFileId,
    onSaveAndLoad,
    onLoadWithoutSaving,
    onCancel,
}: {
    show: boolean;
    pendingFileId: string | null;
    onSaveAndLoad: () => void;
    onLoadWithoutSaving: () => void;
    onCancel: () => void;
}) {
    return (
        <ModalShell
            open={show && !!pendingFileId}
            onClose={onCancel}
            title="Unsaved content warning"
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 text-yellow-600 dark:text-yellow-400">
                        Unsaved Content Warning
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        You have unsaved content in the editor. Loading this file will replace your
                        current content. Would you like to save it first?
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onSaveAndLoad}
                            className="gap-2 w-full"
                        >
                            <Save className="w-4 h-4" />
                            Save & Load File
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onLoadWithoutSaving}
                            className="w-full"
                        >
                            Load Without Saving
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onCancel} className="w-full">
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}
