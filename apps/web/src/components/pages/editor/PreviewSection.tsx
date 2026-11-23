import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { MarkdownViewer } from "@/components/markdown";
import { VirtualMarkdownViewer } from "@/components/markdown/virtual-viewer";
import { shouldVirtualizePreview } from "@/lib/markdown/split-chunks";
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
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const ms = previewDebounceMs(markdown);
        const t = window.setTimeout(() => setPreviewMarkdown(markdown), ms);
        return () => window.clearTimeout(t);
    }, [markdown]);

    const virtualize = shouldVirtualizePreview(previewMarkdown);

    const setScrollRef = (node: HTMLDivElement | null) => {
        setScrollEl(node);
        if (effectiveMode === "both") {
            (previewRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
    };

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
                {virtualize ? (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                        virtualized
                    </span>
                ) : null}
            </div>
            <Card className={`p-0 overflow-hidden border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm ${effectiveMode === "both" ? "flex-1 flex flex-col" : ""
                }`}>
                <div
                    ref={setScrollRef}
                    className={`overflow-y-auto ${effectiveMode === "both" ? "flex-1" : "p-6 min-h-[600px]"
                    }`}
                >
                    <div className={effectiveMode === "both" ? "p-6" : ""}>
                        {virtualize ? (
                            <VirtualMarkdownViewer
                                content={previewMarkdown}
                                scrollElement={scrollEl}
                            />
                        ) : (
                            <MarkdownViewer content={previewMarkdown} />
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
