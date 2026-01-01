"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink, Copy, X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { getSharedLinks, removeSharedLink, clearSharedLinks, onStorageChange, type SharedLink } from "@/lib/storage";

export default function SharesPage(): React.JSX.Element {
    const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [showClearWarning, setShowClearWarning] = useState(false);
    const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);

    useEffect(() => {
        const loadSharedLinks = async () => {
            const links = await getSharedLinks();
            setSharedLinks(links);
            setLoading(false);
        };
        loadSharedLinks();
    }, []);

    // Listen for shared links changes
    useEffect(() => {
        const unsubscribe = onStorageChange((key) => {
            if (key === 'mdviewer_shared_links' || key === null) {
                setSharedLinks(getSharedLinks());
            }
        });
        return unsubscribe;
    }, []);

    const handleCopyLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied!");
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleDeleteLink = (shareId: string) => {
        setDeleteLinkId(shareId);
    };

    const handleDeleteConfirm = () => {
        if (deleteLinkId) {
            removeSharedLink(deleteLinkId);
            setSharedLinks(getSharedLinks());
            setDeleteLinkId(null);
            toast.success("Link removed");
        }
    };

    const handleClearAll = () => {
        clearSharedLinks();
        setSharedLinks([]);
        setShowClearWarning(false);
        toast.success("All links cleared");
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className={`container mx-auto p-3 sm:p-4 min-h-[calc(100vh-100px)] flex flex-col gap-4 sm:gap-6 animate-fade-in`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Shared Links
                </h1>
                {sharedLinks.length > 0 && (
                    <div className="w-full sm:w-auto flex sm:block justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 w-auto"
                            onClick={() => setShowClearWarning(true)}
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Clear All</span>
                        </Button>
                    </div>
                )}
            </div>

            {sharedLinks.length === 0 ? (
                <Card className="p-6 sm:p-8 text-center">
                    <Share2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-lg sm:text-xl font-semibold mb-2">No Shared Links</h2>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                        Shared links will appear here when you share content from the editor.
                    </p>
                    <Link href="/editor" className="inline-block">
                        <Button variant="default" className="gap-2">
                            <Share2 className="w-4 h-4" />
                            Go to Editor
                        </Button>
                    </Link>
                </Card>
            ) : (
                <>
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {sharedLinks.map((link) => (
                            <Card key={link.id} className="p-3 sm:p-4 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2 min-w-0">
                                    <div className="flex-1 min-w-0">
                                        {link.filename && (
                                            <div className="mb-2 pb-2 border-b border-border">
                                                <p className="text-xs text-muted-foreground mb-1 truncate">File:</p>
                                                <p className="text-sm font-semibold truncate max-w-full" title={link.filename}>
                                                    {link.filename}
                                                </p>
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground truncate mb-2 max-w-full" title={link.shareId}>
                                            ID: <span className="font-mono">{link.shareId}</span>
                                        </p>
                                        {link.preview && (
                                            <div className="mt-2 mb-2">
                                                <p className="text-xs text-muted-foreground mb-1.5">Preview:</p>
                                                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                                                    <p className="text-sm text-foreground whitespace-pre-wrap break-words line-clamp-4 leading-relaxed">
                                                        {link.preview}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-auto pt-2 border-t border-border">
                                            <p className="text-xs text-muted-foreground truncate max-w-full" title={new Date(link.timestamp).toLocaleString()}>
                                                {new Date(link.timestamp).toLocaleDateString()} {new Date(link.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteLink(link.shareId)}
                                        className="h-6 w-6 p-0 flex-shrink-0"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={link.url} target="_blank" className="flex-1 min-w-0">
                                        <Button variant="default" size="sm" className="w-full gap-2">
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                            <span className="hidden sm:inline">View</span>
                                            <span className="sm:hidden">Open</span>
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopyLink(link.url)}
                                        className="gap-2 flex-1 sm:flex-initial"
                                    >
                                        <Copy className="w-3 h-3 flex-shrink-0" />
                                        <span className="hidden sm:inline">Copy</span>
                                        <span className="sm:hidden">Copy Link</span>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Delete Link Warning Dialog */}
            {deleteLinkId && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setDeleteLinkId(null);
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <Trash2 className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1 text-destructive">
                                    Delete Shared Link
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Are you sure you want to delete this shared link?
                                </p>
                                <p className="text-sm font-medium text-destructive">
                                    This action cannot be undone!
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteLinkId(null)}
                                className="h-6 w-6 p-0 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                className="gap-2 w-full"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteLinkId(null)}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}

            {/* Clear All Warning Dialog */}
            {showClearWarning && typeof document !== 'undefined' && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowClearWarning(false);
                        }
                    }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                    <Card className="relative bg-background border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col transform transition-all p-6 overflow-y-auto">
                        <div className="flex items-start gap-3 mb-4">
                            <Trash2 className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1 text-destructive">
                                    Clear All Shared Links
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Are you sure you want to delete all {sharedLinks.length} shared links?
                                </p>
                                <p className="text-sm font-medium text-destructive">
                                    This action cannot be undone!
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowClearWarning(false)}
                                className="h-6 w-6 p-0 flex-shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="destructive"
                                onClick={handleClearAll}
                                className="gap-2 w-full"
                            >
                                <Trash2 className="w-4 h-4" />
                                Clear All
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowClearWarning(false)}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>,
                document.body
            )}
        </div>
    );
}

