import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";

export function LoadSharedContentDialog({
    show,
    loadShareId,
    loading,
    error,
    onSaveAndLoad,
    onLoadWithoutSaving,
    onCancel,
}: {
    show: boolean;
    loadShareId: string | null;
    loading: boolean;
    error?: string | null;
    onSaveAndLoad: () => void;
    onLoadWithoutSaving: () => void;
    onCancel: () => void;
}) {
    return (
        <ModalShell
            open={show && !!loadShareId}
            onClose={onCancel}
            title="Load shared content"
            closeOnEscape={!loading}
            closeOnBackdrop={!loading}
        >
            <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary mb-1">Load Shared Content?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        You have unsaved content in the editor. Would you like to save it before
                        loading the shared content?
                    </p>
                    {error && (
                        <p className="text-sm text-destructive mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                            {error}
                        </p>
                    )}
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onSaveAndLoad}
                            disabled={loading}
                            className="gap-2 w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Save & Load
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onLoadWithoutSaving}
                            disabled={loading}
                            className="w-full"
                        >
                            Load Without Saving
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            disabled={loading}
                            className="w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}
