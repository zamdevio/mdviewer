"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { Eye, Edit3, LayoutGrid } from "lucide-react";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { useTheme } from "next-themes";

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
- **Real-time Preview**: See changes instantly.
- **Auto-save**: Your work is saved automatically.
- **GitHub-style Preview**: Matches GitHub's markdown rendering exactly.

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

> This is a blockquote.

- List item 1
- List item 2
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
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    // Avoid hydration mismatch - necessary for client-side only rendering
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("mdviewer_content", markdown);
        }
    }, [markdown, mounted]);

    if (!mounted) return null;

    return (
        <div className="container mx-auto p-4 h-[calc(100vh-100px)] flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Live Editor
                </h1>
                <div className="flex gap-2">
                    {/* Mobile toggle - only visible on small screens */}
                    <Button
                        variant={isPreview ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsPreview(!isPreview)}
                        className="gap-2 md:hidden"
                    >
                        {isPreview ? (
                            <>
                                <Edit3 className="w-4 h-4" /> Edit
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" /> Preview
                            </>
                        )}
                    </Button>
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
                </div>
            </div>

            <div className={`grid gap-6 h-full ${
                soloMode === "both" 
                    ? "grid-cols-1 md:grid-cols-2" 
                    : "grid-cols-1"
            }`}>
                {/* Editor Section */}
                <div className={`h-full flex flex-col gap-2 ${
                    // Mobile (< md): show based on isPreview state
                    isPreview ? "hidden md:flex" : "flex"
                } ${
                    // Desktop (>= md): show based on soloMode state
                    soloMode === "preview" ? "md:hidden" : ""
                }`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                        <Edit3 className="w-4 h-4" /> Editor
                    </div>
                    <Card className="flex-1 p-0 overflow-hidden border-primary/20 shadow-lg bg-background/50 backdrop-blur-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <textarea
                            value={markdown}
                            onChange={(e) => setMarkdown(e.target.value)}
                            className="w-full h-full p-6 resize-none bg-transparent border-none focus:ring-0 font-mono text-sm leading-relaxed outline-none"
                            placeholder="Type your markdown here..."
                            spellCheck={false}
                        />
                    </Card>
                </div>

                {/* Preview Section */}
                <div className={`h-full flex flex-col gap-2 ${
                    // Mobile (< md): show based on isPreview state
                    !isPreview ? "hidden md:flex" : "flex"
                } ${
                    // Desktop (>= md): show based on soloMode state
                    soloMode === "editor" ? "md:hidden" : ""
                }`}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium px-1">
                        <Eye className="w-4 h-4" /> Preview
                    </div>
                    <Card className="flex-1 p-6 overflow-auto border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
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
                    </Card>
                </div>
            </div>
        </div>
    );
}
