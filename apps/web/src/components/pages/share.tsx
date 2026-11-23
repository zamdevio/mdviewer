import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import {
    Loader2,
    Copy,
    Check,
    ArrowLeft,
    ArrowUp,
    FileText,
    GitFork,
    FolderPlus,
    Info,
} from "lucide-react";
import { MarkdownViewer } from "@/components/markdown";
import { VirtualMarkdownViewer } from "@/components/markdown/virtual-viewer";
import { PreviewPerfBadge } from "@/components/pages/editor/PreviewPerfBadge";
import { shouldVirtualizePreview } from "@/lib/markdown/split-chunks";
import {
    fetchSharedMarkdown,
    fetchShareMeta,
    ApiRequestError,
    type PublicShareMeta,
} from "@/lib/api";
import { tryParseProjectPack, type ProjectPack } from "@/lib/project-pack";
import {
    getProjects,
    getSavedFiles,
    upsertProject,
    upsertSavedFile,
    setFileContent,
} from "@/lib/storage";
import { truncateFilename } from "@/lib/editor";
import { formatWipeTime } from "@/lib/share/ttl";
import { toast } from "sonner";
import { usePlatform } from "@/hooks/use-platform";

function formatBytes(n: number): string {
    if (!Number.isFinite(n) || n < 0) return "—";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function ShareDetailsDialog({
    open,
    onClose,
    meta,
    projectPack,
    loading,
    error,
}: {
    open: boolean;
    onClose: () => void;
    meta: PublicShareMeta | null;
    projectPack: ProjectPack | null;
    loading: boolean;
    error: string | null;
}) {
    return (
        <ModalShell open={open} onClose={onClose} title="Share details" showTitle>
            {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading metadata…
                </div>
            )}
            {!loading && error && (
                <p className="text-sm text-destructive py-2">{error}</p>
            )}
            {!loading && !error && meta && (
                <dl className="space-y-3 text-sm">
                    <div>
                        <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                            Type
                        </dt>
                        <dd className="font-medium capitalize">
                            {projectPack ? "project" : meta.type}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                            Filename
                        </dt>
                        <dd className="font-mono text-xs break-all">{meta.filename}</dd>
                    </div>
                    {projectPack && (
                        <div>
                            <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                                Project
                            </dt>
                            <dd className="font-medium">{projectPack.name}</dd>
                        </div>
                    )}
                    {projectPack && (
                        <div>
                            <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                                Files in pack
                            </dt>
                            <dd className="font-medium">{projectPack.files.length}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                            Size
                        </dt>
                        <dd className="font-medium">{formatBytes(meta.size)}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                            Created
                        </dt>
                        <dd className="font-medium">
                            {new Date(meta.createdAt).toLocaleString()}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                            Wipes
                        </dt>
                        <dd className="font-medium">{formatWipeTime(meta.expiresAt)}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                            Protection
                        </dt>
                        <dd className="font-medium">
                            {meta.viewProtected
                                ? "View password required"
                                : meta.hasPassword
                                  ? "View password set"
                                  : "Open"}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                            Share ID
                        </dt>
                        <dd className="font-mono text-xs break-all">{meta.id}</dd>
                    </div>
                </dl>
            )}
            <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
            </div>
        </ModalShell>
    );
}

export default function ShareViewPage(): React.JSX.Element {
    const navigate = useNavigate();
    const { isMobile } = usePlatform();
    const { id: routeShareId } = useParams<{ id: string }>();
    const [content, setContent] = useState<string | null>(null);
    const [projectPack, setProjectPack] = useState<ProjectPack | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [copiedMarkdown, setCopiedMarkdown] = useState(false);
    const [previewScrollEl, setPreviewScrollEl] = useState<HTMLDivElement | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [shareId, setShareId] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [viewPassword, setViewPassword] = useState("");
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [meta, setMeta] = useState<PublicShareMeta | null>(null);
    const [metaLoading, setMetaLoading] = useState(false);
    const [metaError, setMetaError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && shareId) {
            const link = document.createElement("link");
            link.rel = "me";
            link.href = window.location.href;
            document.head.appendChild(link);
            return () => {
                const existingLink = document.querySelector(
                    'link[rel="me"][href="' + window.location.href + '"]'
                );
                if (existingLink) {
                    document.head.removeChild(existingLink);
                }
            };
        }
    }, [shareId]);

    useEffect(() => {
        const id = routeShareId?.trim() || null;
        if (id) {
            setShareId(id);
            setError(null);
        } else {
            setShareId(null);
            setError("Share URL must be /share/<id>");
            setLoading(false);
        }
    }, [routeShareId]);

    const applyMarkdown = (markdown: string) => {
        const pack = tryParseProjectPack(markdown);
        if (pack) {
            setProjectPack(pack);
            setContent(null);
        } else {
            setProjectPack(null);
            setContent(markdown);
        }
        setNeedsPassword(false);
        setError(null);
    };

    useEffect(() => {
        if (!shareId) return;
        setLoading(true);
        setError(null);
        setNeedsPassword(false);
        setMeta(null);
        setMetaError(null);
        const loadContent = async () => {
            try {
                const markdown = await fetchSharedMarkdown(shareId);
                applyMarkdown(markdown);
            } catch (err) {
                if (err instanceof ApiRequestError && err.status === 401) {
                    setNeedsPassword(true);
                    setError(null);
                } else {
                    setError(err instanceof Error ? err.message : "Failed to load shared content");
                }
            } finally {
                setLoading(false);
            }
        };
        void loadContent();
        void (async () => {
            setMetaLoading(true);
            try {
                const m = await fetchShareMeta(shareId);
                setMeta(m);
            } catch (err) {
                setMetaError(err instanceof Error ? err.message : "Metadata unavailable");
            } finally {
                setMetaLoading(false);
            }
        })();
    }, [shareId]);

    const handleViewPasswordSubmit = async () => {
        if (!shareId || !viewPassword.trim()) {
            toast.error("Enter the share password");
            return;
        }
        setPasswordSubmitting(true);
        try {
            const markdown = await fetchSharedMarkdown(shareId, viewPassword.trim());
            applyMarkdown(markdown);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Invalid password");
        } finally {
            setPasswordSubmitting(false);
        }
    };

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            toast.success("Link copied");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    const handleCopyMarkdown = async () => {
        if (!content?.trim()) return;
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMarkdown(true);
            toast.success("Markdown copied");
            setTimeout(() => setCopiedMarkdown(false), 2000);
        } catch {
            toast.error("Failed to copy markdown");
        }
    };

    useEffect(() => {
        if (!previewScrollEl) {
            setShowScrollTop(false);
            return;
        }
        const onScroll = () => {
            setShowScrollTop(previewScrollEl.scrollTop > 100);
        };
        onScroll();
        previewScrollEl.addEventListener("scroll", onScroll, { passive: true });
        return () => previewScrollEl.removeEventListener("scroll", onScroll);
    }, [previewScrollEl, content]);

    const handleImportProject = () => {
        if (!projectPack) return;
        setImporting(true);
        try {
            const existing = getProjects();
            let name = projectPack.name;
            let n = 1;
            while (existing.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
                name = `${projectPack.name} (${++n})`;
            }
            const projectId = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            upsertProject({
                id: projectId,
                name,
                createdAt: new Date().toISOString(),
            });
            const files = getSavedFiles();
            for (const file of projectPack.files) {
                const base = truncateFilename(file.filename.replace(/\.md$/i, ""));
                let candidate = `${base}.md`;
                let c = 1;
                while (files.some((f) => f.filename === candidate)) {
                    candidate = `${base}-${c}.md`;
                    c += 1;
                }
                const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                setFileContent(candidate, file.content);
                upsertSavedFile({
                    id: fileId,
                    filename: candidate,
                    timestamp: new Date().toISOString(),
                    projectId,
                });
                files.push({ id: fileId, filename: candidate });
            }
            toast.success(`Imported project “${name}” with ${projectPack.files.length} file(s)`);
            navigate("/files");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Import failed");
        } finally {
            setImporting(false);
        }
    };

    const detailsButton = (
        <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setDetailsOpen(true)}
            aria-label="Share details"
        >
            <Info className="h-4 w-4" />
            {!isMobile && <span>Details</span>}
        </Button>
    );

    const detailsDialog = (
        <ShareDetailsDialog
            open={detailsOpen}
            onClose={() => setDetailsOpen(false)}
            meta={meta}
            projectPack={projectPack}
            loading={metaLoading}
            error={metaError}
        />
    );

    if (loading) {
        return (
            <div className="container mx-auto p-4 h-[calc(100vh-100px)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading shared content...</p>
                </div>
            </div>
        );
    }

    if (needsPassword && !content && !projectPack) {
        return (
            <div className="container mx-auto p-4 h-[calc(100vh-100px)] flex items-center justify-center">
                <Card className="p-8 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-2 text-center">Protected share</h2>
                    <p className="text-muted-foreground mb-6 text-center text-sm">
                        This link requires the share password to view.
                    </p>
                    <input
                        type="password"
                        autoComplete="off"
                        value={viewPassword}
                        onChange={(e) => setViewPassword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") void handleViewPasswordSubmit();
                        }}
                        placeholder="Share password"
                        className="w-full mb-3 px-3 py-2 rounded-md border border-input bg-background text-sm"
                    />
                    <Button
                        className="w-full gap-2 mb-3"
                        disabled={passwordSubmitting}
                        onClick={() => void handleViewPasswordSubmit()}
                    >
                        {passwordSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : null}
                        Unlock
                    </Button>
                    <Link to="/editor" className="block">
                        <Button variant="outline" className="w-full gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Editor
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (error || (!content && !projectPack)) {
        return (
            <div className="container mx-auto p-4 h-[calc(100vh-100px)] flex items-center justify-center">
                <Card className="p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold mb-4">Content Not Found</h2>
                    <p className="text-muted-foreground mb-6">
                        {error || "The shared content was not found or has expired."}
                    </p>
                    <Link to="/editor">
                        <Button variant="default" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Editor
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    if (projectPack) {
        return (
            <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                        Shared Project
                    </h1>
                    <div className="flex gap-2">
                        {detailsButton}
                        <Button variant="outline" size="sm" onClick={handleCopyUrl} className="gap-2">
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy URL"}</span>
                        </Button>
                        <Link to="/files">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Files
                            </Button>
                        </Link>
                    </div>
                </div>
                <Card className="p-6 max-w-lg">
                    <h2 className="text-lg font-semibold mb-1">{projectPack.name}</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        {projectPack.files.length} file(s) in this pack. Import creates a local
                        project (name conflicts get a suffix).
                    </p>
                    <ul className="text-sm mb-4 space-y-1 max-h-48 overflow-y-auto">
                        {projectPack.files.map((f) => (
                            <li key={f.filename} className="truncate font-mono text-xs">
                                {f.filename}
                            </li>
                        ))}
                    </ul>
                    <Button
                        className="w-full gap-2"
                        disabled={importing}
                        onClick={handleImportProject}
                    >
                        {importing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FolderPlus className="w-4 h-4" />
                        )}
                        Import project to Files
                    </Button>
                </Card>
                {detailsDialog}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Shared Markdown
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                    {detailsButton}
                    {content ? <PreviewPerfBadge markdown={content} /> : null}
                    {showScrollTop && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Scroll to top"
                            aria-label="Scroll to top"
                            onClick={() => {
                                previewScrollEl?.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                        >
                            <ArrowUp className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopyMarkdown()}
                        disabled={!content?.trim()}
                        className="gap-2"
                        title="Copy markdown"
                    >
                        {copiedMarkdown ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <FileText className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">
                            {copiedMarkdown ? "Copied!" : "Copy markdown"}
                        </span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopyUrl()}
                        className="gap-2"
                        title="Copy share URL"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="hidden sm:inline">{copied ? "Copied!" : "Copy URL"}</span>
                    </Button>
                    <Link to={`/editor?load=${shareId}`}>
                        <Button variant="default" size="sm" className="gap-2">
                            <GitFork className="w-4 h-4" />
                            <span className="hidden sm:inline">Fork to Editor</span>
                        </Button>
                    </Link>
                    <Link to="/editor">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Editor</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <Card
                ref={setPreviewScrollEl}
                className="flex-1 p-6 overflow-auto border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm"
            >
                {shouldVirtualizePreview(content || "") ? (
                    <VirtualMarkdownViewer
                        content={content || ""}
                        scrollElement={previewScrollEl}
                    />
                ) : (
                    <MarkdownViewer content={content || ""} />
                )}
            </Card>
            {detailsDialog}
        </div>
    );
}
