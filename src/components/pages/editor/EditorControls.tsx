import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { 
    Eye, Edit3, LayoutGrid, Share2, Copy, ArrowUp, 
    ChevronLeft, ChevronRight, X, SpellCheck 
} from "lucide-react";
import type { SoloMode } from "@/lib/scroll";

export function EditorControls({
    isClosed,
    isCollapsed,
    isMobile,
    showThemeToggle,
    markdown,
    shareUrl,
    isSharing,
    effectiveMode,
    isSpellCheckActive,
    showSpellChecker,
    onToggleCollapse,
    onClose,
    onCopyAll,
    onShare,
    onShowSharePanel,
    onSetSoloMode,
    onSetIsPreview,
    onFocusEditor,
    onToggleSpellCheck,
}: {
    isClosed: boolean;
    isCollapsed: boolean;
    isMobile: boolean;
    showThemeToggle: boolean;
    markdown: string;
    shareUrl: string | null;
    isSharing: boolean;
    effectiveMode: SoloMode;
    isSpellCheckActive: boolean;
    showSpellChecker: boolean;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onToggleCollapse: () => void;
    onClose: () => void;
    onCopyAll: () => void;
    onShare: () => void;
    onShowSharePanel: () => void;
    onSetSoloMode: (mode: SoloMode) => void;
    onSetIsPreview: (isPreview: boolean) => void;
    onFocusEditor: () => void;
    onToggleSpellCheck: () => void;
}) {
    if (isClosed) return null;

    return (
        <div className={`sticky top-4 z-40 flex items-center bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-all overflow-hidden ${isCollapsed ? 'px-2 py-2 w-auto ml-auto' : `${isMobile ? 'px-2 py-2 gap-1.5' : 'px-2 sm:px-4 py-2 sm:py-3 gap-2'}`
            }`}>
            {!isCollapsed && (
                <>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 whitespace-nowrap">
                            Live Editor
                        </h1>
                    </div>
                    <div className={`flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-x-auto ${!isMobile ? 'justify-end' : ''}`}>
                        {/* Theme Toggle - Only show when navbar is scrolled out of view */}
                        {showThemeToggle && (
                            <div className="flex items-center flex-shrink-0">
                                <ThemeToggle />
                            </div>
                        )}
                        {/* Scroll to Top Button - Only show when navbar is scrolled out of view */}
                        {showThemeToggle && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    window.scrollTo({
                                        top: 0,
                                        behavior: 'smooth'
                                    });
                                }}
                                className="h-8 w-8 p-0 flex-shrink-0"
                                title="Scroll to top"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </Button>
                        )}
                        {/* Copy All Content Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onCopyAll}
                            disabled={!markdown.trim()}
                            className="h-8 w-8 p-0 flex-shrink-0"
                            title="Copy all content"
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                        {/* Share Button */}
                        <Button
                            variant={shareUrl ? "default" : "default"}
                            size="sm"
                            onClick={shareUrl ? onShowSharePanel : onShare}
                            disabled={isSharing || !markdown.trim()}
                            className="h-8 w-8 p-0 flex-shrink-0"
                            title={shareUrl ? "Open share panel" : (isSharing ? "Sharing..." : "Share")}
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                        {/* Desktop solo mode toggle - only visible on large screens */}
                        <div className="hidden md:flex gap-2 border rounded-lg p-1 bg-muted/50">
                            <Button
                                variant={effectiveMode === "both" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    onSetSoloMode("both");
                                    setTimeout(onFocusEditor, 100);
                                }}
                                className="h-8 w-8 p-0"
                                title="Split View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={effectiveMode === "editor" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    onSetSoloMode("editor");
                                    setTimeout(onFocusEditor, 100);
                                }}
                                className="h-8 w-8 p-0"
                                title="Editor Only"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={effectiveMode === "preview" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    onSetSoloMode("preview");
                                }}
                                className="h-8 w-8 p-0"
                                title="Preview Only"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                        </div>
                        {/* Mobile solo mode toggle - show editor and preview only (no duo mode) */}
                        <div className="flex md:hidden gap-2 border rounded-lg p-1 bg-muted/50">
                            <Button
                                variant={effectiveMode === "editor" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    onSetSoloMode("editor");
                                    onSetIsPreview(false);
                                    setTimeout(onFocusEditor, 100);
                                }}
                                className="h-8 w-8 p-0"
                                title="Editor Only"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={effectiveMode === "preview" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => {
                                    onSetSoloMode("preview");
                                    onSetIsPreview(true);
                                }}
                                className="h-8 w-8 p-0"
                                title="Preview Only"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                        </div>
                        {/* Control buttons group - styled like mode buttons (same for all screen sizes) */}
                        <div className="flex gap-2 border rounded-lg p-1 bg-muted/50">
                            {/* Spell Checker Toggle */}
                            {showSpellChecker && (
                                <Button
                                    variant={isSpellCheckActive ? "default" : "ghost"}
                                    size="sm"
                                    onClick={onToggleSpellCheck}
                                    className="h-8 w-8 p-0"
                                    title={isSpellCheckActive ? "Disable Spell Checker" : "Enable Spell Checker"}
                                >
                                    <SpellCheck className="w-4 h-4" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                title="Close Live Editor"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleCollapse}
                                className="h-8 w-8 p-0"
                                title="Collapse"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
            {/* Collapse/Expand Button - Always visible when collapsed, on the right */}
            {isCollapsed && (
                <div className="flex gap-2 border rounded-lg p-1 bg-muted/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToggleCollapse}
                        className="gap-2 h-8"
                        title="Expand"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

