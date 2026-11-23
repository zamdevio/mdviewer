
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
 * - In-doc `#heading` fragment links (editor preview + share)
 *
 * Used by both editor preview and share pages
 */

import React, { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import { MarkdownBadges } from "./badges";
import { MarkdownCodeBlock } from "./code";
import { sanitizeSchema } from "./html";
import { MarkdownImage } from "./image";
import { MarkdownMermaid } from "./mermaid";
import { remarkEmoji } from "@/lib/remark-emoji";
import { contentLikelyHasMath } from "@/lib/markdown/content-signals";
import {
    navigateToMarkdownHeading,
    scrollToMarkdownHeading,
    syncMarkdownHeadingFromLocation,
} from "@/lib/markdown/heading-anchors";
import type { Components } from "react-markdown";
import type { PluggableList } from "unified";

let katexCssRequested = false;
export function ensureKatexCss() {
  if (katexCssRequested) return;
  katexCssRequested = true;
  void import("katex/dist/katex.min.css");
}

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

const HEADING_SCROLL_CLASS = "scroll-mt-24";

function headingComponent(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"): Components[typeof Tag] {
    return ({ children, className, ...rest }) => (
        <Tag
            className={[HEADING_SCROLL_CLASS, className].filter(Boolean).join(" ")}
            {...rest}
        >
            {children}
        </Tag>
    );
}

/** Shared by ReactMarkdown and hast-util-to-jsx-runtime paths. */
export const MarkdownComponents: Components = {
    h1: headingComponent("h1"),
    h2: headingComponent("h2"),
    h3: headingComponent("h3"),
    h4: headingComponent("h4"),
    h5: headingComponent("h5"),
    h6: headingComponent("h6"),
    code(props) {
        const { children, className: codeClassName, ...rest } = props;

        const codeString = String(children).replace(/\n$/, "").trim();

        // ✅ Detect code blocks (with or without language)
        // React-markdown ONLY adds className="language-xxx" or className="language-" to code blocks (triple backticks)
        // Inline code (single backticks) does NOT have the language- prefix
        // So we only check for the language- prefix to distinguish code blocks from inline code
        const isCodeBlock = codeClassName ? codeClassName.startsWith('language-') : false;

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
    table: ({ children, className, ...rest }) => (
        <div className="markdown-table-scroll">
            <table className={className} {...rest}>
                {children}
            </table>
        </div>
    ),
    span: (props) => <span {...props} />,
    div: (props) => <div {...props} />,
    a: ({ href, children, onClick, ...rest }) => {
        const isFragment = typeof href === "string" && href.startsWith("#") && href.length > 1;

        if (isFragment) {
            return (
                <a
                    href={href}
                    {...rest}
                    onClick={(event) => {
                        onClick?.(event);
                        if (event.defaultPrevented) return;
                        event.preventDefault();
                        const article = (event.currentTarget as HTMLElement).closest(
                            "article.markdown-body",
                        );
                        // pushState so browser Back restores the previous hash / scroll
                        navigateToMarkdownHeading(href, article);
                    }}
                >
                    {children}
                </a>
            );
        }

        return (
            <a
                href={href}
                {...rest}
                onClick={onClick}
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        );
    },
};

/** Inner react-markdown tree (no article wrapper) — used by virtualized chunks. */
export function MarkdownDocument({ content }: { content: string }) {
    const hasMath = contentLikelyHasMath(content);

    useEffect(() => {
        if (hasMath) ensureKatexCss();
    }, [hasMath]);

    const remarkPlugins: PluggableList = hasMath
        ? [remarkGfm, remarkMath, remarkEmoji]
        : [remarkGfm, remarkEmoji];

    const rehypePlugins: PluggableList = hasMath
        ? [
              rehypeRaw,
              rehypeKatex,
              rehypeSlug,
              // Sanitize after KaTeX/slug so generated HTML + ids are filtered
              [rehypeSanitize, sanitizeSchema],
          ]
        : [rehypeRaw, rehypeSlug, [rehypeSanitize, sanitizeSchema]];

    return (
        <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={MarkdownComponents}
        >
            {content}
        </ReactMarkdown>
    );
}

export function MarkdownViewer({ content, className = "" }: MarkdownViewerProps) {
    const articleRef = useRef<HTMLElement>(null);

    // Deep-link / refresh: scroll to hash after content paints (share URL or editor split)
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || hash.length < 2) return;

        let cancelled = false;
        const run = () => {
            if (cancelled) return;
            scrollToMarkdownHeading(hash, articleRef.current, "smooth");
        };

        // Two frames: rehype needs a paint after ReactMarkdown commit
        const id = requestAnimationFrame(() => {
            requestAnimationFrame(run);
        });
        const t = window.setTimeout(run, 120);
        return () => {
            cancelled = true;
            cancelAnimationFrame(id);
            window.clearTimeout(t);
        };
    }, [content]);

    useEffect(() => {
        const sync = () => {
            syncMarkdownHeadingFromLocation(articleRef.current, "smooth");
        };
        window.addEventListener("hashchange", sync);
        window.addEventListener("popstate", sync);
        return () => {
            window.removeEventListener("hashchange", sync);
            window.removeEventListener("popstate", sync);
        };
    }, []);

    return (
        <article ref={articleRef} className={`markdown-body ${className}`}>
            <MarkdownDocument content={content} />
        </article>
    );
}
