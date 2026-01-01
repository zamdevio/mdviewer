import { Card } from "@/components/ui/card";
import { Edit3 } from "lucide-react";
import { EditorStatusBar } from "./EditorStatusBar";
import type { SoloMode } from "@/lib/scroll";

export function EditorSection({
    markdown,
    effectiveMode,
    isPreview,
    showEditorStatusBar,
    saveStatus,
    lastSaved,
    timeSinceSave,
    isAutoSave,
    showSpellChecker,
    textareaRef,
    onMarkdownChange,
    onEditorModeResize,
}: {
    markdown: string;
    effectiveMode: SoloMode;
    isPreview: boolean;
    showEditorStatusBar: boolean;
    saveStatus: 'idle' | 'saving' | 'saved' | 'unsaved';
    lastSaved: Date | null;
    timeSinceSave: number;
    isAutoSave: boolean;
    showSpellChecker: boolean;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onMarkdownChange: (value: string) => void;
    onEditorModeResize: () => void;
}) {
    return (
        <div
            data-editor-section
            className={`flex flex-col gap-2 ${effectiveMode === "both" ? "h-full" : ""
                } ${
                // Mobile (< md): show based on isPreview state
                isPreview ? "hidden md:flex" : "flex"
                } ${
                // Desktop (>= md): show based on effectiveMode state
                effectiveMode === "preview" ? "md:hidden" : ""
                }`}
        >
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                <Edit3 className="w-4 h-4" /> Editor
            </div>
            <Card className={`p-0 border-primary/20 shadow-lg bg-background/50 backdrop-blur-sm transition-all
                ${effectiveMode === "both" && typeof window !== 'undefined' && window.innerWidth >= 768
                    ? "flex-1 flex flex-col"
                    : ""
                }`}
            >
                {/* Status bar — never clipped */}
                {showEditorStatusBar && (
                    <EditorStatusBar
                        markdown={markdown}
                        saveStatus={saveStatus}
                        lastSaved={lastSaved}
                        timeSinceSave={timeSinceSave}
                        isAutoSave={isAutoSave}
                    />
                )}

                {/* Scroll container */}
                <div className="flex-1 overflow-auto">
                    <textarea
                        ref={textareaRef}
                        value={markdown}
                        onChange={(e) => {
                            onMarkdownChange(e.target.value);
                            onEditorModeResize();
                        }}
                        className={`w-full p-6 resize-none bg-transparent border-none focus:ring-0 font-mono text-sm leading-relaxed outline-none block ${
                            effectiveMode === "both" && typeof window !== 'undefined' && window.innerWidth >= 768
                                ? ""
                                : ""
                        }`}
                        placeholder="Type your markdown here..."
                        spellCheck={showSpellChecker}
                        style={{
                            minHeight: effectiveMode === "both" ? '100%' : '600px',
                            overflow: effectiveMode === "both" ? 'auto' : 'visible',
                        }}
                    />
                </div>
            </Card>
        </div>
    );
}

