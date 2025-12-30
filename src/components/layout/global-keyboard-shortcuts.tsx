"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useImportExport } from "@/hooks/use-import-export";

export function GlobalKeyboardShortcuts() {
    const pathname = usePathname();
    const { handleImport } = useImportExport();

    useEffect(() => {
        // Check if keyboard shortcuts are enabled
        const checkShortcutsEnabled = () => {
            const settings = localStorage.getItem('mdviewer_settings');
            if (settings) {
                try {
                    const parsed = JSON.parse(settings);
                    return parsed.keyboardShortcuts !== false;
                } catch {
                    return true;
                }
            }
            return true;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            if ((e.target as HTMLElement).tagName === 'INPUT' || 
                (e.target as HTMLElement).tagName === 'TEXTAREA' ||
                (e.target as HTMLElement).isContentEditable) {
                return;
            }

            if (!checkShortcutsEnabled()) return;

            // Ctrl+O or Cmd+O - Import (works on all pages)
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                e.stopPropagation();
                handleImport();
                return;
            }

            // Ctrl+E or Cmd+E - Export (only works on editor page)
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                if (pathname === '/editor') {
                    // Let editor handle it
                    return;
                }
                e.preventDefault();
                toast.info("Export shortcut (Ctrl+E) only works on the Editor page. Use Settings page to export all data.");
                return;
            }

            // Ctrl+N or Cmd+N - New file (only works on editor page)
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                if (pathname === '/editor') {
                    // Let editor handle it
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                toast.info("New file shortcut (Ctrl+N) only works on the Editor page.");
                return;
            }

            // Ctrl+S or Cmd+S - Save (only works on editor page)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                if (pathname === '/editor') {
                    // Let editor handle it
                    return;
                }
                e.preventDefault();
                toast.info("Save shortcut (Ctrl+S) only works on the Editor page.");
                return;
            }

            // Ctrl+/ or Cmd+/ - Toggle Preview (only works on editor page)
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                if (pathname === '/editor') {
                    // Let editor handle it
                    return;
                }
                e.preventDefault();
                toast.info("Toggle preview shortcut (Ctrl+/) only works on the Editor page.");
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [pathname, handleImport]);

    return null;
}

