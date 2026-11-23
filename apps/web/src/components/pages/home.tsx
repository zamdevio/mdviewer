import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Eye,
  FileText,
  FolderTree,
  Github,
  Share2,
  Shield,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { APP_VERSION, getEffectiveApiConfig } from "@/lib/config";

const features = [
  {
    icon: FileText,
    title: "Local-first files",
    body: "Write and save in the browser — no account for core use. Import/export merges by fingerprint; installable PWA shell.",
  },
  {
    icon: FolderTree,
    title: "Projects & tree",
    body: "Grid or explorer. Drag files into projects, right-click menus, searchable move-to-project.",
  },
  {
    icon: Eye,
    title: "Live preview",
    body: "GFM, Mermaid, KaTeX math, and syntax highlighting as you type.",
  },
  {
    icon: Share2,
    title: "Edge share (protocol 3)",
    body: "Workers + R2. Manage token to create/update; optional view password on GET. Point Settings → Share at your own worker.",
  },
  {
    icon: Bot,
    title: "MCP + llms.txt",
    body: "POST /mcp tools and /llms*.txt on the share Worker. Same manage/view rules for agents and humans.",
  },
  {
    icon: Shield,
    title: "Security-minded",
    body: "Preview HTML sanitized, Mermaid strict, Pages CSP + frame protections. Local-first by default.",
  },
] as const;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const apiBase = (getEffectiveApiConfig().API_URL || "").replace(/\/$/, "");
  const mcpUrl = apiBase ? `${apiBase}/mcp` : "https://api.mdviewer.zamdev.dev/mcp";

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-14 px-1 py-16 sm:gap-16 sm:py-24">
        <section className="w-full space-y-8 text-center">
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-transparent bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition duration-700 hover:bg-primary/20 ${
              mounted ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
            }`}
          >
            <Sparkles className="h-3 w-3 animate-spin-slow" />
            v{APP_VERSION} Now Available
          </div>

          <h1
            className={`text-5xl font-extrabold tracking-tight leading-tight sm:text-6xl md:text-7xl lg:text-8xl transition duration-1000 delay-100 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            Markdown,
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent dark:via-blue-400">
              Reimagined.
            </span>
          </h1>

          <p
            className={`mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl transition duration-1000 delay-200 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            Offline-first Markdown studio — edit, organize, preview, and share
            when you want. Private by default.
          </p>

          <div
            className={`flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center transition duration-1000 delay-300 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <Button asChild size="lg" className="h-12 gap-2 px-6 text-base shadow-lg shadow-primary/20">
              <Link to="/editor">
                Start Writing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 gap-2 px-6 text-base">
              <Link to="/files">Files</Link>
            </Button>
            <a
              href="https://github.com/zamdevio/mdviewer"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline sm:pl-2"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </div>
        </section>

        <section
          className={`flex w-full flex-col items-stretch justify-between gap-4 border-y border-border/60 py-5 sm:flex-row sm:items-center sm:gap-8 transition duration-1000 delay-400 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          aria-label="Agent-ready share"
        >
          <div className="flex items-start gap-3 text-left sm:items-center">
            <img
              src="/favicon.svg"
              alt=""
              width={36}
              height={36}
              className="mt-0.5 h-9 w-9 shrink-0 rounded-lg sm:mt-0"
            />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-foreground">Agent-ready share</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Same manage token and view-password rules for the SPA, curl, and MCP — no privileged agent path.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <Button asChild size="sm" className="gap-1.5">
              <a href={mcpUrl} target="_blank" rel="noreferrer">
                <Bot className="h-3.5 w-3.5" />
                MCP
                <span className="hidden font-normal text-primary-foreground/80 sm:inline">POST /mcp</span>
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href="/llms.txt" target="_blank" rel="noreferrer">
                llms.txt
              </a>
            </Button>
          </div>
        </section>

        <section
          className={`grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3 transition duration-1000 delay-500 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/30">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </section>

        <p
          className={`text-center text-sm text-muted-foreground transition duration-1000 delay-700 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <a
            href="https://github.com/zamdevio/mdviewer/blob/main/docs/security.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Read the security notes
          </a>
        </p>
      </div>
    </div>
  );
}
