import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { FileText, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlatform } from "@/hooks/use-platform";
import { ConnectionIndicator } from "@/components/layout/connection-indicator";

const NAV_LINKS: { to: string; label: string; end?: boolean }[] = [
  { to: "/", label: "Home", end: true },
  { to: "/editor", label: "Editor" },
  { to: "/files", label: "Files" },
  { to: "/search", label: "Search" },
  { to: "/shares", label: "Shares" },
  { to: "/settings", label: "Settings" },
];

function navClass(active: boolean, mobile = false) {
  if (mobile) {
    return active
      ? "rounded-lg bg-primary/10 p-2 text-sm font-medium text-primary"
      : "rounded-lg p-2 text-sm font-medium text-foreground/80 hover:bg-accent";
  }
  return active
    ? "text-sm font-medium text-primary"
    : "text-sm font-medium text-muted-foreground hover:text-foreground";
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pathname = useLocation().pathname;
  const isHomePage = pathname === "/";
  const { isMobile } = usePlatform();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isActive = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <header
      className={`relative z-50 flex items-center justify-center ${isMobile ? "px-2 py-0" : "p-4"}`}
    >
      <nav
        ref={navRef}
        className={`relative flex w-full max-w-5xl items-center justify-between border border-border/60 bg-background/80 shadow-sm backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 ${
          isMobile ? "rounded-xl px-3 py-2" : "rounded-2xl px-4 py-3 sm:px-6"
        }`}
      >
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="rounded-xl bg-primary/10 p-2">
            <FileText className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          </div>
          <span className="text-base font-bold text-foreground sm:text-lg">MDViewer</span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          {NAV_LINKS.map(({ to, label, end }) => (
            <Link key={to} to={to} className={navClass(isActive(to, end))}>
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/zamdevio/mdviewer"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            GitHub
          </a>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ConnectionIndicator />
          <ThemeToggle />
          {isHomePage && (
            <Button asChild size="sm">
              <Link to="/editor">Open editor</Link>
            </Button>
          )}
        </div>

        <div className={`items-center gap-2 ${isMobile ? "flex" : "flex md:hidden"}`}>
          <ConnectionIndicator />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 flex flex-col gap-1 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur-xl md:hidden">
            {NAV_LINKS.map(({ to, label, end }) => (
              <Link
                key={to}
                to={to}
                className={navClass(isActive(to, end), true)}
                onClick={() => setIsOpen(false)}
              >
                {label}
              </Link>
            ))}
            <a
              href="https://github.com/zamdevio/mdviewer"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-2 text-sm font-medium text-foreground/80 hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              GitHub
            </a>
            {isHomePage && (
              <Button asChild className="mt-2 w-full">
                <Link to="/editor" onClick={() => setIsOpen(false)}>
                  Open editor
                </Link>
              </Button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
