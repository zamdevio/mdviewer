"use client";

/**
 * Shared Markdown Viewer Component
 * 
 * This is the main component for rendering markdown with all features:
 * - HTML support (with sanitization)
 * - Math/LaTeX (KaTeX)
 * - Mermaid diagrams
 * - Code blocks with copy button
 * - Image lightbox
 * - Badge images in rows
 * - Emoji support (recursive)
 * - Strikethrough support
 * 
 * Used by both editor preview and share pages
 */

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { MarkdownImage, MarkdownMermaid, MarkdownCodeBlock, MarkdownBadges, sanitizeSchema } from './index';
import { remarkEmoji } from '@/lib/remark-emoji';
import type { Components } from "react-markdown";

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

const MarkdownComponents: Components = {
    code(props) {
        const { children, className: codeClassName, node, ...rest } = props;

        const codeString = String(children).replace(/\n$/, "").trim();

        // ✅ Detect ANY code block (with or without language)
        // React-markdown always adds className="language-xxx" or className="language-" to code blocks
        // Inline code doesn't have the language- prefix
        // Also check if node is a code element (code blocks are always in <pre><code>)
        const isCodeBlock =
            (codeClassName && codeClassName.startsWith('language-')) ||
            (node?.tagName === "code" && node?.type === "element");

        const match = /language-(\w+)/.exec(codeClassName || "");
        const language = match ? match[1] : "";
        // Handle Mermaid diagrams - check for "mermaid" language
        if (isCodeBlock && (language === "mermaid" || language.toLowerCase() === "mermaid")) {
            return <MarkdownMermaid code={codeString} />;
        }

        // Handle regular code blocks with syntax highlighting and copy button
        // Render as code block if it has a language class (even if empty or no language specified)
        // Code blocks with just ``` will have 'language-' class but empty language
        if (isCodeBlock) {
            // If no language specified, pass empty string to syntax highlighter '' - syntax highlighter will handle it
            const detectedLanguage = language && language.trim() !== '' ? language : '';
            return <MarkdownCodeBlock language={detectedLanguage} code={codeString} />;
        }

        // Inline code - no emoji processing for code
        return (
            <code className={codeClassName} {...rest}>
                {children}
            </code>
        );
    },
    pre(props) {
        // ReactMarkdown wraps code blocks in <pre><code>
        // When code component returns MarkdownMermaid or MarkdownCodeBlock,
        // those components already have their own containers, so we shouldn't wrap them in <pre>
        const { children, ...rest } = props;

        // Check if the child is a code element that will be processed by our code component
        if (React.isValidElement(children)) {
            const childProps = children.props as React.ComponentProps<'code'>;
            // If it's a code element with language class, the code component will handle it
            // and return MarkdownMermaid or MarkdownCodeBlock which have their own containers
            if (children.type === 'code' && childProps?.className?.startsWith('language-')) {
                // Return the code element as-is, it will be processed by the code component
                // The code component will return the appropriate component (Mermaid/CodeBlock)
                // which already has its own container, so no need for <pre> wrapper
                return <>{children}</>;
            }
        }

        // For non-code-block pre elements, render normally
        return <pre {...rest}>{children}</pre>;
    },
    img: MarkdownImage,
    p: MarkdownBadges,
    span: (props) => <span {...props} />,
    div: (props) => <div {...props} />,
};

export function MarkdownViewer({ content, className = "" }: MarkdownViewerProps) {
    return (
        <article className={`markdown-body ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath, remarkEmoji]}
                rehypePlugins={[
                    rehypeRaw,
                    [rehypeSanitize, sanitizeSchema],
                    rehypeKatex,
                ]}
                components={MarkdownComponents}
            >
                {content}
            </ReactMarkdown>
        </article>
    );
}

