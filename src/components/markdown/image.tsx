"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { getSettings } from "@/lib/storage";
import type { Components } from "react-markdown";
import Image from "next/image";

/**
 * Enhanced Image Component for Markdown
 * Supports:
 * - Standard markdown images: ![alt](url)
 * - Image sizing: ![alt](url =200x300) or ![alt](url#width=200&height=300)
 * - Image alignment via HTML wrapper
 * - Lightbox preview on click
 */
export const MarkdownImage: Components['img'] = ({ src, alt }) => {
    const [showLightbox, setShowLightbox] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [lightboxImageError, setLightboxImageError] = useState(false);
    const { resolvedTheme } = useTheme();

    // Check if this is a badge image (shields.io, badges, etc.)
    const isBadge = (url: string): boolean => {
        const badgePatterns = [
            /shields\.io/i,
            /badge/i,
            /img\.shields\.io/i,
            /badgen\.net/i,
            /badges\.github\.io/i,
        ];
        return badgePatterns.some(pattern => pattern.test(url));
    };

    // Parse image size from src (supports =200x300 or #width=200&height=300)
    const parseImageSize = (url: string) => {
        let width: number | undefined;
        let height: number | undefined;
        let cleanUrl = url;

        // Parse =200x300 format
        const sizeMatch = url.match(/=(\d+)x(\d+)/);
        if (sizeMatch) {
            width = parseInt(sizeMatch[1]);
            height = parseInt(sizeMatch[2]);
            cleanUrl = url.replace(/=\d+x\d+/, '');
        }

        // Parse #width=200&height=300 format
        const hashMatch = url.match(/#width=(\d+)&height=(\d+)/);
        if (hashMatch) {
            width = parseInt(hashMatch[1]);
            height = parseInt(hashMatch[2]);
            cleanUrl = url.replace(/#width=\d+&height=\d+/, '');
        }

        return { width, height, cleanUrl };
    };

    const srcString = typeof src === 'string' ? src : '';
    const { width, height, cleanUrl } = parseImageSize(srcString);
    const badge = isBadge(cleanUrl);

    const handleImageClick = (e: React.MouseEvent) => {
        // For badges, allow default link behavior (don't prevent default)
        // Badges are usually inside links and should be clickable
        if (badge) {
            // Check if the badge is inside a link - if so, allow default behavior
            const target = e.currentTarget as HTMLElement;
            const parentLink = target.closest('a');
            if (parentLink) {
                // Badge is inside a link - allow the link to work
                return;
            }
        }
        
        // For non-badge images or badges not in links, prevent default and show lightbox
        e.preventDefault();
        e.stopPropagation();
        if (!badge) {
            setLightboxImageError(false); // Reset error state when opening lightbox
            setShowLightbox(true);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    // Handle Esc key to close lightbox (only if keyboard shortcuts are enabled)
    useEffect(() => {
        if (!showLightbox) return;

        const checkShortcutsEnabled = () => {
            const settings = getSettings();
            return settings?.keyboardShortcuts !== false;
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle Esc if keyboard shortcuts are enabled
            if (e.key === 'Escape' && checkShortcutsEnabled()) {
                setShowLightbox(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showLightbox]);

    // For badges, use larger dimensions for better visibility
    // For regular images, use larger defaults
    const imageWidth: number = width || (badge ? 120 : 800);
    const imageHeight: number = height || (badge ? 28 : 600);

    const containerStyle: React.CSSProperties = {
        display: 'inline-block',
        maxWidth: '100%',
        cursor: imageError ? 'default' : (badge ? 'pointer' : 'pointer'),
        ...(width && { width: `${width}px` }),
        ...(height && { height: `${height}px` }),
        ...(badge && { 
            height: '28px',
            verticalAlign: 'middle',
        }),
    };

    return (
        <>
            <span
                style={containerStyle}
                onClick={handleImageClick}
                className={imageError ? 'opacity-50' : (badge ? 'markdown-badge hover:opacity-90 transition-opacity' : 'hover:opacity-90 transition-opacity cursor-pointer')}
                title={imageError ? 'Failed to load image' : (badge ? alt || '' : 'Click to view full size')}
            >
                {imageError ? (
                    <span className="inline-flex items-center justify-center p-2 text-muted-foreground text-sm border border-destructive/20 rounded bg-destructive/5">
                        Broken Image
                    </span>
                ) : (
                    <Image
                        src={cleanUrl}
                        alt={alt || ''}
                        width={imageWidth}
                        height={imageHeight}
                        style={{
                            maxWidth: '100%',
                            height: badge ? '28px' : 'auto',
                            width: badge ? 'auto' : undefined,
                            display: 'block',
                            ...(width && !badge && { width: width }),
                            ...(height && !badge && { objectFit: 'contain' }),
                        }}
                        onError={(e) => {
                            // Prevent infinite reload loop - only set error once
                            if (!imageError) {
                                handleImageError();
                                // Hide the image element to prevent retries
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                            }
                        }}
                        className={badge ? 'markdown-badge-img' : ''}
                        unoptimized
                        loading="lazy"
                        priority={false}
                    />
                )}
            </span>
            {showLightbox && typeof document !== 'undefined' && createPortal(
                <div
                    className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm ${
                        resolvedTheme === 'dark' ? 'bg-black/90' : 'bg-black/80'
                    }`}
                    onClick={() => setShowLightbox(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <Card 
                        className="relative p-4 bg-background flex flex-col"
                        style={{ 
                            width: '95vw', 
                            height: '95vh',
                            maxWidth: '95vw',
                            maxHeight: '95vh'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                            <p className="text-sm text-muted-foreground truncate flex-1 mr-2">
                                {alt || cleanUrl}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowLightbox(false)}
                                className="h-8 w-8 p-0 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div 
                            className="overflow-auto flex-1 min-h-0 relative" 
                            style={{ 
                                width: '100%', 
                                height: 'calc(95vh - 60px)',
                                minHeight: '400px'
                            }}
                        >
                            {lightboxImageError ? (
                                <div className="flex items-center justify-center h-full w-full text-muted-foreground">
                                    <div className="text-center">
                                        <p className="text-sm mb-2">Failed to load image</p>
                                        <p className="text-xs break-all px-4">{cleanUrl}</p>
                                    </div>
                                </div>
                            ) : (
                                <Image
                                    src={cleanUrl}
                                    alt={alt || ''}
                                    fill
                                    className="object-contain"
                                    onClick={(e) => e.stopPropagation()}
                                    onError={(e) => {
                                        // Prevent infinite reload loop
                                        if (!lightboxImageError) {
                                            setLightboxImageError(true);
                                            // Hide the image element to prevent retries
                                            const target = e.currentTarget as HTMLImageElement;
                                            target.style.display = 'none';
                                        }
                                    }}
                                    unoptimized
                                    loading="eager"
                                />
                            )}
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </>
    );
}

