import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Download,
  Eye,
  FileText,
  FolderTree,
  Github,
  Share2,
  Sparkles,
  Wifi,
} from "lucide-react";
import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/config";

const features = [
  {
    icon: FileText,
    title: "Local-first files",
    body: "Write and save in the browser. No account for core use — notes stay on device.",
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
    title: "Edge share",
    body: "Optional Workers + R2. Manage token to create/update; optional disposable view password. Same rules for SPA, curl, and MCP.",
  },
  {
    icon: Wifi,
    title: "Bring your own API",
    body: "Point Settings → Share at your worker. Protocol 3 compatibility handshake and connection dialogs.",
  },
  {
    icon: Download,
    title: "Import · export · PWA",
    body: "Backups merge by content fingerprint. Installable shell; updates work on a normal reload.",
  },
] as const;

const securityBlurb =
  "Local-first by default. Preview HTML is sanitized, Mermaid runs strict, and Pages ships CSP + frame protections. See docs/security.md.";

export default function Home() {
  const [mounted, setMounted] = useState(false);

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

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center gap-16 px-1 py-16 sm:gap-20 sm:py-24">
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
            <div className="flex items-center justify-center gap-4 text-sm sm:pl-2">
              <a
                href="https://github.com/zamdevio/mdviewer"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
            </div>
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

        <section
          className={`w-full max-w-3xl text-center transition duration-1000 delay-700 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <h2
            className="text-lg font-semibold text-foreground"
            style={{ fontFamily: "inherit" }}
          >
            Security-minded by design
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{securityBlurb}</p>
          <a
            href="https://github.com/zamdevio/mdviewer/blob/main/docs/security.md"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            Read the security notes
          </a>
        </section>
      </div>
    </div>
  );
}
