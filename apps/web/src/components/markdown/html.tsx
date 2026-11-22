import { Fragment } from "react";
import type { ReactNode } from "react";

/**
 * HTML Component Handler
 * Sanitizes and renders HTML elements safely
 * This component is used by rehype-raw to render HTML in markdown
 */
export function MarkdownHTML({
    children,
}: {
    node: React.ReactNode;
    children?: ReactNode;
}) {
    // This is handled by rehype-sanitize configuration
    // We just need to pass through the rendered HTML
    return <Fragment>{children}</Fragment>;
}

/**
 * Sanitization schema for rehype-sanitize
 * Tight allowlist — no inline style (overlay phishing), no data: URLs
 */
export const sanitizeSchema = {
    tagNames: [
        "div",
        "span",
        "p",
        "br",
        "hr",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "strong",
        "em",
        "u",
        "s",
        "code",
        "pre",
        "ul",
        "ol",
        "li",
        "blockquote",
        "a",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "details",
        "summary",
        "abbr",
        "b",
        "i",
        "small",
        "sub",
        "sup",
        // KaTeX / math fragments after rehype-katex
        "math",
        "semantics",
        "annotation",
        "mrow",
        "mi",
        "mo",
        "mn",
        "msup",
        "msub",
        "mfrac",
        "msqrt",
        "mroot",
        "mtable",
        "mtr",
        "mtd",
    ],
    attributes: {
        "*": ["id", "class", "title", "className"],
        div: ["align"],
        span: ["align"],
        p: ["align"],
        code: ["className", "class"],
        pre: ["className", "class"],
        a: ["href", "title", "target", "rel"],
        img: ["src", "alt", "title", "width", "height"],
        table: ["align"],
        th: ["align", "colspan", "rowspan"],
        td: ["align", "colspan", "rowspan"],
        details: ["open"],
        annotation: ["encoding"],
    },
    protocols: {
        // Relative + `#fragment` always allowed when protocols is set (hast-util-sanitize)
        href: ["http", "https", "mailto"],
        src: ["http", "https"],
    },
    clobber: ["id", "name"],
    clobberPrefix: "user-content-",
    strip: ["script", "iframe", "object", "embed", "form", "input", "button"],
};
