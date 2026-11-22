import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { MarkdownViewer } from "@/components/markdown";
import { previewDebounceMs } from "@/lib/performance/preview-debounce";
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
    // Typing updates shell immediately; heavy MarkdownViewer lags by size-aware debounce
    const [previewMarkdown, setPreviewMarkdown] = useState(markdown);

    useEffect(() => {
        const ms = previewDebounceMs(markdown);
        const t = window.setTimeout(() => setPreviewMarkdown(markdown), ms);
        return () => window.clearTimeout(t);
    }, [markdown]);

    return (
        <div
            data-preview-section
            className={`flex flex-col gap-2 ${effectiveMode === "both" ? "h-full" : ""
                } ${
                !isPreview ? "hidden md:flex" : "flex"
                } ${
                effectiveMode === "editor" ? "md:hidden" : ""
                }`}
        >
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                <Eye className="w-4 h-4" /> Preview
            </div>
            <Card className={`p-0 overflow-hidden border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm ${effectiveMode === "both" ? "flex-1 flex flex-col" : ""
                }`}>
                <div ref={effectiveMode === "both" ? previewRef : undefined} className={`overflow-y-auto ${effectiveMode === "both" ? "flex-1" : "p-6 min-h-[600px]"
                    }`}>
                    <div className={effectiveMode === "both" ? "p-6" : ""}>
                        <MarkdownViewer content={previewMarkdown} />
                    </div>
                </div>
            </Card>
        </div>
    );
}
