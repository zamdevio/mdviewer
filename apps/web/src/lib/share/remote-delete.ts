import { deleteRemoteShare } from "@/lib/api";
import {
  getProjects,
  getSavedFiles,
  removeSharedLink,
  upsertProject,
  upsertSavedFile,
} from "@/lib/storage";
import { isRemoteShareGone } from "./share-gone";

export { isRemoteShareGone } from "./share-gone";

/**
 * DELETE on Worker; 404 counts as success (already gone).
 * Always clears local Shares row + file/project shareId binding — never file body.
 */
export async function wipeShareRemoteAndLocal(
  shareId: string,
  manageToken: string | null,
  opts?: { remote?: boolean },
): Promise<{ remote: "wiped" | "gone" | "skipped" }> {
  let remote: "wiped" | "gone" | "skipped" = "skipped";
  const doRemote = opts?.remote !== false && Boolean(manageToken?.trim());

  if (doRemote && manageToken) {
    try {
      await deleteRemoteShare(shareId, manageToken);
      remote = "wiped";
    } catch (error) {
      if (isRemoteShareGone(error)) {
        remote = "gone";
      } else {
        throw error;
      }
    }
  }

  clearLocalShareBinding(shareId);
  return { remote };
}

/** Drop Shares list row + clear shareId on matching files/projects. */
export function clearLocalShareBinding(shareId: string): void {
  removeSharedLink(shareId);
  for (const file of getSavedFiles()) {
    if (file.shareId === shareId) {
      upsertSavedFile({
        ...file,
        shareId: undefined,
        sharePassword: undefined,
      });
    }
  }
  for (const project of getProjects()) {
    if (project.shareId === shareId) {
      upsertProject({
        ...project,
        shareId: undefined,
        sharePassword: undefined,
      });
    }
  }
}

export function findSavedFileByShareId(shareId: string) {
  return getSavedFiles().find((f) => f.shareId === shareId) ?? null;
}

export function findProjectByShareId(shareId: string) {
  return getProjects().find((p) => p.shareId === shareId) ?? null;
}
