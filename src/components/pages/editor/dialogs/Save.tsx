import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Plus, Pencil } from "lucide-react";
import { MAX_FILENAME_LENGTH } from "@/lib/editor";
import { useEffect } from "react";

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
    mode: 'save' | 'new' | 'rename';
    fileName: string;
    initialValue: string;
    onChange: (value: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    // Handle Esc key to close
    useEffect(() => {
        if (!show) return;
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [show, onCancel]);

    if (!show || typeof document === 'undefined') return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            const isEditMode = mode === 'rename';
            const hasChanges = fileName !== initialValue;
            if (isEditMode && hasChanges) {
                return;
            }
            onCancel();
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={handleBackdropClick}
        >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
            <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                <div className="flex items-start gap-3">
                    {mode === 'rename' ? (
                        <Pencil className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : mode === 'new' ? (
                        <Plus className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                        <Save className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <h3 className="font-semibold text-primary mb-1">
                            {mode === 'rename' ? 'Rename File' : mode === 'new' ? 'Save Current File' : 'Save File'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {mode === 'rename'
                                ? 'Enter a new filename for this file.'
                                : mode === 'new'
                                    ? 'Please save your current file before creating a new one.'
                                    : 'Enter a filename to save your markdown content.'}
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
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    onConfirm();
                                } else if (e.key === "Escape") {
                                    onCancel();
                                }
                            }}
                            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground mb-4">
                            Max {MAX_FILENAME_LENGTH} characters
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                size="sm"
                                onClick={onConfirm}
                                className="w-full"
                            >
                                {mode === 'rename' ? 'Rename' : 'Save'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onCancel}
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

