"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import type { Components } from "react-markdown";

/**
 * Enhanced Image Component for Markdown
 * Supports:
 * - Standard markdown images: ![alt](url)
 * - Image sizing: ![alt](url =200x300) or ![alt](url#width=200&height=300)
 * - Image alignment via HTML wrapper
 * - Lightbox preview on click
 */
export const MarkdownImage: Components['img'] = ({ src, alt, ...props }) => {
    const [showLightbox, setShowLightbox] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { resolvedTheme } = useTheme();

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

    const handleImageClick = () => {
        if (!imageError) {
            setShowLightbox(true);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    const imageStyle: React.CSSProperties = {
        maxWidth: '100%',
        height: 'auto',
        cursor: imageError ? 'default' : 'pointer',
        ...(width && { width: `${width}px` }),
        ...(height && { height: `${height}px`, objectFit: 'contain' }),
    };

    return (
        <>
            <img
                src={cleanUrl}
                alt={alt || ''}
                style={imageStyle}
                onClick={handleImageClick}
                onError={handleImageError}
                className={imageError ? 'opacity-50' : 'hover:opacity-90 transition-opacity'}
                title={imageError ? 'Failed to load image' : 'Click to view full size'}
                {...props}
            />
            {showLightbox && typeof document !== 'undefined' && createPortal(
                <div
                    className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm ${
                        resolvedTheme === 'dark' ? 'bg-black/90' : 'bg-black/80'
                    }`}
                    onClick={() => setShowLightbox(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <Card className="relative max-w-[90vw] max-h-[90vh] p-4 bg-background flex flex-col">
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
                        <div className="overflow-auto flex-1 min-h-0">
                            <img
                                src={cleanUrl}
                                alt={alt || ''}
                                className="max-w-full max-h-full object-contain mx-auto"
                                onClick={(e) => e.stopPropagation()}
                                style={{ display: 'block' }}
                            />
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </>
    );
}

