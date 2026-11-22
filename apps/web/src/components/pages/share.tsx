import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, ArrowLeft, GitFork, FolderPlus } from "lucide-react";
import { MarkdownViewer } from "@/components/markdown";
import { fetchSharedMarkdown } from "@/lib/api";
import { tryParseProjectPack, type ProjectPack } from "@/lib/project-pack";
import {
    getProjects,
    getSavedFiles,
    upsertProject,
    upsertSavedFile,
    setFileContent,
} from "@/lib/storage";
import { truncateFilename } from "@/lib/editor";
import { toast } from "sonner";

export default function ShareViewPage(): React.JSX.Element {
    const navigate = useNavigate();
    const [content, setContent] = useState<string | null>(null);
    const [projectPack, setProjectPack] = useState<ProjectPack | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [shareId, setShareId] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);

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
        if (typeof window !== "undefined") {
            const pathname = window.location.pathname;
            const searchParams = new URLSearchParams(window.location.search);
            const pathMatch = pathname.match(/^\/share\/([^/]+)/);
            let id = pathMatch ? pathMatch[1] : null;
            if (!id) id = searchParams.get("id");
            if (!id && window.location.hash) {
                id = window.location.hash.replace("#", "");
            }
            if (id) {
                setShareId(id);
            } else {
                setError("No share ID provided in URL");
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!shareId) return;
        setLoading(true);
        setError(null);
        const loadContent = async () => {
            try {
                const markdown = await fetchSharedMarkdown(shareId);
                const pack = tryParseProjectPack(markdown);
                if (pack) {
                    setProjectPack(pack);
                    setContent(null);
                } else {
                    setProjectPack(null);
                    setContent(markdown);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load shared content");
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, [shareId]);

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* ignore */
        }
    };

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
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 min-h-[calc(100vh-100px)] flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Shared Markdown
                </h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyUrl} className="gap-2">
                        {copied ? (
                            <>
                                <Check className="w-4 h-4" />
                                <span className="hidden sm:inline">Copied!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span className="hidden sm:inline">Copy URL</span>
                            </>
                        )}
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

            <Card className="flex-1 p-6 overflow-auto border-primary/20 shadow-lg bg-card/50 backdrop-blur-sm">
                <MarkdownViewer content={content || ""} />
            </Card>
        </div>
    );
}
