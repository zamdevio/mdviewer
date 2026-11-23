import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";
import {
  ALLOWED_CONTENT_TYPES,
  extractContent,
  MAX_FILE_SIZE,
} from "../lib/content";
import { checkFairUse } from "../lib/fair-use";
import {
  hashPassword,
  readManageToken,
  readSharePassword,
  requireManageToken,
  verifyPassword,
} from "../lib/password";
import {
  assertRotateRequest,
  rotateManageOnBucket,
} from "../lib/rotate-manage";
import {
  deleteSharePrefix,
  putShare,
  putShareMetadata,
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
  protocol: z.literal(3),
});

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
    "Returns raw text. If viewProtected, requires X-Share-Password (view only). Expired shares are wiped and return 404.",
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
      description: "View password required",
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
    if ("expired" in loaded || "missing" in loaded) {
      return c.json(
        {
          error: "Not found",
          message: "The shared content was not found or has expired.",
        },
        404,
      );
    }

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
  } catch (error) {
    console.error("Error retrieving file:", error);
    return c.json(
      {
        error: "Retrieval error",
        message: "Failed to retrieve shared content.",
      },
      500,
    );
  }
});

const getMetaRoute = createRoute({
  method: "get",
  path: "/share/{id}/meta",
  tags: ["Share"],
  summary: "Anonymous share metadata",
  description: "Public meta without content or secret hashes.",
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
  if ("expired" in loaded || "missing" in loaded) {
    return c.json(
      { error: "Not found", message: "The shared content was not found or has expired." },
      404,
    );
  }
  return c.json(toPublicMeta(loaded.meta), 200);
});

const putShareRoute = createRoute({
  method: "put",
  path: "/share/{id}",
  tags: ["Share"],
  summary: "Replace share content",
  description:
    "Requires manage token (Authorization Bearer or X-Share-Manage-Token). Keeps expiresAt and id.",
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
      description: "Forbidden",
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
  const authErr = await requireManageToken(meta.manageTokenHash, c.req.raw);
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

  if (next.filename !== meta.filename) {
    await c.env.R2_BUCKET.delete(`shares/${meta.id}/files/${meta.filename}`);
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
  summary: "Update view protection",
  description:
    "Requires manage token. Body: { viewProtected: boolean, viewPassword?: string }. Clearing protect drops the view hash; enabling protect needs a view password (header X-Share-Password or body.viewPassword).",
  request: {
    params: IdParam,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            viewProtected: z.boolean(),
            viewPassword: z.string().optional(),
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
    400: {
      description: "Bad request",
      content: { "application/json": { schema: ErrorSchema } },
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
  const authErr = await requireManageToken(meta.manageTokenHash, c.req.raw);
  if (authErr) {
    return c.json(
      { error: authErr.error, message: authErr.message },
      authErr.status,
    );
  }

  const body = c.req.valid("json");
  const wantProtect = Boolean(body.viewProtected);
  let passwordHash = meta.passwordHash;
  if (!wantProtect) {
    passwordHash = null;
  } else {
    const fromBody =
      typeof body.viewPassword === "string" && body.viewPassword !== ""
        ? body.viewPassword
        : null;
    const fromHeader = readSharePassword(c.req.raw);
    const viewPlain = fromBody || fromHeader;
    if (viewPlain) {
      passwordHash = await hashPassword(viewPlain);
    } else if (!passwordHash) {
      return c.json(
        {
          error: "View password required",
          message:
            "Enable viewProtected with viewPassword (body) or X-Share-Password.",
        },
        400,
      );
    }
  }

  const next: ShareMetadata = {
    ...meta,
    viewProtected: wantProtect && Boolean(passwordHash),
    passwordHash: wantProtect ? passwordHash : null,
  };
  await putShareMetadata(c.env.R2_BUCKET, next);
  return c.json(toPublicMeta(next), 200);
});

const deleteShareRoute = createRoute({
  method: "delete",
  path: "/share/{id}",
  tags: ["Share"],
  summary: "Delete share",
  description:
    "Requires manage token. Wipes shares/{id}/ prefix.",
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
    return c.json(
      { error: "Not found", message: "Share not found." },
      404,
    );
  }

  const authErr = await requireManageToken(meta.manageTokenHash, c.req.raw);
  if (authErr) {
    return c.json(
      { error: authErr.error, message: authErr.message },
      authErr.status,
    );
  }

  await deleteSharePrefix(c.env.R2_BUCKET, id);
  return c.json({ ok: true as const, id }, 200);
});

const rotateManageRoute = createRoute({
  method: "post",
  path: "/share/rotate-manage",
  tags: ["Share"],
  summary: "Bulk rotate manage token hashes",
  description:
    "Auth with the old manage token (Bearer). Body: { shareIds, newManageToken }. Hashes the new token once and writes it to each matching share (metadata only). Cap from server config (compatibility.limits.rotateManageMaxIds).",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            shareIds: z.array(z.string()).min(1),
            newManageToken: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Partial results OK",
      content: {
        "application/json": {
          schema: z.object({
            updated: z.array(z.string()),
            failed: z.array(
              z.object({ id: z.string(), error: z.string() }),
            ),
          }),
        },
      },
    },
    400: {
      description: "Bad request / over cap",
      content: { "application/json": { schema: ErrorSchema } },
    },
    401: {
      description: "Missing old manage token",
      content: { "application/json": { schema: ErrorSchema } },
    },
    429: {
      description: "Fair-use",
      content: { "application/json": { schema: ErrorSchema } },
    },
  },
});

app.openapi(rotateManageRoute, async (c) => {
  const frontendOrigin = c.get("frontendOrigin");
  const fairUse = await checkFairUse(c.env, c.req.raw, frontendOrigin);
  if (!fairUse.allowed) {
    return c.json(
      {
        error: "Rate limit exceeded",
        message: `Too many requests. Retry after ${Math.ceil((fairUse.resetAt - Date.now()) / 1000)} seconds.`,
      },
      429,
      {
        "X-RateLimit-Limit": String(fairUse.limit),
        "X-RateLimit-Remaining": String(fairUse.remaining),
        "X-RateLimit-Reset": String(fairUse.resetAt),
        "Retry-After": String(Math.ceil((fairUse.resetAt - Date.now()) / 1000)),
      },
    );
  }

  const oldToken = readManageToken(c.req.raw);
  if (!oldToken) {
    return c.json(
      {
        error: "Unauthorized",
        message:
          "Provide Authorization: Bearer <oldManageToken> or X-Share-Manage-Token.",
      },
      401,
    );
  }

  const body = c.req.valid("json");
  const checked = assertRotateRequest(body.shareIds, body.newManageToken);
  if ("error" in checked) {
    return c.json({ error: "Bad request", message: checked.error }, 400);
  }

  const newHash = await hashPassword(checked.newManageToken);
  const result = await rotateManageOnBucket(
    c.env.R2_BUCKET,
    checked.shareIds,
    oldToken,
    newHash,
  );

  return c.json(result, 200, {
    "X-RateLimit-Limit": String(fairUse.limit),
    "X-RateLimit-Remaining": String(fairUse.remaining),
    "X-RateLimit-Reset": String(fairUse.resetAt),
  });
});

export default app;
