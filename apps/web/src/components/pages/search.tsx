
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ExternalLink, FileText, Settings } from "lucide-react";
import { fetchSharedMarkdown } from "@/lib/api";
import { toast } from "sonner";
import { getEffectiveApiConfig, isApiConfigured } from "@/lib/config";

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
            const url = new URL(trimmed);
            if (url.pathname.startsWith("/share/")) {
                const pathMatch = url.pathname.match(/^\/share\/([^/]+)/);
                if (pathMatch) return pathMatch[1];
            }
        } catch {
            // Not a URL — bare share id below
        }
        if (trimmed.includes("/share/")) {
            const pathMatch = trimmed.match(/\/share\/([^/?#\s]+)/);
            if (pathMatch) return pathMatch[1];
        }

        // If it's just an ID (alphanumeric, no spaces, no slashes)
        if (/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
            return trimmed;
        }

        return null;
    };

    const apiReady = isApiConfigured();

    const handleSearch = async () => {
        if (!apiReady) {
            toast.error("Share API is not configured. Set it in Settings.");
            return;
        }
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
            const previewText = content.substring(0, 200);
            setPreview(previewText + (content.length > 200 ? "..." : ""));
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

            {!apiReady && (
                <Card className="p-6 max-w-2xl mx-auto w-full border-dashed text-center">
                    <Settings className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <h2 className="text-lg font-semibold mb-2">Share API not configured</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Set the share worker URL under Settings → Share (or build-time VITE_* vars).
                    </p>
                    <Button asChild variant="outline" className="gap-2">
                        <Link to="/settings#share">
                            <Settings className="w-4 h-4" />
                            Open share settings
                        </Link>
                    </Button>
                </Card>
            )}

            <Card className="p-6 max-w-2xl mx-auto w-full">
                <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={
                            getEffectiveApiConfig().FRONTEND_URL
                                ? `Share ID or URL (e.g. abc123 or ${getEffectiveApiConfig().FRONTEND_URL}/share/…)`
                                : "Share ID or full share URL"
                        }
                        value={shareId}
                        onChange={(e) => setShareId(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!apiReady}
                        className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                        onClick={handleSearch}
                        disabled={!apiReady || loading || !shareId.trim()}
                        className="gap-2 shrink-0"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Searching…
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
                <Card className="p-6 max-w-2xl mx-auto w-full border-destructive/40 bg-destructive/5">
                    <div className="flex items-center gap-2 text-destructive">
                        <FileText className="w-5 h-5" />
                        <h3 className="font-semibold">Nothing found</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{error}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        Check the ID, or open the share link directly if you have it.
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
                        <Link to={`/share/${encodeURIComponent(shareId)}`} className="flex-1 min-w-[120px]">
                            <Button variant="default" className="w-full gap-2">
                                <ExternalLink className="w-4 h-4" />
                                View Full Content
                            </Button>
                        </Link>
                        <Link to={`/editor?load=${shareId}`} className="flex-1 min-w-[120px]">
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

