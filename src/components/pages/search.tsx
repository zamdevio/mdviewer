"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ExternalLink, FileText } from "lucide-react";
import { fetchSharedMarkdown } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";
import { config } from "@/lib/config";

export default function SearchPage(): React.JSX.Element {
    const [shareId, setShareId] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus search input when page loads
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // Extract share ID from URL or use as-is if it's just an ID
    const extractShareId = (input: string): string | null => {
        const trimmed = input.trim();
        if (!trimmed) return null;

        try {
            // Try to parse as URL
            const url = new URL(trimmed);
            // Check if it's a share URL
            if (url.pathname.startsWith('/share')) {
                // Extract from query param: ?id=abc123
                const id = url.searchParams.get('id');
                if (id) return id;
                // Extract from path: /share/abc123
                const pathMatch = url.pathname.match(/^\/share\/([^\/]+)/);
                if (pathMatch) return pathMatch[1];
            }
            // Check if it's a share URL without protocol
            if (trimmed.includes('/share')) {
                const match = trimmed.match(/\/share[\/?]id=([^&\s]+)|\/share\/([^\/\s]+)/);
                if (match) return match[1] || match[2];
            }
        } catch {
            // Not a URL, treat as ID
        }

        // If it's just an ID (alphanumeric, no spaces, no slashes)
        if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return trimmed;
        }

        return null;
    };

    const handleSearch = async () => {
        if (!shareId.trim()) {
            toast.error("Please enter a share ID or URL");
            return;
        }

        const extractedId = extractShareId(shareId);
        if (!extractedId) {
            toast.error("Invalid share ID or URL. Please enter a valid share ID or URL.");
            return;
        }

        setLoading(true);
        setError(null);
        setPreview(null);

        try {
            const content = await fetchSharedMarkdown(extractedId);
            // Get first 200 characters as preview
            const previewText = content.substring(0, 200);
            setPreview(previewText + (content.length > 200 ? "..." : ""));
            // Update shareId to show the extracted ID
            setShareId(extractedId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load shared content");
            toast.error("Content not found");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex flex-col gap-6 animate-fade-in">
            <div className="text-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 mb-2">
                    Search Shared Content
                </h1>
                <p className="text-muted-foreground">
                    Enter a share ID or full URL to find and view shared markdown content
                </p>
            </div>

            <Card className="p-6 max-w-2xl mx-auto w-full">
                <div className="flex gap-2">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={`Enter share ID or URL (e.g., abc123 or ${config.FRONTEND_URL}/share?id=abc123)`}
                        value={shareId}
                        onChange={(e) => setShareId(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                        onClick={handleSearch}
                        disabled={loading || !shareId.trim()}
                        className="gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Search
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {error && (
                <Card className="p-6 max-w-2xl mx-auto w-full border-destructive/50 bg-destructive/10">
                    <div className="flex items-center gap-2 text-destructive">
                        <FileText className="w-5 h-5" />
                        <h3 className="font-semibold">Content Not Found</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        {error}
                    </p>
                </Card>
            )}

            {preview && (
                <Card className="p-6 max-w-2xl mx-auto w-full border-primary/20 bg-primary/5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="font-semibold text-lg mb-1">Content Found</h3>
                            <p className="text-sm text-muted-foreground">
                                Share ID: <code className="bg-muted px-1 rounded">{shareId}</code>
                            </p>
                        </div>
                    </div>
                    
                    <div className="mb-4 p-4 bg-background rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {preview}
                        </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <Link href={`/share?id=${shareId}`} className="flex-1 min-w-[120px]">
                            <Button variant="default" className="w-full gap-2">
                                <ExternalLink className="w-4 h-4" />
                                View Full Content
                            </Button>
                        </Link>
                        <Link href={`/editor?load=${shareId}`} className="flex-1 min-w-[120px]">
                            <Button variant="outline" className="w-full gap-2">
                                <FileText className="w-4 h-4" />
                                Fork to Editor
                            </Button>
                        </Link>
                    </div>
                </Card>
            )}
        </div>
    );
}

