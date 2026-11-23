import {
  getSavedFiles,
  getSharedLinks,
  type SavedFile,
  type SharedLink,
} from "@/lib/storage";

export type BoundShare = {
  shareId: string;
  viewPassword?: string;
  expiresAt?: string;
  url?: string;
  /** Matching saved file when found */
  file: SavedFile | null;
  /** Matching shared-links row when found */
  link: SharedLink | null;
};

function normalizeStem(name: string): string {
  return name.replace(/\.md$/i, "").trim().toLowerCase();
}

function filenameMatches(saved: string | undefined, stem: string): boolean {
  if (!saved) return false;
  const s = normalizeStem(saved);
  return s === stem || saved.toLowerCase() === `${stem}.md`;
}

/**
 * Resolve the share bound to the current editor file.
 * Prefers SavedFile.shareId; falls back to latest SharedLink by filename stem.
 */
export function resolveBoundShare(
  fileId: string | null | undefined,
  fileName: string | null | undefined,
): BoundShare | null {
  if (!fileName && !fileId) return null;

  const files = getSavedFiles();
  const stem = fileName ? normalizeStem(fileName) : "";

  let file: SavedFile | null = null;
  if (fileId) {
    file = files.find((f) => f.id === fileId) ?? null;
  }
  if (!file && stem) {
    file =
      files.find((f) => filenameMatches(f.filename, stem)) ??
      files.find((f) => normalizeStem(f.filename) === stem) ??
      null;
  }

  const links = getSharedLinks();
  let link: SharedLink | null = null;

  if (file?.shareId) {
    link = links.find((l) => l.shareId === file!.shareId) ?? null;
    return {
      shareId: file.shareId,
      viewPassword: file.sharePassword ?? link?.password,
      expiresAt: link?.expiresAt,
      url: link?.url,
      file,
      link,
    };
  }

  if (stem) {
    const matches = links.filter((l) => filenameMatches(l.filename, stem));
    if (matches.length > 0) {
      // Latest by timestamp
      link = [...matches].sort((a, b) =>
        (b.timestamp || "").localeCompare(a.timestamp || ""),
      )[0]!;
      return {
        shareId: link.shareId,
        viewPassword: link.password ?? file?.sharePassword,
        expiresAt: link.expiresAt,
        url: link.url,
        file,
        link,
      };
    }
  }

  return null;
}
