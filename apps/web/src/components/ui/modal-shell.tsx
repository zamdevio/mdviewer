import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ModalShell({
    open,
    onClose,
    title,
    children,
    className = "max-w-md",
    closeOnEscape = true,
    closeOnBackdrop = true,
    showCloseButton = true,
    showTitle = false,
}: {
    open: boolean;
    onClose: () => void;
    /** Accessible name for the dialog (and optional visible heading). */
    title: string;
    children: React.ReactNode;
    className?: string;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
    /** Top-right X control (Esc still works when closeOnEscape). */
    showCloseButton?: boolean;
    /** Render visible title in the shell header (off by default — many dialogs bring their own). */
    showTitle?: boolean;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);
    const closeOnEscapeRef = useRef(closeOnEscape);

    onCloseRef.current = onClose;
    closeOnEscapeRef.current = closeOnEscape;

    // Only run open/close lifecycle when `open` flips — not when parent
    // recreates onClose each render (that was stealing focus from inputs).
    useEffect(() => {
        if (!open) return;

        previousFocusRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const panel = panelRef.current;
        requestAnimationFrame(() => panel?.focus());

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && closeOnEscapeRef.current) {
                e.preventDefault();
                e.stopPropagation();
                onCloseRef.current();
                return;
            }

            if (e.key !== "Tab" || !panel) return;

            const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
                (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
            );
            if (items.length === 0) {
                e.preventDefault();
                panel.focus();
                return;
            }

            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement as HTMLElement | null;

            if (e.shiftKey && (active === first || !panel.contains(active))) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
                e.preventDefault();
                first.focus();
            }
        };

        window.addEventListener("keydown", onKeyDown, true);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKeyDown, true);
            document.body.style.overflow = prevOverflow;
            previousFocusRef.current?.focus?.();
        };
    }, [open]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                aria-hidden="true"
                onClick={() => {
                    if (closeOnBackdrop) onClose();
                }}
            />
            <Card
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                className={`relative z-10 bg-background border border-border rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col p-6 overflow-y-auto outline-none hover:shadow-2xl hover:border-border ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {showTitle && (
                    <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
                        <h2 className="text-lg font-semibold leading-tight pr-2">{title}</h2>
                        {showCloseButton && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-8 w-8 p-0 shrink-0"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}
                {!showTitle && showCloseButton && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="absolute top-3 right-3 h-8 w-8 p-0 z-10"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
                {children}
            </Card>
        </div>,
        document.body,
    );
}
