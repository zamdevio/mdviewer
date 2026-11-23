import { ROTATE_MANAGE_MAX_IDS } from "./config";
import { verifyPassword } from "./password";
import {
  putShareMetadata,
  readMetadata,
  type ShareMetadata,
} from "./share-store";
import { isExpired } from "./ttl";

export type RotateFail = { id: string; error: string };

export type RotateResult = {
  updated: string[];
  failed: RotateFail[];
};

export function assertRotateRequest(
  shareIds: unknown,
  newManageToken: unknown,
  maxIds = ROTATE_MANAGE_MAX_IDS,
): { shareIds: string[]; newManageToken: string } | { error: string } {
  if (!Array.isArray(shareIds) || shareIds.length === 0) {
    return { error: "shareIds must be a non-empty array." };
  }
  if (shareIds.length > maxIds) {
    return {
      error: `At most ${maxIds} shareIds per request.`,
    };
  }
  if (typeof newManageToken !== "string" || newManageToken === "") {
    return { error: "newManageToken is required." };
  }
  const ids = shareIds.map((id) => String(id || "")).filter(Boolean);
  if (ids.length !== shareIds.length) {
    return { error: "shareIds must be non-empty strings." };
  }
  return { shareIds: ids, newManageToken };
}

/**
 * Re-key manageTokenHash on matching shares.
 * Caller must hash `newManageToken` once and pass `newHash`.
 */
export async function applyManageRotate(opts: {
  metas: Array<{ id: string; meta: ShareMetadata | null }>;
  oldToken: string;
  newHash: string;
}): Promise<{ toWrite: ShareMetadata[]; failed: RotateFail[] }> {
  const toWrite: ShareMetadata[] = [];
  const failed: RotateFail[] = [];

  for (const { id, meta } of opts.metas) {
    if (!meta) {
      failed.push({ id, error: "not_found" });
      continue;
    }
    if (isExpired(meta.expiresAt)) {
      failed.push({ id, error: "expired" });
      continue;
    }
    const ok = await verifyPassword(opts.oldToken, meta.manageTokenHash);
    if (!ok) {
      failed.push({ id, error: "unauthorized" });
      continue;
    }
    toWrite.push({ ...meta, manageTokenHash: opts.newHash });
  }

  return { toWrite, failed };
}

export async function rotateManageOnBucket(
  bucket: R2Bucket,
  shareIds: string[],
  oldToken: string,
  newHash: string,
): Promise<RotateResult> {
  const metas = await Promise.all(
    shareIds.map(async (id) => ({
      id,
      meta: await readMetadata(bucket, id),
    })),
  );

  const { toWrite, failed } = await applyManageRotate({
    metas,
    oldToken,
    newHash,
  });

  await Promise.all(toWrite.map((meta) => putShareMetadata(bucket, meta)));

  return {
    updated: toWrite.map((m) => m.id),
    failed,
  };
}
