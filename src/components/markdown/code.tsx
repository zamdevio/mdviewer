"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { useTheme } from "next-themes";

// GitHub Dark theme colors
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
    'template-string': { color: '#a5d6ff' },
};

interface CodeBlockProps {
    language: string;
    code: string;
}

/**
 * Code Block Component with Copy Button
 * Renders syntax-highlighted code blocks with a copy button
 */
export function MarkdownCodeBlock({ language, code }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const { resolvedTheme } = useTheme();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    // Ensure we have valid code and language
    const codeContent = code || '';
    const lang = language || 'text';

    return (
        <div className="relative group my-4">
            <div className="absolute top-2 right-2 z-10">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm border"
                    title="Copy code"
                >
                    {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                    ) : (
                        <Copy className="w-4 h-4" />
                    )}
                </Button>
            </div>
            <SyntaxHighlighter
                style={resolvedTheme === "dark" ? githubDarkTheme : ghcolors}
                language={lang}
                PreTag="div"
                customStyle={{
                    margin: 0,
                    borderRadius: "6px",
                    backgroundColor: resolvedTheme === "dark" ? "#161b22" : "#f6f8fa",
                    padding: "16px",
                    fontSize: "14px",
                    lineHeight: "1.45",
                    overflow: "auto",
                    border: resolvedTheme === "dark" ? "1px solid #30363d" : "1px solid #d0d7de",
                }}
                codeTagProps={{
                    style: {
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                    }
                }}
            >
                {codeContent}
            </SyntaxHighlighter>
        </div>
    );
}

