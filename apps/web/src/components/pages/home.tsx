import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Code,
  Eye,
  FileText,
  Github,
  Share2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/config";

const highlights = [
  {
    icon: FileText,
    title: "Local files",
    body: "Edit and save in the browser. No account for core use.",
  },
  {
    icon: Eye,
    title: "Live preview",
    body: "GFM, Mermaid, Math, and syntax highlighting as you type.",
  },
  {
    icon: Share2,
    title: "Edge share",
    body: "Optional Cloudflare Workers + R2 links when the API is set.",
  },
  {
    icon: Code,
    title: "GitHub-style",
    body: "Familiar markdown rendering tuned for docs and notes.",
  },
] as const;

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-16 px-1 py-16 sm:gap-20 sm:py-24">
        <section className="w-full space-y-6 text-center">
          <p
            className={`inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground transition duration-500 ${
              mounted ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            MDViewer v{APP_VERSION}
          </p>

          <h1
            className={`text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl transition duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            Markdown for writing,
            <span className="block text-primary">preview, and share.</span>
          </h1>

          <p
            className={`mx-auto max-w-xl text-base text-muted-foreground sm:text-lg transition duration-700 delay-75 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            A focused markdown studio in the browser — local files, rich preview,
            and optional edge share links.
          </p>

          <div
            className={`flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center transition duration-700 delay-100 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            <Button asChild size="lg" className="h-12 gap-2 px-6 text-base">
              <Link to="/editor">
                Open editor
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center justify-center gap-4 text-sm">
              <Link
                to="/files"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Files
              </Link>
              <span className="text-border">·</span>
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
          className={`grid w-full gap-6 sm:grid-cols-2 transition duration-700 delay-150 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          {highlights.map(({ icon: Icon, title, body }) => (
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
      </div>
    </div>
  );
}
