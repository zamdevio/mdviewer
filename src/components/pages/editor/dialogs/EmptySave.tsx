import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

export function EmptySaveDialog({ show, onClose }: { show: boolean; onClose: () => void }) {
    // Handle Esc key to close
    useEffect(() => {
        if (!show) return;
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [show, onClose]);

    if (!show || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
            <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                            Nothing to Save
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            The editor is empty. There&apos;s nothing to save. Add some content first!
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-6 w-6 p-0 flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex flex-col gap-2">
                    <Button
                        variant="default"
                        onClick={onClose}
                        className="w-full"
                    >
                        Got it
                    </Button>
                </div>
            </Card>
        </div>,
        document.body
    );
}

