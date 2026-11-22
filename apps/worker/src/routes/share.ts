import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";
import {
  ALLOWED_CONTENT_TYPES,
  extractContent,
  MAX_FILE_SIZE,
} from "../lib/content";
import { readSharePassword, verifyPassword } from "../lib/password";
import {
  deleteSharePrefix,
  putShare,
  readLegacyShare,
  readMetadata,
  readShareContent,
  sanitizeShareFilename,
  toPublicMeta,
  type ShareMetadata,
} from "../lib/share-store";
import { isExpired } from "../lib/ttl";

const app = new OpenAPIHono<{
  Bindings: Env;
  Variables: { corsOrigin: string; frontendOrigin: string };
}>();

const IdParam = z.object({
  id: z.string().min(1).openapi({
    param: { name: "id", in: "path" },
    description: "Share ID",
  }),
});

const ErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const PublicMetaSchema = z.object({
  id: z.string(),
  type: z.enum(["file", "project"]),
  filename: z.string(),
  contentType: z.string(),
  size: z.number(),
  createdAt: z.string(),
  expiresAt: z.string(),
  viewProtected: z.boolean(),
  hasPassword: z.boolean(),
  protocol: z.literal(2),
  legacy: z.boolean().optional(),
});

type AuthFail = { status: 401 | 403; error: string; message: string };

async function requirePassword(
  meta: ShareMetadata,
  request: Request,
): Promise<AuthFail | null> {
  if (!meta.passwordHash) {
    return {
      status: 403,
      error: "Password required",
      message:
        "This share has no mutate password. Create a new share with X-Share-Password to enable update/delete.",
    };
  }
  const password = readSharePassword(request);
  if (!password) {
    return {
      status: 401,
      error: "Unauthorized",
      message: "Provide X-Share-Password for this operation.",
    };
  }
  const ok = await verifyPassword(password, meta.passwordHash);
  if (!ok) {
    return {
      status: 401,
      error: "Unauthorized",
      message: "Invalid share password.",
    };
  }
  return null;
}

async function loadLiveMeta(
  bucket: R2Bucket,
  id: string,
): Promise<{ meta: ShareMetadata } | { expired: true } | { missing: true }> {
  const meta = await readMetadata(bucket, id);
  if (!meta) return { missing: true };
  if (isExpired(meta.expiresAt)) {
    await deleteSharePrefix(bucket, id);
    return { expired: true };
  }
  return { meta };
}

