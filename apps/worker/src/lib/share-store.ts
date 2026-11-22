import type { Env } from "../env";
import { isExpired } from "./ttl";

export type ShareType = "file" | "project";

export type ShareMetadata = {
  id: string;
  type: ShareType;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  /** Immutable wipe time — set once at create */
  expiresAt: string;
  passwordHash: string | null;
  viewProtected: boolean;
  protocol: 2;
};

export type PublicShareMeta = {
  id: string;
  type: ShareType;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string;
  viewProtected: boolean;
  hasPassword: boolean;
  protocol: 2;
  legacy?: boolean;
};

export function metaKey(id: string): string {
  return `shares/${id}/metadata.json`;
}

export function fileKey(id: string, filename: string): string {
  return `shares/${id}/files/${filename}`;
}

export function sanitizeShareFilename(name: string | null | undefined): string {
  const cleaned = (name || "content.md")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  const base = cleaned || "content.md";
  return base.slice(0, 180);
}

export function toPublicMeta(
  meta: ShareMetadata,
  opts?: { legacy?: boolean },
): PublicShareMeta {
  return {
    id: meta.id,
    type: meta.type,
    filename: meta.filename,
    contentType: meta.contentType,
    size: meta.size,
    createdAt: meta.createdAt,
    expiresAt: meta.expiresAt,
    viewProtected: meta.viewProtected,
    hasPassword: Boolean(meta.passwordHash),
    protocol: 2,
    ...(opts?.legacy ? { legacy: true } : {}),
  };
}

export async function putShare(
  bucket: R2Bucket,
  meta: ShareMetadata,
  content: string,
): Promise<void> {
  await bucket.put(metaKey(meta.id), JSON.stringify(meta), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
  await bucket.put(fileKey(meta.id, meta.filename), content, {
    httpMetadata: {
      contentType: `${meta.contentType}; charset=utf-8`,
    },
    customMetadata: {
      size: String(meta.size),
      createdAt: meta.createdAt,
      expiresAt: meta.expiresAt,
    },
  });
}

export async function readMetadata(
  bucket: R2Bucket,
  id: string,
): Promise<ShareMetadata | null> {
  const obj = await bucket.get(metaKey(id));
  if (!obj) return null;
  try {
    const parsed = (await obj.json()) as ShareMetadata;
    if (!parsed?.id || !parsed.filename || !parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readShareContent(
  bucket: R2Bucket,
  meta: ShareMetadata,
): Promise<string | null> {
  const obj = await bucket.get(fileKey(meta.id, meta.filename));
  if (!obj) return null;
  return obj.text();
}

/** Legacy flat R2 key = share id (pre–Phase C). */
export async function readLegacyShare(
  bucket: R2Bucket,
  id: string,
): Promise<{ content: string; size: number; uploadedAt: string } | null> {
  const obj = await bucket.get(id);
  if (!obj) return null;
  const content = await obj.text();
  return {
    content,
    size: Number(obj.customMetadata?.size || content.length),
    uploadedAt: obj.customMetadata?.uploadedAt || "",
  };
}

export async function deleteSharePrefix(
  bucket: R2Bucket,
  id: string,
): Promise<void> {
  const prefix = `shares/${id}/`;
  let cursor: string | undefined;
  do {
    const listed = await bucket.list({ prefix, cursor, limit: 100 });
    if (listed.objects.length > 0) {
      await Promise.all(listed.objects.map((o) => bucket.delete(o.key)));
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  // Best-effort legacy flat key
  await bucket.delete(id);
}

export async function sweepExpiredShares(env: Env): Promise<{ deleted: number }> {
  const bucket = env.R2_BUCKET;
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const listed = await bucket.list({ prefix: "shares/", cursor, limit: 200 });
    for (const obj of listed.objects) {
      if (!obj.key.endsWith("/metadata.json")) continue;
      const idMatch = /^shares\/([^/]+)\/metadata\.json$/.exec(obj.key);
      if (!idMatch) continue;
      const id = idMatch[1];
      const meta = await readMetadata(bucket, id);
      if (!meta || !isExpired(meta.expiresAt)) continue;
      await deleteSharePrefix(bucket, id);
      deleted++;
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return { deleted };
}
