import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Eye,
  FileText,
  FolderTree,
  Github,
  Share2,
  Wifi,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import { APP_VERSION } from "@/lib/config";

const features = [
  {
    icon: FileText,
    title: "Local-first files",
    body: "Write and save in the browser. No account for core use — your notes stay on device.",
  },
  {
    icon: FolderTree,
    title: "Projects & tree",
    body: "Grid or explorer layout. Drag files into projects, right-click menus, searchable move-to-project.",
  },
  {
    icon: Eye,
    title: "Live preview",
    body: "GFM, Mermaid diagrams, KaTeX math, and syntax highlighting as you type.",
  },
  {
    icon: Share2,
    title: "Edge share",
    body: "Optional Cloudflare Workers + R2 links. Share a file or a whole project pack.",
  },
  {
    icon: Wifi,
    title: "Bring your own API",
    body: "Point Settings → Share at your worker. Compatibility handshake and connection badge dialogs.",
  },
  {
    icon: Download,
    title: "Import · export · PWA",
    body: "Backups merge by content fingerprint. Installable shell with updates that work on a normal reload.",
  },
] as const;

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="relative overflow-hidden"
      style={
        {
          "--home-ink": "#0c1f1a",
          "--home-foam": "#1a6b5c",
          "--home-mist": "#e8f2ef",
          "--home-sand": "#c4a574",
          fontFamily: '"Figtree", ui-sans-serif, system-ui, sans-serif',
        } as React.CSSProperties
      }
    >
      {/* Full-bleed atmospheric plane */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-90 dark:opacity-100"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 10% -10%, color-mix(in srgb, var(--home-foam) 28%, transparent), transparent 55%),
              radial-gradient(ellipse 70% 50% at 95% 15%, color-mix(in srgb, var(--home-sand) 22%, transparent), transparent 50%),
              linear-gradient(165deg, var(--home-mist) 0%, transparent 45%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Hero — one composition */}
      <section className="mx-auto flex min-h-[min(88vh,720px)] w-full max-w-4xl flex-col justify-center px-1 py-16 sm:py-20">
        <p
          className={`text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--home-foam)] transition duration-500 ${
            mounted ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
          }`}
        >
          v{APP_VERSION}
        </p>

        <h1
          className={`mt-4 text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl transition duration-700 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ fontFamily: '"Fraunces", ui-serif, Georgia, serif' }}
        >
          MDViewer
        </h1>

        <p
          className={`mt-5 max-w-lg text-lg text-muted-foreground sm:text-xl transition duration-700 delay-75 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          Offline-first Markdown studio — edit, organize, preview, and share
          when you want.
        </p>

        <div
          className={`mt-8 flex flex-col gap-3 sm:flex-row sm:items-center transition duration-700 delay-100 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 px-7 text-base bg-[color:var(--home-ink)] text-[color:var(--home-mist)] hover:bg-[color:var(--home-foam)]"
          >
            <Link to="/editor">
              Open editor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-4 text-sm sm:ml-2">
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

      {/* Features — below fold */}
      <section className="mx-auto w-full max-w-4xl px-1 pb-20 sm:pb-28">
        <h2
          className={`text-2xl tracking-tight text-foreground sm:text-3xl transition duration-700 delay-150 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ fontFamily: '"Fraunces", ui-serif, Georgia, serif' }}
        >
          What you get
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Built for people who live in Markdown — private by default, edge share
          optional, self-host friendly.
        </p>

        <div
          className={`mt-10 grid gap-8 sm:grid-cols-2 transition duration-700 delay-200 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4 text-left">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{
                  border: "1px solid color-mix(in srgb, var(--home-foam) 35%, transparent)",
                  background: "color-mix(in srgb, var(--home-foam) 8%, transparent)",
                }}
              >
                <Icon className="h-5 w-5 text-[color:var(--home-foam)]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
