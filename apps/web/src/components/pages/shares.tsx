
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, ExternalLink, Copy, X, Trash2, Loader2, CloudOff, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
    getSharedLinks,
    removeSharedLink,
    clearSharedLinks,
    onStorageChange,
    getSettings,
    type SharedLink,
} from "@/lib/storage";
import { truncateFilenameForDisplay } from "@/lib/editor";
import { ModalShell } from "@/components/ui/modal-shell";
import { ShareComposeDialog } from "@/components/share/ShareComposeDialog";
import { deleteRemoteShare, isCorsFailure } from "@/lib/api";
import { isApiConfigured } from "@/lib/config";

export default function SharesPage(): React.JSX.Element {
    const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [showClearWarning, setShowClearWarning] = useState(false);
    const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);
    const [deleteRemote, setDeleteRemote] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [editLink, setEditLink] = useState<SharedLink | null>(null);

    useEffect(() => {
        const loadSharedLinks = async () => {
            const links = await getSharedLinks();
            setSharedLinks(links);
            setLoading(false);
        };
        loadSharedLinks();
    }, []);

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
        const hasManage = Boolean(getSettings()?.manageToken?.trim());
        setDeleteRemote(hasManage && isApiConfigured());
    };

    const handleDeleteConfirm = async () => {
        if (!deleteLinkId) return;
        setDeleting(true);
        try {
            const manageToken = getSettings()?.manageToken?.trim() ?? "";
            if (deleteRemote) {
                if (!manageToken) {
                    toast.error("Manage token required for remote delete");
                    setDeleting(false);
                    return;
                }
                await deleteRemoteShare(deleteLinkId, manageToken);
                toast.success("Remote share wiped");
            }
            removeSharedLink(deleteLinkId);
            setSharedLinks(getSharedLinks());
            setDeleteLinkId(null);
            if (!deleteRemote) toast.success("Link removed locally");
        } catch (error) {
            if (isCorsFailure(error)) {
                toast.error("CORS blocked remote delete");
            } else {
                toast.error(error instanceof Error ? error.message : "Remote delete failed");
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleClearAll = () => {
        clearSharedLinks();
        setSharedLinks([]);
        setShowClearWarning(false);
        toast.success("All local links cleared");
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex flex-col gap-6 animate-fade-in">
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
                <Card className="p-8 text-center border-dashed">
                    <Share2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-xl font-semibold mb-2">No shared links yet</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        When you share from the editor or Files, links are stored here so you can reopen, copy, or remotely delete them.
                    </p>
                    <Button asChild className="gap-2">
                        <Link to="/editor">
                            <Share2 className="w-4 h-4" />
                            Open editor to share
                        </Link>
                    </Button>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {sharedLinks.map((link) => (
                            <Card key={link.id} className="p-4 flex flex-col gap-3">
                                <div className="flex items-start justify-between gap-2 min-w-0">
                                    <div className="flex-1 min-w-0">
                                        {link.filename && (
                                            <h3
                                                className="font-semibold truncate"
                                                title={link.filename}
                                            >
                                                {truncateFilenameForDisplay(link.filename)}
                                            </h3>
                                        )}
                                        <p
                                            className="text-xs text-muted-foreground mt-1 truncate"
                                            title={new Date(link.timestamp).toLocaleString()}
                                        >
                                            {new Date(link.timestamp).toLocaleString()}
                                        </p>
                                        {link.expiresAt && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Wipes: {new Date(link.expiresAt).toLocaleString()}
                                            </p>
                                        )}
                                        <p
                                            className="text-xs text-muted-foreground mt-1 font-mono truncate"
                                            title={link.shareId}
                                        >
                                            ID: {link.shareId}
                                        </p>
                                        {link.preview && (
                                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                                {link.preview.substring(0, 100)}
                                                {link.preview.length > 100 ? "..." : ""}
                                            </p>
                                        )}
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
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
                                        <Button variant="default" size="sm" className="w-full gap-2">
                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                            <span className="hidden sm:inline">View</span>
                                            <span className="sm:hidden">Open</span>
                                        </Button>
                                    </a>
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditLink(link)}
                                        className="gap-2 flex-1 sm:flex-initial"
                                        aria-label="Edit share"
                                    >
                                        <Pencil className="w-3 h-3 flex-shrink-0" />
                                        <span className="hidden sm:inline">Edit</span>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            <ShareComposeDialog
                open={!!editLink}
                title="Shared link"
                filename={editLink?.filename}
                existingShareId={editLink?.shareId}
                existingViewPassword={editLink?.password}
                allowMutate={false}
                onClose={() => setEditLink(null)}
                onConfirm={() => setEditLink(null)}
            />

            <ModalShell
                open={!!deleteLinkId}
                onClose={() => !deleting && setDeleteLinkId(null)}
                title="Delete shared link"
            >
                <div className="flex items-start gap-3 mb-4 pr-8">
                    <Trash2 className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 text-destructive">
                            Delete Shared Link
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            Remove this link from your local list
                            {deleteRemote ? " and optionally wipe it on the Worker." : "."}
                        </p>
                    </div>
                </div>
                {isApiConfigured() && (
                    <label className="flex items-start gap-2 text-sm mb-3">
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={deleteRemote}
                            disabled={deleting || !getSettings()?.manageToken?.trim()}
                            onChange={(e) => setDeleteRemote(e.target.checked)}
                        />
                        <span>Also delete on Worker (uses manage token from Settings)</span>
                    </label>
                )}
                {deleteRemote && !getSettings()?.manageToken?.trim() && (
                    <p className="text-xs text-amber-700 dark:text-amber-200 mb-3">
                        Set a manage token in Settings → Manage token first.
                    </p>
                )}
                {!deleteRemote && (
                    <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                        <CloudOff className="w-3 h-3" />
                        Local only — remote content stays until TTL wipe
                    </p>
                )}
                <div className="flex flex-col gap-2">
                    <Button
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                        disabled={deleting}
                        className="gap-2 w-full"
                    >
                        {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                        Delete
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setDeleteLinkId(null)}
                        disabled={deleting}
                        className="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </ModalShell>

            <ModalShell
                open={showClearWarning}
                onClose={() => setShowClearWarning(false)}
                title="Clear all shared links"
            >
                <div className="flex items-start gap-3 mb-4 pr-8">
                    <Trash2 className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 text-destructive">
                            Clear All Shared Links
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                            Remove all {sharedLinks.length} links from this browser only (does not wipe Worker objects).
                        </p>
                    </div>
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
            </ModalShell>
        </div>
    );
}
