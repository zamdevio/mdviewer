import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useEffect } from "react";

export function LoadSharedContentDialog({
    show,
    loadShareId,
    loading,
    onSaveAndLoad,
    onLoadWithoutSaving,
    onCancel,
}: {
    show: boolean;
    loadShareId: string | null;
    loading: boolean;
    onSaveAndLoad: () => void;
    onLoadWithoutSaving: () => void;
    onCancel: () => void;
}) {
    // Handle Esc key to close
    useEffect(() => {
        if (!show || loading) return;
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [show, loading, onCancel]);

    if (!show || !loadShareId || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) {
                    onCancel();
                }
            }}
        >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
            <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                <div className="flex items-start gap-3">
                    <Download className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-primary mb-1">
                            Load Shared Content?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            You have unsaved content in the editor. Would you like to save it before loading the shared content?
                        </p>
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
            </Card>
        </div>,
        document.body
    );
}