const getShareRoute = createRoute({
  method: "get",
  path: "/share/{id}",
  tags: ["Share"],
  summary: "Fetch shared markdown/text content",
  description:
    "Returns raw text. If viewProtected, requires X-Share-Password. Legacy flat R2 keys still supported. Expired shares are wiped and return 404.",
  request: { params: IdParam },
  responses: {
    200: {
      description: "Shared content",
      content: { "text/plain": { schema: z.string() } },
    },
    400: {
      description: "Invalid share ID",
      content: { "application/json": { schema: ErrorSchema } },
    },
    401: {
      description: "Password required for view-protected share",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Not found or expired",
      content: { "application/json": { schema: ErrorSchema } },
    },
    500: {
      description: "Retrieval error",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

app.openapi(getShareRoute, async (c) => {
  const { id } = c.req.valid("param");
  if (!id) return c.json({ error: "Invalid share ID" }, 400);

  try {
    const loaded = await loadLiveMeta(c.env.R2_BUCKET, id);
    if ("expired" in loaded) {
      return c.json(
        { error: "Not found", message: "The shared content has expired." },
        404,
      );
    }

    if ("meta" in loaded) {
      const { meta } = loaded;
      if (meta.viewProtected) {
        const password = readSharePassword(c.req.raw);
        if (!password || !(await verifyPassword(password, meta.passwordHash))) {
          return c.json(
            {
              error: "Unauthorized",
              message: "This share is view-protected. Provide X-Share-Password.",
            },
            401,
          );
        }
      }
      const content = await readShareContent(c.env.R2_BUCKET, meta);
      if (content == null) {
        return c.json(
          { error: "Not found", message: "Share content missing." },
          404,
        );
      }
      return c.text(content, 200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": meta.viewProtected
          ? "private, no-store"
          : "public, max-age=3600",
        "X-Content-Size": String(meta.size),
        "X-Uploaded-At": meta.createdAt,
        "X-Expires-At": meta.expiresAt,
        "X-Share-Filename": meta.filename,
      });
    }

    // Legacy flat key (no TTL / password)
    const legacy = await readLegacyShare(c.env.R2_BUCKET, id);
    if (!legacy) {
      return c.json(
        {
          error: "Not found",
          message: "The shared content was not found or has expired.",
        },
        404,
      );
    }
    return c.text(legacy.content, 200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Size": String(legacy.size),
      "X-Uploaded-At": legacy.uploadedAt,
      "X-Share-Legacy": "1",
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return c.json(
      { error: "Retrieval error", message: "Failed to retrieve shared content." },
      500,
    );
  }
});

const getMetaRoute = createRoute({
  method: "get",
  path: "/share/{id}/meta",
  tags: ["Share"],
  summary: "Anonymous share metadata",
  description:
    "Public meta without content or password hash. Legacy shares return a synthetic meta object.",
  request: { params: IdParam },
  responses: {
    200: {
      description: "Share metadata",
      content: { "application/json": { schema: PublicMetaSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

app.openapi(getMetaRoute, async (c) => {
  const { id } = c.req.valid("param");
  const loaded = await loadLiveMeta(c.env.R2_BUCKET, id);
  if ("expired" in loaded) {
    return c.json(
      { error: "Not found", message: "The shared content has expired." },
      404,
    );
  }
  if ("meta" in loaded) {
    return c.json(toPublicMeta(loaded.meta), 200);
  }
  const legacy = await readLegacyShare(c.env.R2_BUCKET, id);
  if (!legacy) {
    return c.json(
      { error: "Not found", message: "The shared content was not found." },
      404,
    );
  }
  return c.json(
    toPublicMeta(
      {
        id,
        type: "file",
        filename: "content.md",
        contentType: "text/plain",
        size: legacy.size,
        createdAt: legacy.uploadedAt || new Date(0).toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        passwordHash: null,
        viewProtected: false,
        protocol: 2,
      },
      { legacy: true },
    ),
    200,
  );
});

const putShareRoute = createRoute({
  method: "put",
  path: "/share/{id}",
  tags: ["Share"],
  summary: "Replace share content",
  description:
    "Requires X-Share-Password. Keeps expiresAt and id. Body same as upload (text/plain or multipart).",
  request: {
    params: IdParam,
    body: {
      required: true,
      content: {
        "text/plain": { schema: z.string() },
        "multipart/form-data": {
          schema: z.object({
            file: z.any().optional(),
            content: z.any().optional(),
            markdown: z.any().optional(),
            text: z.any().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            size: z.number(),
            expiresAt: z.string(),
            updatedAt: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Empty content",
      content: { "application/json": { schema: ErrorSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "No mutate password",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
    413: {
      description: "Too large",
      content: { "application/json": { schema: ErrorSchema } },
    },
    415: {
      description: "Unsupported media type",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

app.openapi(putShareRoute, async (c) => {
  const { id } = c.req.valid("param");
  const loaded = await loadLiveMeta(c.env.R2_BUCKET, id);
  if ("expired" in loaded || "missing" in loaded) {
    return c.json(
      { error: "Not found", message: "Share not found or expired." },
      404,
    );
  }
  const { meta } = loaded;
  const authErr = await requirePassword(meta, c.req.raw);
  if (authErr) {
    return c.json(
      { error: authErr.error, message: authErr.message },
      authErr.status,
    );
  }

  let content: string;
  let contentType: string;
  try {
    const extracted = await extractContent(c.req.raw);
    content = extracted.content;
    contentType = extracted.contentType;
  } catch (error) {
    return c.json(
      {
        error: "Invalid content type",
        message: error instanceof Error ? error.message : "Invalid body",
      },
      415,
    );
  }

  const contentSize = new Blob([content]).size;
  if (contentSize > MAX_FILE_SIZE) {
    return c.json(
      { error: "File too large", message: "Payload exceeds 5MB." },
      413,
    );
  }
  if (contentSize === 0) {
    return c.json(
      { error: "Empty content", message: "Content cannot be empty." },
      400,
    );
  }

  // Keep expiresAt + password; replace content (same filename unless header overrides)
  const filenameHeader = c.req.raw.headers.get("X-Share-Filename");
  const next: ShareMetadata = {
    ...meta,
    filename: filenameHeader
      ? sanitizeShareFilename(filenameHeader)
      : meta.filename,
    contentType: ALLOWED_CONTENT_TYPES.includes(
      contentType as (typeof ALLOWED_CONTENT_TYPES)[number],
    )
      ? contentType
      : meta.contentType,
    size: contentSize,
  };

  // If filename changed, drop old file key
  if (next.filename !== meta.filename) {
    await c.env.R2_BUCKET.delete(
      `shares/${meta.id}/files/${meta.filename}`,
    );
  }

  await putShare(c.env.R2_BUCKET, next, content);
  const updatedAt = new Date().toISOString();
  return c.json(
    {
      id,
      size: contentSize,
      expiresAt: meta.expiresAt,
      updatedAt,
    },
    200,
    { "X-Expires-At": meta.expiresAt },
  );
});

const patchShareRoute = createRoute({
  method: "patch",
  path: "/share/{id}",
  tags: ["Share"],
  summary: "Update viewProtected flag",
  description: "Requires X-Share-Password. Body: { viewProtected: boolean }.",
  request: {
    params: IdParam,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            viewProtected: z.boolean(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated meta",
      content: { "application/json": { schema: PublicMetaSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

app.openapi(patchShareRoute, async (c) => {
  const { id } = c.req.valid("param");
  const loaded = await loadLiveMeta(c.env.R2_BUCKET, id);
  if ("expired" in loaded || "missing" in loaded) {
    return c.json(
      { error: "Not found", message: "Share not found or expired." },
      404,
    );
  }
  const { meta } = loaded;
  const authErr = await requirePassword(meta, c.req.raw);
  if (authErr) {
    return c.json(
      { error: authErr.error, message: authErr.message },
      authErr.status,
    );
  }

  const body = c.req.valid("json");
  const next: ShareMetadata = {
    ...meta,
    viewProtected: Boolean(body.viewProtected),
  };
  await c.env.R2_BUCKET.put(
    `shares/${id}/metadata.json`,
    JSON.stringify(next),
    { httpMetadata: { contentType: "application/json; charset=utf-8" } },
  );
  return c.json(toPublicMeta(next), 200);
});

const deleteShareRoute = createRoute({
  method: "delete",
  path: "/share/{id}",
  tags: ["Share"],
  summary: "Delete share",
  description: "Requires X-Share-Password. Wipes shares/{id}/ prefix (and legacy flat key).",
  request: { params: IdParam },
  responses: {
    200: {
      description: "Deleted",
      content: {
        "application/json": {
          schema: z.object({ ok: z.literal(true), id: z.string() }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: ErrorSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: ErrorSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

app.openapi(deleteShareRoute, async (c) => {
  const { id } = c.req.valid("param");
  const meta = await readMetadata(c.env.R2_BUCKET, id);
  if (!meta) {
    // Legacy flat: require no password path — refuse without password for safety
    const legacy = await readLegacyShare(c.env.R2_BUCKET, id);
    if (!legacy) {
      return c.json(
        { error: "Not found", message: "Share not found." },
        404,
      );
    }
    return c.json(
      {
        error: "Password required",
        message:
          "Legacy shares cannot be deleted via API without a migrate password. Contact host or wait for natural cleanup.",
      },
      403,
    );
  }

  const authErr = await requirePassword(meta, c.req.raw);
  if (authErr) {
    return c.json(
      { error: authErr.error, message: authErr.message },
      authErr.status,
    );
  }

  await deleteSharePrefix(c.env.R2_BUCKET, id);
  return c.json({ ok: true as const, id }, 200);
});

export default app;
