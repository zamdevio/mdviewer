"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";

/**
 * HTML Component Handler
 * Sanitizes and renders HTML elements safely
 * This component is used by rehype-raw to render HTML in markdown
 */
export function MarkdownHTML({ 
    children 
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
 * Allows safe HTML elements and attributes
 */
export const sanitizeSchema = {
    tagNames: [
        'div', 'span', 'p', 'br', 'hr',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 's', 'code', 'pre',
        'ul', 'ol', 'li',
        'blockquote',
        'a', 'img',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'details', 'summary',
        'abbr', 'b', 'i', 'small', 'sub', 'sup',
    ],
    attributes: {
        '*': ['id', 'class', 'title', 'className'],
        'div': ['align', 'style'],
        'span': ['align', 'style'],
        'p': ['align', 'style'],
        'code': ['className', 'class'],
        'pre': ['className', 'class'],
        'a': ['href', 'title', 'target', 'rel'],
        'img': ['src', 'alt', 'title', 'width', 'height', 'style'],
        'table': ['align', 'style'],
        'th': ['align', 'colspan', 'rowspan', 'style'],
        'td': ['align', 'colspan', 'rowspan', 'style'],
        'details': ['open'],
    },
    protocols: {
        href: ['http', 'https', 'mailto'],
        src: ['http', 'https', 'data'],
    },
    clobber: ['id', 'name'],
    clobberPrefix: 'user-content-',
    strip: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
};

