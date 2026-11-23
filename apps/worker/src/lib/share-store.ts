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
  /** Creator manage secret (required, protocol 3) */
  manageTokenHash: string;
  /** View-only password hash; null when not view-protected */
  passwordHash: string | null;
  viewProtected: boolean;
  protocol: 3;
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
  protocol: 3;
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

export function toPublicMeta(meta: ShareMetadata): PublicShareMeta {
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
    protocol: 3,
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

export async function putShareMetadata(
  bucket: R2Bucket,
  meta: ShareMetadata,
): Promise<void> {
  await bucket.put(metaKey(meta.id), JSON.stringify(meta), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
}

export async function readMetadata(
  bucket: R2Bucket,
  id: string,
): Promise<ShareMetadata | null> {
  const obj = await bucket.get(metaKey(id));
  if (!obj) return null;
  try {
    const parsed = (await obj.json()) as Partial<ShareMetadata> & {
      id?: string;
      filename?: string;
      expiresAt?: string;
    };
    if (!parsed?.id || !parsed.filename || !parsed.expiresAt) return null;
    if (parsed.protocol !== 3 || typeof parsed.manageTokenHash !== "string") {
      return null;
    }
    return parsed as ShareMetadata;
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
