import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";

export function EmptySaveDialog({
    show,
    onClose,
    title = "Nothing to Save",
    message = "The editor is empty. There's nothing to save. Add some content first!",
}: {
    show: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}) {
    return (
        <ModalShell open={show} onClose={onClose} title={title}>
            <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{message}</p>
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
            <Button variant="default" onClick={onClose} className="w-full">
                Got it
            </Button>
        </ModalShell>
    );
}
