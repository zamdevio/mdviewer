import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { MarkdownViewer } from "@/components/markdown";
import type { SoloMode } from "@/lib/scroll";

export function PreviewSection({
    markdown,
    effectiveMode,
    isPreview,
    previewRef,
}: {
    markdown: string;
    effectiveMode: SoloMode;
    isPreview: boolean;
    previewRef: React.RefObject<HTMLDivElement | null>;
}) {
    return (
        <div
            data-preview-section
            className={`flex flex-col gap-2 ${effectiveMode === "both" ? "h-full" : ""
                } ${
                // Mobile (< md): show based on isPreview state
                !isPreview ? "hidden md:flex" : "flex"
                } ${
                // Desktop (>= md): show based on effectiveMode state
                effectiveMode === "editor" ? "md:hidden" : ""
                }`}
        >
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                <Eye className="w-4 h-4" /> Preview
            </div>
            <Card className={`p-0 overflow-hidden border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm ${effectiveMode === "both" ? "flex-1 flex flex-col" : ""
                }`}>
                {/* Editor Status Bar For Preview Section - Optional To Add later if you decide to mak eit have it's own setitngs for easy on/off for user to follow their own preferences */}
                {/* //{showEditorStatusBar && ( */}
                {/* <EditorStatusBar
                    markdown={markdown}
                    saveStatus={saveStatus}
                    lastSaved={lastSaved}
                    timeSinceSave={timeSinceSave}
                    isAutoSave={autoSaveEnabled}
                /> */}
                {/* )} */}
                <div ref={effectiveMode === "both" ? previewRef : undefined} className={`overflow-y-auto ${effectiveMode === "both" ? "flex-1" : "p-6 min-h-[600px]"
                    }`}>
                    <div className={effectiveMode === "both" ? "p-6" : ""}>
                        <MarkdownViewer content={markdown} />
                    </div>
                </div>
            </Card>
        </div>
    );
}

