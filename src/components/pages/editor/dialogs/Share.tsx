import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, ExternalLink, Mail, MessageSquare, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface SharePanelProps {
    show: boolean;
    shareUrl: string;
    fileName?: string | null;
    onClose: () => void;
    onCopy?: () => void;
    onWebShare?: () => void;
}

export function SharePanel({
    show,
    shareUrl,
    fileName,
    onClose,
    onCopy,
    onWebShare,
}: SharePanelProps) {
    const [copied, setCopied] = useState(false);

    // Handle Esc key to close
    useEffect(() => {
        if (!show) return;
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [show, onClose]);

    if (!show || typeof document === 'undefined') return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
            onCopy?.();
        } catch (error) {
            toast.error("Failed to copy: " + (error instanceof Error ? error.message : "Unknown error"));
        }
    };

    const handleWebShare = async () => {
        if (navigator.share) {
            try {
                // Share link only with good description using filename
                const title = fileName ? `${fileName} - Markdown Document` : "Markdown Document";
                const description = fileName 
                    ? `Check out my markdown document "${fileName}"`
                    : "Check out this markdown document";
                
                await navigator.share({
                    title: title,
                    text: description,
                    url: shareUrl, // Link only, no markdown content
                });
                toast.success("Shared via Web Share!");
                onWebShare?.();
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    toast.error("Failed to share: " + (error instanceof Error ? error.message : "Unknown error"));
                }
            }
        } else {
            toast.info("Web Share API not available on this device");
        }
    };

    const handleOpenLink = () => {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    const handleEmailShare = () => {
        const subject = encodeURIComponent(fileName ? `Check out ${fileName}.md` : "Check out this markdown document");
        const body = encodeURIComponent(`Check out this markdown document:\n\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleSmsShare = () => {
        const text = encodeURIComponent(`Check out this markdown document: ${shareUrl}`);
        window.location.href = `sms:?body=${text}`;
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
            <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Share2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg text-foreground">
                                Share Document
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Share this markdown document with others
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Share URL Display */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Share Link
                    </label>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm font-mono break-all overflow-x-auto min-h-[2.5rem] flex items-center">
                            {shareUrl?.trim() || 'No share URL available'}
                        </div>
                        <Button
                            variant={copied ? "default" : "outline"}
                            size="sm"
                            onClick={handleCopy}
                            className="flex-shrink-0 gap-2"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                    {/* Web Share - Primary Action */}
                    {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                        <Button
                            variant="default"
                            size="lg"
                            onClick={handleWebShare}
                            className="w-full gap-2"
                        >
                            <Share2 className="w-5 h-5" />
                            Share via Web Share
                            <span className="text-xs opacity-80 ml-auto">Recommended</span>
                        </Button>
                    )}

                    {/* Open Link */}
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleOpenLink}
                        className="w-full gap-2"
                    >
                        <ExternalLink className="w-5 h-5" />
                        Open Link in Browser
                    </Button>

                    {/* Share Options Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEmailShare}
                            className="gap-2"
                        >
                            <Mail className="w-4 h-4" />
                            Email
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSmsShare}
                            className="gap-2"
                        >
                            <MessageSquare className="w-4 h-4" />
                            SMS
                        </Button>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center">
                        Anyone with this link can view the document
                    </p>
                </div>
            </Card>
        </div>,
        document.body
    );
}

