import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

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
}: {
    open: boolean;
    onClose: () => void;
    /** Accessible name for the dialog (visible heading can still live in children). */
    title: string;
    children: React.ReactNode;
    className?: string;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        previousFocusRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;

        const panel = panelRef.current;
        const focusables = panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
        const initial =
            focusables.find((el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA") ??
            focusables.find((el) => !el.hasAttribute("disabled")) ??
            panel;
        // Defer so autofocus / paint settle
        requestAnimationFrame(() => initial?.focus());

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && closeOnEscape) {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
            }

            if (e.key !== "Tab" || !panel) return;

            const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
                (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1
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
    }, [open, onClose, closeOnEscape]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
                if (closeOnBackdrop && e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
            <Card
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                className={`relative bg-background border border-border rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col p-6 overflow-y-auto outline-none hover:shadow-2xl hover:border-border ${className}`}
            >
                {children}
            </Card>
        </div>,
        document.body
    );
}
