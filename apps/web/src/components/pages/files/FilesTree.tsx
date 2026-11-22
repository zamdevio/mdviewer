import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  FileText,
  MoreVertical,
  Check,
  X,
} from "lucide-react";
import type { Project, SavedFile } from "@/lib/storage";
import { truncateFilenameForDisplay } from "@/lib/editor";
import { TreeContextMenu, type TreeMenuTarget } from "./TreeContextMenu";

export function FilesTree({
  projects,
  files,
  onOpenFile,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  onAssignProject,
  onRenameFile,
  onDeleteFile,
  onShareFile,
  onShareProject,
}: {
  projects: Project[];
  files: SavedFile[];
  onOpenFile: (file: SavedFile) => void;
  onCreateProject: (name: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onDeleteProject: (id: string) => void;
  onAssignProject: (fileId: string, projectId: string | undefined) => void;
  onRenameFile: (fileId: string, name: string) => void;
  onDeleteFile: (file: SavedFile) => void;
  onShareFile: (file: SavedFile) => void;
  onShareProject: (project: Project) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    __ungrouped: true,
  });
  const [newName, setNewName] = useState("");
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    target: TreeMenuTarget;
  } | null>(null);
  const [detailsFile, setDetailsFile] = useState<SavedFile | null>(null);

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

  const openMenu = (
    e: React.MouseEvent,
    target: TreeMenuTarget
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, target });
  };

  const dropZoneProps = (projectId: string | undefined) => {
    const key = projectId ?? "__ungrouped";
    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverId(key);
      },
      onDragLeave: () => {
        setDragOverId((cur) => (cur === key ? null : cur));
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverId(null);
        const fileId = e.dataTransfer.getData("text/mdviewer-file-id");
        if (fileId) {
          onAssignProject(fileId, projectId);
        }
      },
    };
  };

  const renderFileRow = (file: SavedFile) => (
    <div
      key={file.id}
      draggable={renamingFileId !== file.id}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/mdviewer-file-id", file.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onContextMenu={(e) => openMenu(e, { kind: "file", file })}
      className="flex items-center gap-2 py-1.5 pl-6 pr-2 rounded-md hover:bg-muted/60 group cursor-default"
    >
      <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      {renamingFileId === file.id ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="flex-1 px-2 py-0.5 text-sm border rounded bg-background min-w-0"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim()) {
                onRenameFile(file.id, renameValue.trim());
                setRenamingFileId(null);
              } else if (e.key === "Escape") {
                setRenamingFileId(null);
              }
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => {
              if (renameValue.trim()) onRenameFile(file.id, renameValue.trim());
              setRenamingFileId(null);
            }}
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setRenamingFileId(null)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="flex-1 text-left text-sm truncate hover:text-primary"
            title={file.filename}
            onClick={() => onOpenFile(file)}
            onDoubleClick={() => {
              setRenamingFileId(file.id);
              setRenameValue(file.filename.replace(/\.md$/i, ""));
            }}
          >
            {truncateFilenameForDisplay(file.filename)}
            {file.editing ? (
              <span className="ml-2 text-[10px] text-primary">editing</span>
            ) : null}
          </button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => openMenu(e, { kind: "file", file })}
            title="More"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
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
      <p className="text-xs text-muted-foreground mb-3">
        Drag files onto a project. Right-click or ⋮ for rename, share, move, delete.
      </p>

      <div className="space-y-1">
        {projects.map((project) => {
          const open = expanded[project.id] ?? true;
          const kids = grouped.get(project.id) || [];
          const dropActive = dragOverId === project.id;
          return (
            <div
              key={project.id}
              className={`rounded-md border ${
                dropActive ? "border-primary bg-primary/5" : "border-border/60"
              }`}
              {...dropZoneProps(project.id)}
            >
              <div
                className="flex items-center gap-1 px-2 py-1.5 bg-muted/30"
                onContextMenu={(e) => openMenu(e, { kind: "project", project })}
              >
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
                {renamingProjectId === project.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 px-2 py-0.5 text-sm border rounded bg-background"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && renameValue.trim()) {
                          onRenameProject(project.id, renameValue.trim());
                          setRenamingProjectId(null);
                        } else if (e.key === "Escape") {
                          setRenamingProjectId(null);
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
                        setRenamingProjectId(null);
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => setRenamingProjectId(null)}
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
                      onDoubleClick={() => {
                        setRenamingProjectId(project.id);
                        setRenameValue(project.name);
                      }}
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
                      onClick={(e) => openMenu(e, { kind: "project", project })}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
              {open && (
                <div className="py-1 min-h-[2rem]">
                  {kids.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-6 py-2">
                      Drop files here
                    </p>
                  ) : (
                    kids.map(renderFileRow)
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div
          className={`rounded-md border border-dashed ${
            dragOverId === "__ungrouped"
              ? "border-primary bg-primary/5"
              : "border-border/60"
          }`}
          {...dropZoneProps(undefined)}
        >
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
            <div className="py-1 min-h-[2rem]">
              {(grouped.get("ungrouped") || []).length === 0 ? (
                <p className="text-xs text-muted-foreground px-6 py-2">
                  No uncategorized files
                </p>
              ) : (
                (grouped.get("ungrouped") || []).map(renderFileRow)
              )}
            </div>
          )}
        </div>
      </div>

      <TreeContextMenu
        open={!!menu}
        x={menu?.x ?? 0}
        y={menu?.y ?? 0}
        target={menu?.target ?? null}
        projects={projects}
        onClose={() => setMenu(null)}
        onOpen={
          menu?.target.kind === "file"
            ? () => {
                const t = menu.target;
                if (t.kind === "file") onOpenFile(t.file);
              }
            : undefined
        }
        onDetails={
          menu?.target.kind === "file"
            ? () => {
                const t = menu.target;
                if (t.kind === "file") setDetailsFile(t.file);
              }
            : undefined
        }
        onRename={() => {
          if (!menu) return;
          const t = menu.target;
          if (t.kind === "file") {
            setRenamingFileId(t.file.id);
            setRenameValue(t.file.filename.replace(/\.md$/i, ""));
          } else {
            setRenamingProjectId(t.project.id);
            setRenameValue(t.project.name);
          }
        }}
        onDelete={() => {
          if (!menu) return;
          const t = menu.target;
          if (t.kind === "file") {
            onDeleteFile(t.file);
          } else {
            onDeleteProject(t.project.id);
          }
        }}
        onShare={() => {
          if (!menu) return;
          const t = menu.target;
          if (t.kind === "file") {
            onShareFile(t.file);
          } else {
            onShareProject(t.project);
          }
        }}
        onAssignProject={(projectId) => {
          const t = menu?.target;
          if (t?.kind === "file") {
            onAssignProject(t.file.id, projectId);
          }
        }}
      />

      <ModalShell
        open={!!detailsFile}
        onClose={() => setDetailsFile(null)}
        title="File details"
      >
        {detailsFile && (
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Name: </span>
              {detailsFile.filename}
            </p>
            <p className="font-mono text-xs break-all">
              <span className="text-muted-foreground">ID: </span>
              {detailsFile.id}
            </p>
            {detailsFile.timestamp && (
              <p>
                <span className="text-muted-foreground">Updated: </span>
                {new Date(detailsFile.timestamp).toLocaleString()}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Size: </span>
              {detailsFile.content != null
                ? detailsFile.content.length < 1024
                  ? `${detailsFile.content.length} B`
                  : `${(detailsFile.content.length / 1024).toFixed(1)} KB`
                : "—"}
            </p>
            {detailsFile.content && (
              <pre className="mt-2 p-3 rounded-md bg-muted/50 text-xs whitespace-pre-wrap line-clamp-6 max-h-40 overflow-hidden">
                {detailsFile.content.slice(0, 400)}
                {detailsFile.content.length > 400 ? "…" : ""}
              </pre>
            )}
            <Button
              className="w-full mt-2"
              onClick={() => {
                onOpenFile(detailsFile);
                setDetailsFile(null);
              }}
            >
              Open in editor
            </Button>
          </div>
        )}
      </ModalShell>
    </Card>
  );
}
