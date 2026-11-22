import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  FileText,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import type { Project, SavedFile } from "@/lib/storage";
import { truncateFilenameForDisplay } from "@/lib/editor";

export function FilesTree({
  projects,
  files,
  onOpenFile,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onAssignProject,
}: {
  projects: Project[];
  files: SavedFile[];
  onOpenFile: (file: SavedFile) => void;
  onCreateProject: (name: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onAssignProject: (fileId: string, projectId: string | undefined) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    __ungrouped: true,
  });
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string | "ungrouped", SavedFile[]>();
    map.set("ungrouped", []);
    for (const p of projects) {
      map.set(p.id, []);
    }
    for (const f of files) {
      const key =
        f.projectId && map.has(f.projectId) ? f.projectId : "ungrouped";
      map.get(key)!.push(f);
    }
    return map;
  }, [projects, files]);

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderFileRow = (file: SavedFile) => (
    <div
      key={file.id}
      className="flex items-center gap-2 py-1.5 pl-6 pr-2 rounded-md hover:bg-muted/60 group"
    >
      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <button
        type="button"
        className="flex-1 text-left text-sm truncate hover:text-primary"
        title={file.filename}
        onClick={() => onOpenFile(file)}
      >
        {truncateFilenameForDisplay(file.filename)}
        {file.editing ? (
          <span className="ml-2 text-[10px] text-primary">editing</span>
        ) : null}
      </button>
      <select
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-xs border border-input rounded px-1 py-0.5 bg-background max-w-[120px]"
        value={file.projectId || ""}
        onChange={(e) =>
          onAssignProject(file.id, e.target.value || undefined)
        }
        title="Move to project"
      >
        <option value="">Ungrouped</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="New project name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) {
              onCreateProject(newName.trim());
              setNewName("");
            }
          }}
          className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
        />
        <Button
          size="sm"
          className="gap-2"
          disabled={!newName.trim()}
          onClick={() => {
            if (!newName.trim()) return;
            onCreateProject(newName.trim());
            setNewName("");
          }}
        >
          <FolderPlus className="w-4 h-4" />
          Add project
        </Button>
      </div>

      <div className="space-y-1">
        {projects.map((project) => {
          const open = expanded[project.id] ?? true;
          const kids = grouped.get(project.id) || [];
          return (
            <div key={project.id} className="rounded-md border border-border/60">
              <div className="flex items-center gap-1 px-2 py-1.5 bg-muted/30">
                <button
                  type="button"
                  className="p-1"
                  onClick={() => toggle(project.id)}
                  aria-label={open ? "Collapse" : "Expand"}
                >
                  {open ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <Folder className="w-4 h-4 text-primary" />
                {renamingId === project.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 px-2 py-0.5 text-sm border rounded bg-background"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && renameValue.trim()) {
                          onRenameProject(project.id, renameValue.trim());
                          setRenamingId(null);
                        } else if (e.key === "Escape") {
                          setRenamingId(null);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        if (renameValue.trim()) {
                          onRenameProject(project.id, renameValue.trim());
                        }
                        setRenamingId(null);
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setRenamingId(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex-1 text-left text-sm font-medium truncate"
                      onClick={() => toggle(project.id)}
                    >
                      {project.name}
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        {kids.length}
                      </span>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        setRenamingId(project.id);
                        setRenameValue(project.name);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => onDeleteProject(project.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
              {open && (
                <div className="py-1">
                  {kids.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-6 py-2">
                      Empty — move files here from Ungrouped or the grid.
                    </p>
                  ) : (
                    kids.map(renderFileRow)
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="rounded-md border border-dashed border-border/60">
          <div className="flex items-center gap-1 px-2 py-1.5">
            <button
              type="button"
              className="p-1"
              onClick={() => toggle("__ungrouped")}
            >
              {expanded.__ungrouped ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <Folder className="w-4 h-4 text-muted-foreground" />
            <button
              type="button"
              className="flex-1 text-left text-sm font-medium"
              onClick={() => toggle("__ungrouped")}
            >
              Ungrouped
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                {(grouped.get("ungrouped") || []).length}
              </span>
            </button>
          </div>
          {expanded.__ungrouped && (
            <div className="py-1">
              {(grouped.get("ungrouped") || []).length === 0 ? (
                <p className="text-xs text-muted-foreground px-6 py-2">
                  No uncategorized files.
                </p>
              ) : (
                (grouped.get("ungrouped") || []).map(renderFileRow)
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
