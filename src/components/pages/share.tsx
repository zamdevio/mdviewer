"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Loader2, Copy, Check, ArrowLeft, GitFork } from "lucide-react";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { fetchSharedMarkdown } from "@/lib/api";
import Link from "next/link";

// GitHub Dark theme colors - same as editor
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
    comment: { color: '#8b949e', fontStyle: 'italic' },
    prolog: { color: '#8b949e' },
    doctype: { color: '#8b949e' },
    cdata: { color: '#8b949e' },
    punctuation: { color: '#c9d1d9' },
    property: { color: '#79c0ff' },
    tag: { color: '#ff7b72' },
    boolean: { color: '#79c0ff' },
    number: { color: '#79c0ff' },
    constant: { color: '#79c0ff' },
    symbol: { color: '#ff7b72' },
    deleted: { color: '#ffdcd7', backgroundColor: 'rgba(248,81,73,0.15)' },
    selector: { color: '#79c0ff' },
    'attr-name': { color: '#79c0ff' },
    string: { color: '#a5d6ff' },
    char: { color: '#a5d6ff' },
    builtin: { color: '#ffa657' },
    inserted: { color: '#7ee787', backgroundColor: 'rgba(46,160,67,0.15)' },
    operator: { color: '#ff7b72' },
    entity: { color: '#79c0ff', cursor: 'help' },
    url: { color: '#58a6ff' },
    'attr-value': { color: '#a5d6ff' },
    keyword: { color: '#ff7b72' },
    function: { color: '#d2a8ff' },
    'class-name': { color: '#ffa657' },
    regex: { color: '#a5d6ff' },
    important: { color: '#79c0ff', fontWeight: 'bold' },
    variable: { color: '#79c0ff' },
    atrule: { color: '#ff7b72' },
    bold: { fontWeight: 'bold' },
    italic: { fontStyle: 'italic' },
    'template-string': { color: '#a5d6ff' },
};

export default function ShareViewPage(): React.JSX.Element {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [shareId, setShareId] = useState<string | null>(null);
    const { resolvedTheme } = useTheme();

    // Extract share ID from URL pathname
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Get the ID from the URL pathname
            // URL format: /share/abc123 or /share?id=abc123
            const pathname = window.location.pathname;
            const searchParams = new URLSearchParams(window.location.search);
            
            // Try to get ID from pathname first (e.g., /share/abc123)
            // Handle both /share/abc123 and /share/abc123/ (with trailing slash)
            const pathMatch = pathname.match(/^\/share\/([^\/]+)/);
            let id = pathMatch ? pathMatch[1] : null;
            
            // If not in pathname, try query param (e.g., /share?id=abc123)
            if (!id) {
                id = searchParams.get('id');
            }
            
            // If still no ID, try getting it from hash (e.g., /share#abc123)
            if (!id && window.location.hash) {
                id = window.location.hash.replace('#', '');
            }
            
            if (id) {
                setShareId(id);
            } else {
                setError("No share ID provided in URL");
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!shareId) {
            return; // Wait for shareId to be extracted
        }

        setLoading(true);
        setError(null);

        const loadContent = async () => {
            try {
                const markdown = await fetchSharedMarkdown(shareId);
                setContent(markdown);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load shared content");
            } finally {
                setLoading(false);
            }
        };

        loadContent();
    }, [shareId]);

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            // Ignore clipboard errors
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 h-[calc(100vh-100px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading shared content...</p>
                </div>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="container mx-auto p-4 h-[calc(100vh-100px)] flex items-center justify-center">
                <Card className="p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold mb-4">Content Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        {error || "The shared content was not found or has expired."}
                    </p>
                    <Link href="/editor">
                        <Button variant="default" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Editor
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Shared Markdown
                </h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyUrl}
                        className="gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" />
                                <span className="hidden sm:inline">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">Copy URL</span>
                            </>
                        )}
                    </Button>
                    <Link href={`/editor?load=${shareId}`}>
                        <Button variant="default" size="sm" className="gap-2">
                            <GitFork className="w-4 h-4" />
                            <span className="hidden sm:inline">Fork to Editor</span>
                        </Button>
                    </Link>
                    <Link href="/editor">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Editor</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="flex-1 p-6 overflow-auto border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                <article className="markdown-body" data-share-content>
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
                        {content}
                    </ReactMarkdown>
                </article>
            </Card>
        </div>
    );
}

