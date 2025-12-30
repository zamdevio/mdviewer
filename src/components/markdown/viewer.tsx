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
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import 'katex/dist/katex.min.css';
import { MarkdownImage, MarkdownMermaid, MarkdownCodeBlock, MarkdownBadges, MarkdownEmoji, sanitizeSchema } from './index';

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

/**
 * Helper function to recursively process children for emoji replacement
 * This ensures emojis work in all text nodes, not just top-level ones
 */
function processChildrenForEmoji(children: ReactNode): ReactNode {
    if (typeof children === 'string') {
        return <MarkdownEmoji>{children}</MarkdownEmoji>;
    }
    
    if (Array.isArray(children)) {
        return children.map((child, index) => {
            const processed = processChildrenForEmoji(child);
            // If processed is a string wrapped in MarkdownEmoji, return as-is
            // Otherwise, wrap in Fragment to maintain structure
            return <React.Fragment key={index}>{processed}</React.Fragment>;
        });
    }
    
    // For React elements, we need to be careful not to break ReactMarkdown's structure
    // Only process if it's a simple text node or array
    if (children && typeof children === 'object' && 'props' in children) {
        const element = children as React.ReactElement<{ children?: ReactNode }>;
        // Only clone if it has children that need processing
        const elementChildren = element.props?.children;
        if (elementChildren !== undefined) {
            const processedChildren = processChildrenForEmoji(elementChildren);
            // Only clone if children actually changed
            if (processedChildren !== elementChildren) {
                return React.cloneElement(element, {
                    ...element.props,
                    children: processedChildren,
                } as any);
            }
        }
    }
    
    return children;
}

export function MarkdownViewer({ content, className = "" }: MarkdownViewerProps) {
    const { resolvedTheme } = useTheme();

    return (
        <article className={`markdown-body ${className}`}>
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[
                    rehypeRaw,
                    [rehypeSanitize, sanitizeSchema],
                    rehypeKatex,
                ]}
                components={{
                    code(props) {
                        const { children, className: codeClassName, ...rest } = props;
                        const childrenString = String(children);
                        
                        // Check if this is an inline code or code block
                        // Code blocks have className like "language-xxx" or are wrapped in <pre>
                        const isCodeBlock = codeClassName && codeClassName.startsWith('language-');
                        const match = /language-(\w+)/.exec(codeClassName || "");
                        const language = match ? match[1] : "";
                        
                        // Clean up the code string
                        const codeString = childrenString.replace(/\n$/, "").trim();
                        
                        // Handle Mermaid diagrams - check for "mermaid" language
                        if (isCodeBlock && (language === "mermaid" || language.toLowerCase() === "mermaid")) {
                            return <MarkdownMermaid code={codeString} />;
                        }
                        
                        // Handle regular code blocks with syntax highlighting and copy button
                        // Render as code block if it has a language class (even if empty)
                        if (isCodeBlock) {
                            return <MarkdownCodeBlock language={language || 'text'} code={codeString} />;
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
                            const childProps = children.props as any;
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
                    p: (props) => {
                        // Process badges FIRST with raw children (badges need raw structure to detect)
                        // MarkdownBadges returns either a flex container (badges) or regular paragraph
                        const BadgeComponent = MarkdownBadges as React.ComponentType<React.ComponentProps<'p'>>;
                        const badgeElement = React.createElement(BadgeComponent, props, props.children);
                        
                        // Process emojis in the result (whether it's badges or regular paragraph)
                        if (React.isValidElement(badgeElement)) {
                            const badgeProps = badgeElement.props as { children?: ReactNode; className?: string; [key: string]: any };
                            // Clone the element and process emojis in its children
                            return React.cloneElement(badgeElement as React.ReactElement<{ children?: ReactNode; className?: string }>, {
                                children: processChildrenForEmoji(badgeProps.children),
                            });
                        }
                        
                        // Fallback: process emojis normally
                        return (
                            <p {...props}>
                                {processChildrenForEmoji(props.children)}
                            </p>
                        );
                    },
                    // Strikethrough support (from ~~text~~) - process emojis in children
                    del: ({ children, className, ...props }) => (
                        <del className={className || ''} {...props}>
                            {processChildrenForEmoji(children)}
                        </del>
                    ),
                    s: ({ children, className, ...props }) => (
                        <s className={className || ''} {...props}>
                            {processChildrenForEmoji(children)}
                        </s>
                    ),
                    // Process emojis in other text-containing elements
                    strong: ({ children, ...props }) => (
                        <strong {...props}>
                            {processChildrenForEmoji(children)}
                        </strong>
                    ),
                    em: ({ children, ...props }) => (
                        <em {...props}>
                            {processChildrenForEmoji(children)}
                        </em>
                    ),
                    li: ({ children, ...props }) => (
                        <li {...props}>
                            {processChildrenForEmoji(children)}
                        </li>
                    ),
                    h1: ({ children, ...props }) => (
                        <h1 {...props}>
                            {processChildrenForEmoji(children)}
                        </h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2 {...props}>
                            {processChildrenForEmoji(children)}
                        </h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3 {...props}>
                            {processChildrenForEmoji(children)}
                        </h3>
                    ),
                    h4: ({ children, ...props }) => (
                        <h4 {...props}>
                            {processChildrenForEmoji(children)}
                        </h4>
                    ),
                    h5: ({ children, ...props }) => (
                        <h5 {...props}>
                            {processChildrenForEmoji(children)}
                        </h5>
                    ),
                    h6: ({ children, ...props }) => (
                        <h6 {...props}>
                            {processChildrenForEmoji(children)}
                        </h6>
                    ),
                    blockquote: ({ children, ...props }) => (
                        <blockquote {...props}>
                            {processChildrenForEmoji(children)}
                        </blockquote>
                    ),
                    td: ({ children, ...props }) => (
                        <td {...props}>
                            {processChildrenForEmoji(children)}
                        </td>
                    ),
                    th: ({ children, ...props }) => (
                        <th {...props}>
                            {processChildrenForEmoji(children)}
                        </th>
                    ),
                    // Apply emoji to text nodes (but skip math nodes)
                    text: ({ children }) => {
                        if (typeof children === 'string') {
                            // Don't process math content (it's handled by rehype-katex)
                            // Math nodes are wrapped in special elements by rehype-katex
                            return <MarkdownEmoji>{children}</MarkdownEmoji>;
                        }
                        return <>{children}</>;
                    },
                    // Ensure math elements from rehype-katex are not processed by emoji
                    // rehype-katex creates elements with class "katex" or "katex-display"
                    // We need to handle these explicitly to ensure they render correctly
                    span: ({ children, className, ...props }) => {
                        // Check if this is a KaTeX math element
                        if (className && (className.includes('katex') || className.includes('math'))) {
                            // Let KaTeX handle it, don't process for emojis
                            return <span className={className} {...props}>{children}</span>;
                        }
                        // For other spans, process emojis
                        return <span className={className} {...props}>{processChildrenForEmoji(children)}</span>;
                    },
                    div: ({ children, className, ...props }) => {
                        // Check if this is a KaTeX math display element
                        if (className && (className.includes('katex') || className.includes('math'))) {
                            // Let KaTeX handle it, don't process for emojis
                            return <div className={className} {...props}>{children}</div>;
                        }
                        // For other divs, process emojis
                        return <div className={className} {...props}>{processChildrenForEmoji(children)}</div>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </article>
    );
}

