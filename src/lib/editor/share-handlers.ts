/**
 * Share Handlers
 * 
 * Business logic for sharing markdown content
 */

import { uploadMarkdown } from '@/lib/api';
import { isApiConfigured, config } from '@/lib/config';
import { addSharedLink, type SharedLink } from '@/lib/storage';
import type { EditorState } from '@/types';

export interface ShareResult {
    success: boolean;
    shareUrl?: string;
    sharedLink?: SharedLink;
    error?: string;
    requiresSave?: boolean;
    shouldShowApiWarning?: boolean;
}

/**
 * Share markdown content
 */
export async function handleShare(
    markdown: string,
    editorState: EditorState
): Promise<ShareResult> {
    
    if (!markdown.trim()) {

        return {
            success: false,
            error: "Cannot share empty content"
        };
    }

    const { currentFileName } = editorState;

    // Enforce saving file before sharing - require filename
    if (!currentFileName) {
        return {
            success: false,
            requiresSave: true,
            error: "Please save this content with a filename before sharing"
        };
    }

    // Check if API is configured before attempting to share
    if (!isApiConfigured()) {
        return {
            success: false,
            shouldShowApiWarning: true,
            error: "API not configured. Please configure the API URL to use the share feature."
        };
    }

    try {
        const result = await uploadMarkdown(markdown);
        
        // Use frontendShareUrl from response directly (it's already a full URL)
        // Only construct URL if frontendShareUrl is not provided
        const fullUrl = result.frontendShareUrl || `${config.FRONTEND_URL}/share?id=${result.id}`;

        // Store shared link
        const sharedLink: SharedLink = {
            id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            shareId: result.id,
            url: fullUrl,
            preview: markdown.substring(0, 100) + (markdown.length > 100 ? '...' : ''),
            filename: `${currentFileName}.md`,
            timestamp: new Date().toISOString(),
        };
        addSharedLink(sharedLink);

        return {
            success: true,
            shareUrl: fullUrl,
            sharedLink,
            shouldShowApiWarning: false
        };
    } catch (error) {
        // Web Share API fallback removed - require API for sharing
        // Check if it's a connection error (API not available)
        if (error instanceof Error && error.message.includes('fetch')) {
            return {
                success: false,
                shouldShowApiWarning: true,
                error: "Failed to connect to API. Please check your API configuration."
            };
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to share. Please try again."
        };
    }
}

/**
 * Copy share URL to clipboard
 */
export async function copyShareUrl(shareUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
        await navigator.clipboard.writeText(shareUrl);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}