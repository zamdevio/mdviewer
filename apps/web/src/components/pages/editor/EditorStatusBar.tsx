import { getStats } from "@/lib/editor";
import { Check, Save, AlertCircle, Loader2 } from "lucide-react";
import { PreviewPerfBadge } from "./PreviewPerfBadge";

export function EditorStatusBar({ markdown, saveStatus, lastSaved, timeSinceSave, isAutoSave }: {
    markdown: string,
    saveStatus: 'idle' | 'saving' | 'saved' | 'unsaved',
    lastSaved: Date | null,
    timeSinceSave: number,
    isAutoSave: boolean
}) {
    const stats = getStats(markdown);

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-1.5 sm:py-2 bg-muted/30 border-t text-[10px] sm:text-xs text-muted-foreground select-none rounded-t-lg">
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 min-w-0">
                <div className="flex items-center gap-0.5 sm:gap-1" title="Words">
                    <span className="font-medium text-foreground">{stats.words}</span>
                    <span className="hidden sm:inline">words</span>
                    <span className="sm:hidden">w</span>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1" title="Characters">
                    <span className="font-medium text-foreground">{stats.characters}</span>
                    <span className="hidden sm:inline">chars</span>
                    <span className="sm:hidden">c</span>
                </div>
                <div className="hidden sm:flex items-center gap-0.5 sm:gap-1">
                    <span className="font-medium text-foreground">{stats.readingTime}</span>
                    <span>min read</span>
                </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 ml-auto flex-shrink-0 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2">
                    {saveStatus === 'saving' ? (
                        <div className="flex items-center gap-1 sm:gap-1.5 text-primary animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                            <span className="hidden sm:inline">Saving...</span>
                        </div>
                    ) : saveStatus === 'saved' ? (
                        <div className="flex items-center gap-1 sm:gap-1.5 text-green-600 dark:text-green-500 transition-all duration-500">
                            <Check className="w-3 h-3 flex-shrink-0" />
                            <span className="hidden sm:inline">Saved</span>
                        </div>
                    ) : saveStatus === 'unsaved' ? (
                        <div className="flex items-center gap-1 sm:gap-1.5 opacity-70">
                            <Save className="w-3 h-3 flex-shrink-0" />
                            <span className="hidden sm:inline">
                                {timeSinceSave}s ago · <span className="text-amber-600 dark:text-amber-400">Unsaved</span>
                            </span>
                            <span className="sm:hidden text-amber-600 dark:text-amber-400">Unsaved</span>
                        </div>
                    ) : lastSaved ? (
                        <div className="flex items-center gap-1 sm:gap-1.5 opacity-70">
                            <Save className="w-3 h-3 flex-shrink-0" />
                            <span className="hidden sm:inline">Saved {timeSinceSave}s ago</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 sm:gap-1.5 opacity-70">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            <span className="hidden sm:inline">Unsaved</span>
                        </div>
                    )}
                </div>
                
                {/* Auto Save Badge */}
                {isAutoSave && (
                    <div className="flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                        <span className="font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">Auto</span>
                    </div>
                )}
                <PreviewPerfBadge markdown={markdown} variant="chip" />
            </div>
        </div>
    );
}

