"use client";

import type { Components } from "react-markdown";
import React from "react";

/**
 * Badge/Image Link Component
 * Renders badge images (like shields.io badges) in rows
 * - Badges on consecutive lines (no breaks) merge into one row
 * - Backslash `\` at end of line prevents merging with next badge
 * - Multiple rows are rendered if there are line breaks between badge groups
 * GitHub-style: badges merge into one line if no line breaks between them
 */

// Allowable types for children: string | ReactElement | null | undefined
type ChildNode = React.ReactNode;
type ElementWithPossibleChildren = React.ReactElement<{ children?: React.ReactNode }>;

// Utility type guard
function isReactElement(node: unknown): node is React.ReactElement {
    return !!node && typeof node === "object" && "type" in node;
}

export const MarkdownBadges: Components['p'] = ({ children, ...props }) => {
    const childrenArray: ChildNode[] = Array.isArray(children) ? children : [children];

    const isLineBreak = (child: unknown): boolean => {
        if (!isReactElement(child)) return false;
        const type = child.type as React.ElementType;
        return (
            type === 'br' ||
            (typeof type === 'function' &&
                (type.displayName === 'br' || type.name === 'br'))
        );
    };

    // Helper to check if a child is an image link (badge)
    const isImageLink = (child: unknown): boolean => {
        if (!isReactElement(child)) return false;

        // Check if it's a link element
        {
            const type = child.type as React.ElementType;
            if (type === 'a' || (typeof type === 'function' && (type.displayName === 'a' || type.name === 'a'))) {
                // Check if it contains an image
                const hasImage = (node: unknown): boolean => {
                    if (!isReactElement(node)) return false;
                    const t = node.type as React.ElementType;
                    if (t === 'img' || (typeof t === 'function' && (t.displayName === 'img' || t.name === 'img'))) return true;
                    if (typeof node === 'string') return false;
                    // Check children recursively
                    const n = node as ElementWithPossibleChildren;
                    if (Array.isArray(n.props?.children)) {
                        return n.props.children.some((c) => hasImage(c));
                    }
                    return hasImage(n.props?.children);
                };
                return hasImage(child);
            }
        }

        // Check if it's directly an image
        {
            const type = child.type as React.ElementType;
            if (type === 'img' || (typeof type === 'function' && (type.displayName === 'img' || type.name === 'img'))) return true;
        }

        // Recursively check children if any
        const c = (child as ElementWithPossibleChildren).props?.children;
        if (c) {
            const childrenList = Array.isArray(c) ? c : [c];
            return childrenList.some((cc) => isImageLink(cc));
        }

        return false;
    };

    // Check if text contains backslash (indicates line break in markdown)
    const hasBackslash = (text: string): boolean => {
        if (typeof text !== 'string') return false;
        // Check for backslash at end (with optional whitespace) or backslash followed by newline
        return /\\\s*$/.test(text) || /\\\s*\n/.test(text);
    };

    // First, check if this paragraph contains only badges (or badges with whitespace/backslashes)
    const allChildren = childrenArray.filter((child) => {
        if (typeof child === 'string') {
            // Allow whitespace and backslashes (they indicate line breaks)
            return true;
        }
        if (isLineBreak(child)) return true;
        return isImageLink(child);
    });

    // If we have non-badge content, return default paragraph
    if (allChildren.length !== childrenArray.length) {
        return <p {...props}>{children}</p>;
    }

    // Group badges into rows based on line breaks and backslashes
    // Each group will be rendered in its own row
    const badgeGroups: React.ReactNode[][] = [];
    let currentGroup: React.ReactNode[] = [];
    let shouldStartNewGroup = false;

    for (let i = 0; i < childrenArray.length; i++) {
        const child = childrenArray[i];

        // Check for line breaks
        if (isLineBreak(child)) {
            // Found a <br> - finalize current group and start new one
            if (currentGroup.length > 0) {
                badgeGroups.push([...currentGroup]);
                currentGroup = [];
            }
            shouldStartNewGroup = false;
            continue;
        }

        // Check text nodes for backslashes
        if (typeof child === 'string') {
            if (hasBackslash(child)) {
                // Backslash found - finalize current group (next badge starts new group)
                if (currentGroup.length > 0) {
                    badgeGroups.push([...currentGroup]);
                    currentGroup = [];
                }
                shouldStartNewGroup = true;
                continue;
            }

            // Whitespace only - continue (don't add to group, but don't break it either)
            continue;
        }

        // Check if this is a badge
        if (isImageLink(child)) {
            // If we should start a new group (due to backslash), do so
            if (shouldStartNewGroup && currentGroup.length > 0) {
                badgeGroups.push([...currentGroup]);
                currentGroup = [];
            }

            currentGroup.push(child);
            shouldStartNewGroup = false;
        }
    }

    // Add the last group if it has badges
    if (currentGroup.length > 0) {
        badgeGroups.push(currentGroup);
    }

    // If we have badge groups, render them in rows
    if (badgeGroups.length > 0) {
        return (
            <div {...props} className={`${props.className || ''} space-y-2`}>
                {badgeGroups.map((group, index) => (
                    <p key={index} className="flex flex-wrap gap-2 items-center my-2">
                        {group}
                    </p>
                ))}
            </div>
        );
    }

    // Default paragraph rendering (with emoji support handled by viewer)
    return <p {...props}>{children}</p>;
};
