"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { ghcolors } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { CSSProperties } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

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
 * Auto-detects programming language from code content
 * Checks comments, keywords, and syntax patterns
 */
function detectLanguageFromCode(code: string): string {
    const firstLine = code.split('\n')[0]?.trim() || '';
    
    // Check for language hints in comments
    const languagePatterns = [
        // Single-line comments: //typescript, // TypeScript, // TypeScript example, etc.
        { pattern: /^\/\/\s*(typescript|ts)(\s|$|:)/i, lang: 'typescript' },
        { pattern: /^\/\/\s*(javascript|js)(\s|$|:)/i, lang: 'javascript' },
        { pattern: /^\/\/\s*(python|py)(\s|$|:)/i, lang: 'python' },
        { pattern: /^\/\/\s*(java)(\s|$|:)/i, lang: 'java' },
        { pattern: /^\/\/\s*(c\+\+|cpp)(\s|$|:)/i, lang: 'cpp' },
        { pattern: /^\/\/\s*(c#|csharp|cs)(\s|$|:)/i, lang: 'csharp' },
        { pattern: /^\/\/\s*(go|golang)(\s|$|:)/i, lang: 'go' },
        { pattern: /^\/\/\s*(rust|rs)(\s|$|:)/i, lang: 'rust' },
        { pattern: /^\/\/\s*(php)(\s|$|:)/i, lang: 'php' },
        { pattern: /^\/\/\s*(ruby|rb)(\s|$|:)/i, lang: 'ruby' },
        { pattern: /^\/\/\s*(swift)(\s|$|:)/i, lang: 'swift' },
        { pattern: /^\/\/\s*(kotlin|kt)(\s|$|:)/i, lang: 'kotlin' },
        // Hash comments: #python, # Python, etc.
        { pattern: /^#\s*(python|py)(\s|$|:)/i, lang: 'python' },
        { pattern: /^#\s*(bash|sh|shell)(\s|$|:)/i, lang: 'bash' },
        { pattern: /^#\s*(ruby|rb)(\s|$|:)/i, lang: 'ruby' },
        // Multi-line comments: /*typescript, /* TypeScript, etc.
        { pattern: /^\/\*\s*(typescript|ts)(\s|$|:)/i, lang: 'typescript' },
        { pattern: /^\/\*\s*(javascript|js)(\s|$|:)/i, lang: 'javascript' },
    ];

    for (const { pattern, lang } of languagePatterns) {
        if (pattern.test(firstLine)) {
            return lang;
        }
    }

    // Check for TypeScript-specific keywords
    if (code.includes('interface ') || code.includes(': string') || code.includes(': number') || 
        code.includes('type ') || code.includes('as ') || code.includes('enum ')) {
        return 'typescript';
    }

    // Check for JavaScript-specific patterns
    if (code.includes('function ') || code.includes('const ') || code.includes('let ') || 
        code.includes('var ') || code.includes('=>') || code.includes('export ')) {
        return 'javascript';
    }

    // Check for Python-specific patterns
    if (code.includes('def ') || code.includes('import ') || code.includes('print(') || 
        code.includes('if __name__') || code.includes('lambda ')) {
        return 'python';
    }

    // Check for HTML/XML
    if (code.includes('<html') || code.includes('<!DOCTYPE') || code.includes('<div') || 
        code.includes('<span') || code.includes('<?xml')) {
        return 'markup';
    }

    // Check for CSS
    if (code.includes('{') && code.includes('}') && (code.includes(':') || code.includes('@media'))) {
        return 'css';
    }

    // Check for JSON
    if ((code.trim().startsWith('{') && code.trim().endsWith('}')) || 
        (code.trim().startsWith('[') && code.trim().endsWith(']'))) {
        try {
            JSON.parse(code);
            return 'json';
        } catch {
            // Not valid JSON
        }
    }

    return 'text'; // Default to plain text if no detection
}

/**
 * Code Block Component with Copy Button
 * Renders syntax-highlighted code blocks with a copy button
 * Auto-detects language if not explicitly provided
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
            toast.error('Failed to copy code: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    // Ensure we have valid code and language
    const codeContent = code || '';
    const hasExplicitLanguage = language && language.trim() !== '' && language.toLowerCase() !== 'text';
    
    // Auto-detect language if not explicitly provided
    const detectedLanguage = hasExplicitLanguage ? '' : detectLanguageFromCode(codeContent);
    const finalLanguage = hasExplicitLanguage ? language : detectedLanguage;
    const hasLanguage = hasExplicitLanguage || (detectedLanguage && detectedLanguage !== 'text');
    const lang = finalLanguage || 'text';

    return (
        <div className="relative group my-4">
            {/* Language label and copy button */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                {/* Language label - show if language is detected (explicit or auto-detected) */}
                {hasLanguage && (
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm border rounded pointer-events-auto">
                        {lang}
                    </div>
                )}
                {/* Copy button - always visible */}
                <div className="ml-auto pointer-events-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="h-8 px-2 bg-background/80 backdrop-blur-sm border"
                        title="Copy code"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </Button>
                </div>
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
                    paddingTop: "48px",
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

