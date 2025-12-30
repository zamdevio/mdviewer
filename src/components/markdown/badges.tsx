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
export const MarkdownBadges: Components['p'] = ({ children, ...props }) => {
    const childrenArray = Array.isArray(children) ? children : [children];

    const isLineBreak = (child: any): boolean => {
        if (!child || typeof child !== 'object') return false;
        return child.type === 'br' || child.type?.displayName === 'br' || child.type?.name === 'br';
    };
    
    // Helper to check if a child is an image link (badge)
    const isImageLink = (child: any): boolean => {
        if (!child || typeof child !== 'object') return false;
        
        // Check if it's a link element
        if (child.type === 'a' || child.type?.displayName === 'a' || child.type?.name === 'a') {
            // Check if it contains an image
            const hasImage = (node: any): boolean => {
                if (!node) return false;
                if (node.type === 'img' || node.type?.displayName === 'img' || node.type?.name === 'img') return true;
                if (typeof node === 'string') return false;
                if (Array.isArray(node.props?.children)) {
                    return node.props.children.some((c: any) => hasImage(c));
                }
                return hasImage(node.props?.children);
            };
            return hasImage(child);
        }
        
        // Check if it's directly an image
        if (child.type === 'img' || child.type?.displayName === 'img' || child.type?.name === 'img') return true;
        
        // Recursively check children
        if (child.props?.children) {
            const children = Array.isArray(child.props.children) 
                ? child.props.children 
                : [child.props.children];
            return children.some((c: any) => isImageLink(c));
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
