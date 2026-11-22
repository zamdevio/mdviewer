import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative z-40 mt-auto flex items-center justify-center px-2 pb-4 pt-8 sm:p-4 sm:pt-12">
      <div className="flex w-full max-w-5xl flex-col items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-3 shadow-sm backdrop-blur-xl sm:flex-row sm:px-6">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="rounded-xl bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <span className="text-base font-bold text-foreground">MDViewer</span>
        </Link>
        <p className="text-center text-xs text-muted-foreground sm:text-right sm:text-sm">
          © {new Date().getFullYear()} MDViewer ·{" "}
          <a
            href="https://github.com/zamdevio/mdviewer"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
