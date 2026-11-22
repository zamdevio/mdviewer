import { useEffect, useRef, useState } from "react";
import {
  Pencil,
  Trash2,
  Share2,
  FolderInput,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type { Project, SavedFile } from "@/lib/storage";
import { ProjectPicker } from "./ProjectPicker";

export type TreeMenuTarget =
  | { kind: "file"; file: SavedFile }
  | { kind: "project"; project: Project };

export function TreeContextMenu({
  open,
  x,
  y,
  target,
  projects,
  onClose,
  onRename,
  onDelete,
  onShare,
  onAssignProject,
  onDetails,
  onOpen,
}: {
  open: boolean;
  x: number;
  y: number;
  target: TreeMenuTarget | null;
  projects: Project[];
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
  onAssignProject: (projectId: string | undefined) => void;
  onDetails?: () => void;
  onOpen?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [moveOpen, setMoveOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setMoveOpen(false);
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !target) return null;

  const itemClass =
    "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-muted";

  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.min(Math.max(8, x), vw - 240);
  const top = Math.min(Math.max(8, y), vh - 260);
  const flipMoveLeft = left + 180 + 230 > vw;

  return (
    <div
      ref={ref}
      className="fixed z-[10000] min-w-[180px] rounded-md border border-border bg-background shadow-xl py-1"
      style={{ left, top }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {target.kind === "file" && onOpen && (
        <button type="button" className={itemClass} onClick={() => { onOpen(); onClose(); }}>
          <ExternalLink className="w-3.5 h-3.5" />
          Open
        </button>
      )}
      {onDetails && (
        <button type="button" className={itemClass} onClick={() => { onDetails(); onClose(); }}>
          <Info className="w-3.5 h-3.5" />
          Details
        </button>
      )}
      <button type="button" className={itemClass} onClick={() => { onRename(); onClose(); }}>
        <Pencil className="w-3.5 h-3.5" />
        Rename
      </button>
      <button type="button" className={itemClass} onClick={() => { onShare(); onClose(); }}>
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>
      {target.kind === "file" && (
        <div className="relative">
          <button
            type="button"
            className={`${itemClass} justify-between`}
            onClick={() => setMoveOpen((v) => !v)}
          >
            <span className="inline-flex items-center gap-2">
              <FolderInput className="w-3.5 h-3.5" />
              Move to project
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          {moveOpen && (
            <div
              className={`absolute top-0 ${
                flipMoveLeft ? "right-full mr-1" : "left-full ml-1"
              }`}
            >
              <ProjectPicker
                projects={projects}
                currentProjectId={target.file.projectId}
                onSelect={onAssignProject}
                onClose={onClose}
              />
            </div>
          )}
        </div>
      )}
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        className={`${itemClass} text-destructive`}
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>
  );
}
