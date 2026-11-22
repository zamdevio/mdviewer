import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Project } from "@/lib/storage";

export function ProjectPicker({
  projects,
  currentProjectId,
  onSelect,
  onClose,
  className = "",
}: {
  projects: Project[];
  currentProjectId?: string;
  onSelect: (projectId: string | undefined) => void;
  onClose: () => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  return (
    <div
      className={`z-50 w-56 rounded-md border border-border bg-background shadow-lg ${className}`}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center gap-2 border-b border-border px-2 py-1.5">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects…"
          className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="max-h-56 overflow-y-auto py-1">
        <button
          type="button"
          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
            !currentProjectId ? "bg-muted/60 font-medium" : ""
          }`}
          onClick={() => {
            onSelect(undefined);
            onClose();
          }}
        >
          Ungrouped
        </button>
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No projects match</p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted truncate ${
                currentProjectId === p.id ? "bg-muted/60 font-medium" : ""
              }`}
              onClick={() => {
                onSelect(p.id);
                onClose();
              }}
            >
              {p.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
