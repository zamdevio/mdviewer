"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Eye, Edit3, LayoutGrid, Share2, Copy, Check, AlertCircle, X, ChevronLeft, ChevronRight, ArrowUp } from "lucide-react";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { uploadMarkdown } from "@/lib/api";
import { isApiConfigured } from "@/lib/config";
import { ThemeToggle } from "@/components/theme";
import { toast } from "sonner";

// GitHub Dark theme colors - exact match to GitHub's syntax highlighting
// Using Prism token class names format for react-syntax-highlighter
const githubDarkTheme: Record<string, CSSProperties> = {
    'code[class*="language-"]': {
        color: '#c9d1d9',
        background: '#161b22',
        textShadow: 'none',
    },
    'pre[class*="language-"]': {
        color: '#c9d1d9',
        background: '#161b22',
        textShadow: 'none',
        padding: '16px',
        overflow: 'auto',
        fontSize: '85%',
        lineHeight: '1.45',
        borderRadius: '6px',
    },
    comment: {
        color: '#8b949e',
        fontStyle: 'italic',
    },
    prolog: {
        color: '#8b949e',
    },
    doctype: {
        color: '#8b949e',
    },
    cdata: {
        color: '#8b949e',
    },
    punctuation: {
        color: '#c9d1d9',
    },
    property: {
        color: '#79c0ff',
    },
    tag: {
        color: '#ff7b72',
    },
    boolean: {
        color: '#79c0ff',
    },
    number: {
        color: '#79c0ff',
    },
    constant: {
        color: '#79c0ff',
    },
    symbol: {
        color: '#ff7b72',
    },
    deleted: {
        color: '#ffdcd7',
        backgroundColor: 'rgba(248,81,73,0.15)',
    },
    selector: {
        color: '#79c0ff',
    },
    'attr-name': {
        color: '#79c0ff',
    },
    string: {
        color: '#a5d6ff',
    },
    char: {
        color: '#a5d6ff',
    },
    builtin: {
        color: '#ffa657',
    },
    inserted: {
        color: '#7ee787',
        backgroundColor: 'rgba(46,160,67,0.15)',
    },
    operator: {
        color: '#ff7b72',
    },
    entity: {
        color: '#79c0ff',
        cursor: 'help',
    },
    url: {
        color: '#58a6ff',
    },
    'attr-value': {
        color: '#a5d6ff',
    },
    keyword: {
        color: '#ff7b72',
    },
    function: {
        color: '#d2a8ff',
    },
    'class-name': {
        color: '#ffa657',
    },
    regex: {
        color: '#a5d6ff',
    },
    important: {
        color: '#79c0ff',
        fontWeight: 'bold',
    },
    variable: {
        color: '#79c0ff',
    },
    atrule: {
        color: '#ff7b72',
    },
    bold: {
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    'template-string': {
        color: '#a5d6ff',
    },
};

const DEFAULT_MARKDOWN = `# Welcome to MDViewer Editor

Start typing to see your markdown render in real-time!

## Features

### Core Features
- **Real-time Preview**: See changes instantly as you type
- **Auto-save**: Your work is automatically saved to localStorage
- **GitHub-style Preview**: Matches GitHub's markdown rendering exactly
- **Syntax Highlighting**: Beautiful code highlighting with GitHub Dark theme support

### View Modes
- **Split View**: Edit and preview side-by-side (desktop)
- **Editor Only**: Focus on writing with expanding textarea
- **Preview Only**: Full-screen preview of your rendered markdown
- **Scroll Synchronization**: Scroll positions preserved when switching modes

### Sharing & Collaboration
- **Share Markdown**: Generate shareable links for your content
- **Cloudflare Workers API**: Fast, edge-deployed sharing backend
- **Copy Share URL**: One-click copy to clipboard

### User Experience
- **Sticky Controls**: Always accessible editor controls that stay visible
- **Collapse/Expand**: Minimize controls for a cleaner view
- **Theme Toggle**: Switch between light and dark modes
- **Scroll to Top**: Quick navigation button when scrolled down
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Toast Notifications**: Beautiful notifications for actions and errors

### Code Example
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet("World");
\`\`\`

### Python Example
\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
\`\`\`

> This is a blockquote demonstrating the styling.

- List item 1
- List item 2
- List item 3

**Happy writing!** 🚀
`;

type SoloMode = "both" | "editor" | "preview";

export default function EditorPage() {
    const [markdown, setMarkdown] = useState(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("mdviewer_content");
            return saved || DEFAULT_MARKDOWN;
        }
        return DEFAULT_MARKDOWN;
    });
    const [isPreview, setIsPreview] = useState(false);
    const [soloMode, setSoloMode] = useState<SoloMode>("both");
    const previousModeRef = useRef<SoloMode>("both");
    const [mounted, setMounted] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showApiWarning, setShowApiWarning] = useState(false);
    const [showThemeToggle, setShowThemeToggle] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isClosed, setIsClosed] = useState(false);
    const [isActivateButtonDismissed, setIsActivateButtonDismissed] = useState(false);
    const { resolvedTheme } = useTheme();
    const editorRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const soloTextareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Unified scroll position tracker for all modes
    const scrollPositionsRef = useRef<{
        editor: number;
        preview: number;
        page: number;
    }>({
        editor: 0,
        preview: 0,
        page: 0,
    });

    // Avoid hydration mismatch - necessary for client-side only rendering
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Handle dismissing the activate button
    const handleDismissActivateButton = () => {
        setIsActivateButtonDismissed(true);
    };

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("mdviewer_content", markdown);
        }
    }, [markdown, mounted]);

    // Save scroll position BEFORE mode changes
    useEffect(() => {
        if (!mounted) return;
        
        // Save current scroll positions before any mode change
        const saveScrollPositions = () => {
            // Save editor scroll position (split view)
            if (editorRef.current) {
                scrollPositionsRef.current.editor = editorRef.current.scrollTop;
            }
            
            // Save preview scroll position (split view or preview-only)
            if (previewRef.current) {
                scrollPositionsRef.current.preview = previewRef.current.scrollTop;
            }
            
            // Save page scroll position (editor-only mode uses page scroll)
            scrollPositionsRef.current.page = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        };

        // Save positions continuously during scrolling
        const editorElement = editorRef.current;
        const previewElement = previewRef.current;

        if (editorElement) {
            editorElement.addEventListener('scroll', saveScrollPositions, { passive: true });
        }
        if (previewElement) {
            previewElement.addEventListener('scroll', saveScrollPositions, { passive: true });
        }
        window.addEventListener('scroll', saveScrollPositions, { passive: true });

        return () => {
            if (editorElement) {
                editorElement.removeEventListener('scroll', saveScrollPositions);
            }
            if (previewElement) {
                previewElement.removeEventListener('scroll', saveScrollPositions);
            }
            window.removeEventListener('scroll', saveScrollPositions);
        };
    }, [mounted, soloMode, isPreview]);

    // Restore scroll positions after mode changes
    useEffect(() => {
        if (!mounted) return;
        
        // When switching from duo to editor-only, convert editor scroll to page scroll
        // We need to calculate where the editor content would be on the page
        const restoreScroll = () => {
            if (soloMode === "both") {
                // Restore editor scroll in split view
                if (editorRef.current) {
                    editorRef.current.scrollTop = scrollPositionsRef.current.editor;
                }
                // Restore preview scroll in split view
                if (previewRef.current) {
                    previewRef.current.scrollTop = scrollPositionsRef.current.preview;
                }
            } else if (soloMode === "editor") {
                // When switching from duo to editor-only:
                // If we have an editor scroll position but no page scroll, convert it
                // The editor scroll position needs to be converted to page scroll
                if (scrollPositionsRef.current.editor > 0 && scrollPositionsRef.current.page === 0) {
                    // Get the position of the editor section on the page
                    const editorSection = document.querySelector('[data-editor-section]');
                    if (editorSection) {
                        const rect = editorSection.getBoundingClientRect();
                        const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
                        // Convert editor scroll to approximate page scroll position
                        const targetScroll = scrollTop + rect.top + scrollPositionsRef.current.editor;
                        window.scrollTo({
                            top: targetScroll,
                            behavior: 'instant' as ScrollBehavior
                        });
                    } else {
                        // Fallback: use saved page scroll
                        window.scrollTo({
                            top: scrollPositionsRef.current.page,
                            behavior: 'instant' as ScrollBehavior
                        });
                    }
                } else {
                    // Restore page scroll in editor-only mode
                    window.scrollTo({
                        top: scrollPositionsRef.current.page,
                        behavior: 'instant' as ScrollBehavior
                    });
                }
            } else if (soloMode === "preview") {
                // Restore preview scroll in preview-only mode
                if (previewRef.current) {
                    previewRef.current.scrollTop = scrollPositionsRef.current.preview;
                }
            }
        };

        // Use requestAnimationFrame to ensure DOM is ready, then restore
        const rafId = requestAnimationFrame(() => {
            setTimeout(restoreScroll, 0);
        });

        return () => cancelAnimationFrame(rafId);
    }, [soloMode, isPreview, mounted]);

    // Auto-resize textarea in solo editor mode
    useEffect(() => {
        if (!mounted || !soloTextareaRef.current) return;
        
        // Resize in editor-only mode
        if (soloMode === "editor") {
            const textarea = soloTextareaRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [markdown, mounted, soloMode]);

    // Check API configuration on mount
    useEffect(() => {
        if (mounted && !isApiConfigured()) {
            setShowApiWarning(true);
        }
    }, [mounted]);

    // Detect if navbar is scrolled out of view
    useEffect(() => {
        if (!mounted) return;

        const handleScroll = () => {
            const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            // Show theme toggle when scrolled past navbar (approximately 100px)
            setShowThemeToggle(scrollY > 100);
        };

        // Check on mount
        handleScroll();

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [mounted]);

    const handleShare = async () => {
        if (!markdown.trim()) {
            toast.error("Cannot share empty content");
            return;
        }

        // Check if API is configured before attempting to share
        if (!isApiConfigured()) {
            setShowApiWarning(true);
            toast.warning("API not configured. Please configure the API URL to use the share feature.");
            return;
        }

        setIsSharing(true);
        toast.loading("Sharing your markdown...", { id: "sharing" });
        try {
            const result = await uploadMarkdown(markdown);
            // Construct share URL with query parameter format
            const url = `/share?id=${result.id}`;
            // Construct full URL for display
            const fullUrl = typeof window !== 'undefined' 
                ? `${window.location.origin}${url}`
                : url;
            setShareUrl(fullUrl);
            setShowApiWarning(false); // Hide warning on success
            toast.success("Markdown shared successfully!", { id: "sharing" });
        } catch (error) {
            // Check if it's a connection error (API not available)
            if (error instanceof Error && error.message.includes('fetch')) {
                setShowApiWarning(true);
                toast.error("Failed to connect to API. Please check your API configuration.", { id: "sharing" });
            } else {
                toast.error(error instanceof Error ? error.message : "Failed to share. Please try again.", { id: "sharing" });
            }
        } finally {
            setIsSharing(false);
        }
    };

    const handleCopyShareUrl = async () => {
        if (!shareUrl) return;
        
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Share URL copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy URL");
        }
    };

    if (!mounted) return null;

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-200px)] flex flex-col gap-4 animate-fade-in">
            {/* API Configuration Warning */}
            {showApiWarning && (
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/20 border-2">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                                API Not Configured
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                The share feature requires a Cloudflare Workers API to be configured. 
                                The API URL is currently set to localhost, which won't work in production.
                            </p>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium">To fix this:</p>
                                <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                                    <li>Deploy the Workers API (see <code className="bg-muted px-1 rounded">workers-api/README.md</code>)</li>
                                    <li>Update <code className="bg-muted px-1 rounded">src/lib/config.ts</code> with your API URL</li>
                                    <li>Or set the <code className="bg-muted px-1 rounded">NEXT_PUBLIC_API_URL</code> environment variable</li>
                                </ol>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiWarning(false)}
                            className="h-6 w-6 p-0 flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>
            )}
            
            {/* Activate Live Editor Button - Show when closed and not dismissed */}
            {isClosed && !isActivateButtonDismissed && (
                <div className="sticky top-4 z-40 flex justify-center">
                    <div className="relative">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                                setIsClosed(false);
                                setIsActivateButtonDismissed(false);
                                localStorage.removeItem("mdviewer_activate_dismissed");
                            }}
                            className="gap-2 bg-primary/90 hover:bg-primary shadow-lg pr-8"
                        >
                            <Edit3 className="w-4 h-4" />
                            Activate Live Editor
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDismissActivateButton}
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full bg-background border border-border hover:bg-destructive hover:text-destructive-foreground hover:border-destructive shadow-sm"
                            title="Dismiss (reload page to show again)"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Sticky Controls Bar */}
            {!isClosed && (
                <div className={`sticky top-4 z-40 flex items-center justify-between bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 transition-all overflow-hidden ${
                    isCollapsed ? 'px-2 py-2 w-auto ml-auto' : 'px-4 py-3'
                }`}>
                    {!isCollapsed && (
                        <>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                                    Live Editor
                                </h1>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Theme Toggle - Only show when navbar is scrolled out of view */}
                                {showThemeToggle && (
                                    <div className="flex items-center">
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
                                        className="h-8 w-8 p-0"
                                        title="Scroll to top"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </Button>
                                )}
                                {/* Share Button */}
                                {shareUrl ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                                        <span className="text-sm text-primary font-mono max-w-[200px] truncate">
                                            {shareUrl}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopyShareUrl}
                                            className="h-6 w-6 p-0"
                                            title="Copy share URL"
                                        >
                                            {copied ? (
                                                <Check className="w-4 h-4 text-green-500" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShareUrl(null)}
                                            className="h-6 w-6 p-0 text-muted-foreground"
                                            title="Close"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleShare}
                                        disabled={isSharing || !markdown.trim()}
                                        className="gap-2"
                                        title={isSharing ? "Sharing..." : "Share"}
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">{isSharing ? "Sharing..." : "Share"}</span>
                                    </Button>
                                )}
                                {/* Desktop solo mode toggle - only visible on large screens */}
                                <div className="hidden md:flex gap-2 border rounded-lg p-1 bg-muted/50">
                                    <Button
                                        variant={soloMode === "both" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setSoloMode("both")}
                                        className="gap-2 h-8"
                                        title="Split View"
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={soloMode === "editor" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setSoloMode("editor")}
                                        className="gap-2 h-8"
                                        title="Editor Only"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={soloMode === "preview" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => setSoloMode("preview")}
                                        className="gap-2 h-8"
                                        title="Preview Only"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                                {/* Mobile solo mode toggle - show editor and preview only (no duo mode) */}
                                <div className="flex md:hidden gap-2 border rounded-lg p-1 bg-muted/50">
                                    <Button
                                        variant={soloMode === "editor" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("editor");
                                            setIsPreview(false);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Editor Only"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant={soloMode === "preview" ? "default" : "ghost"}
                                        size="sm"
                                        onClick={() => {
                                            setSoloMode("preview");
                                            setIsPreview(true);
                                        }}
                                        className="h-8 w-8 p-0"
                                        title="Preview Only"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                </div>
                                {/* Control buttons group - styled like mode buttons (same for all screen sizes) */}
                                <div className="flex gap-2 border rounded-lg p-1 bg-muted/50">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsCollapsed(!isCollapsed)}
                                        className="h-8 w-8 p-0"
                                        title="Collapse"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsClosed(true);
                                            toast.info("Live Editor closed. Use the activate button to get it back.", {
                                                duration: 5000,
                                            });
                                        }}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        title="Close Live Editor"
                                    >
                                        <X className="w-4 h-4" />
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
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="gap-2 h-8"
                                title="Expand"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Content */}
            <div className={`grid gap-6 ${
                soloMode === "both" 
                    ? "flex-1 grid-cols-1 md:grid-cols-2 min-h-[600px]" 
                    : "grid-cols-1"
            }`}>
                {/* Editor Section */}
                <div 
                    data-editor-section
                    className={`flex flex-col gap-2 ${
                        soloMode === "both" ? "h-full" : ""
                    } ${
                        // Mobile (< md): show based on isPreview state
                        isPreview ? "hidden md:flex" : "flex"
                    } ${
                        // Desktop (>= md): show based on soloMode state
                        soloMode === "preview" ? "md:hidden" : ""
                    }`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                        <Edit3 className="w-4 h-4" /> Editor
                    </div>
                    <Card className={`p-0 border-primary/20 shadow-lg bg-background/50 backdrop-blur-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all ${
                        soloMode === "both" && typeof window !== 'undefined' && window.innerWidth >= 768 ? "flex-1 overflow-hidden" : ""
                    }`}>
                        {soloMode === "both" && typeof window !== 'undefined' && window.innerWidth >= 768 && !isPreview ? (
                            // Split view on desktop (md and above) - use scroll container
                            <div ref={editorRef} className="h-full overflow-y-auto">
                                <textarea
                                    value={markdown}
                                    onChange={(e) => setMarkdown(e.target.value)}
                                    className="w-full p-6 resize-none bg-transparent border-none focus:ring-0 font-mono text-sm leading-relaxed outline-none block"
                                    placeholder="Type your markdown here..."
                                    spellCheck={false}
                                    style={{ 
                                        minHeight: '100%',
                                        height: 'auto',
                                        overflow: 'hidden'
                                    }}
                                />
                            </div>
                        ) : (
                            // Solo editor mode OR mobile/small screens - expand naturally
                            <textarea
                                ref={soloTextareaRef}
                                value={markdown}
                                onChange={(e) => {
                                    setMarkdown(e.target.value);
                                    // Auto-resize textarea to fit content
                                    const textarea = e.target as HTMLTextAreaElement;
                                    textarea.style.height = 'auto';
                                    textarea.style.height = `${textarea.scrollHeight}px`;
                                }}
                                className="w-full p-6 resize-none bg-transparent border-none focus:ring-0 font-mono text-sm leading-relaxed outline-none block"
                                placeholder="Type your markdown here..."
                                spellCheck={false}
                                style={{ 
                                    minHeight: '600px',
                                    overflow: 'visible',
                                    display: 'block'
                                }}
                            />
                        )}
                    </Card>
                </div>

                {/* Preview Section */}
                <div className={`flex flex-col gap-2 ${
                    soloMode === "both" ? "h-full" : ""
                } ${
                    // Mobile (< md): show based on isPreview state
                    !isPreview ? "hidden md:flex" : "flex"
                } ${
                    // Desktop (>= md): show based on soloMode state
                    soloMode === "editor" ? "md:hidden" : ""
                }`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                        <Eye className="w-4 h-4" /> Preview
                    </div>
                    <Card className={`p-6 overflow-hidden border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm ${
                        soloMode === "both" ? "flex-1" : ""
                    }`}>
                        <div ref={soloMode === "both" ? previewRef : undefined} className={`overflow-y-auto ${
                            soloMode === "both" ? "h-full" : "min-h-[600px]"
                        }`}>
                            <article className="markdown-body">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code(props) {
                                        const { children, className, ...rest } = props;
                                        const match = /language-(\w+)/.exec(className || "");
                                        const language = match ? match[1] : "";
                                        const inline = !match;
                                        return !inline && language ? (
                                            <SyntaxHighlighter
                                                style={resolvedTheme === "dark" ? githubDarkTheme : ghcolors}
                                                language={language}
                                                PreTag="div"
                                                customStyle={{
                                                    margin: 0,
                                                    borderRadius: "6px",
                                                    backgroundColor: resolvedTheme === "dark" ? "#161b22" : undefined,
                                                }}
                                            >
                                                {String(children).replace(/\n$/, "")}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={className} {...rest}>
                                                {children}
                                            </code>
                                        );
                                    },
                                }}
                            >
                                {markdown}
                            </ReactMarkdown>
                        </article>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
