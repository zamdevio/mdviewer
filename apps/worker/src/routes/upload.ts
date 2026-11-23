import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";
import {
  ALLOWED_CONTENT_TYPES,
  extractContent,
  generateId,
  MAX_FILE_SIZE,
} from "../lib/content";
import { checkFairUse } from "../lib/fair-use";
import {
  hashPassword,
  readManageToken,
  readSharePassword,
} from "../lib/password";
import {
  putShare,
  sanitizeShareFilename,
  type ShareMetadata,
  type ShareType,
} from "../lib/share-store";
import { expiresAtFromTtl, parseTtlHeader } from "../lib/ttl";

const app = new OpenAPIHono<{
  Bindings: Env;
  Variables: { corsOrigin: string; frontendOrigin: string };
}>();

const uploadRoute = createRoute({
  method: "post",
  path: "/upload",
  tags: ["Share"],
  summary: "Upload markdown/text content",
  description:
    "Requires manage token (Authorization Bearer or X-Share-Manage-Token). Accepts text/plain or multipart/form-data. Optional view password via X-Share-Password when X-Share-View-Protected. Fixed TTL headers. Fair-use limited per IP+UA.",
  request: {
    body: {
      required: true,
      content: {
        "text/plain": {
          schema: z.string().openapi({
            description: "Raw markdown or plain text",
          }),
        },
        "multipart/form-data": {
          schema: z
            .object({
              file: z.any().optional(),
              content: z.any().optional(),
              markdown: z.any().optional(),
              text: z.any().optional(),
            })
            .openapi({
              description: "File upload via form field file|content|markdown|text",
            }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Upload stored",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            frontendShareUrl: z.string().url(),
            contentUrl: z.string().url(),
            size: z.number(),
            uploadedAt: z.string(),
            expiresAt: z.string(),
            viewProtected: z.boolean(),
            hasPassword: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: "Empty content",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    401: {
      description: "Manage token missing",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    413: {
      description: "Payload too large",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    415: {
      description: "Unsupported media type",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
            allowedTypes: z.array(z.string()).optional(),
            uploadFormats: z.array(z.string()).optional(),
          }),
        },
      },
    },
    429: {
      description: "Fair-use / rate limit exceeded",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
            resetAt: z.number(),
          }),
        },
      },
    },
    500: {
      description: "Storage error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
  },
});

function parseShareType(request: Request): ShareType {
  const raw = (request.headers.get("X-Share-Type") || "file").toLowerCase();
  return raw === "project" ? "project" : "file";
}

function parseViewProtected(request: Request): boolean {
  const raw = (request.headers.get("X-Share-View-Protected") || "").toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

app.openapi(uploadRoute, async (c) => {
  const frontendOrigin = c.get("frontendOrigin");
  const fairUse = await checkFairUse(c.env, c.req.raw, frontendOrigin);

  if (!fairUse.allowed) {
    return c.json(
      {
        error: "Rate limit exceeded",
        message: `Too many uploads. Please try again after ${Math.ceil((fairUse.resetAt - Date.now()) / 1000)} seconds.`,
        resetAt: fairUse.resetAt,
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

  const manageToken = readManageToken(c.req.raw);
  if (!manageToken) {
    return c.json(
      {
        error: "Unauthorized",
        message:
          "Provide Authorization: Bearer <manageToken> or X-Share-Manage-Token to create a share.",
      },
      401,
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
        message:
          error instanceof Error
            ? error.message
            : "Invalid request format. Use multipart/form-data for file uploads or text/plain for direct text.",
        allowedTypes: [...ALLOWED_CONTENT_TYPES],
        uploadFormats: [
          "multipart/form-data (for file uploads)",
          ...ALLOWED_CONTENT_TYPES.map((t) => `${t} (for direct text uploads)`),
        ],
      },
      415,
    );
  }

  const contentSize = new Blob([content]).size;
  if (contentSize > MAX_FILE_SIZE) {
    return c.json(
      {
        error: "File too large",
        message: `File size (${(contentSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 5MB.`,
      },
      413,
    );
  }

  if (contentSize === 0) {
    return c.json(
      {
        error: "Empty content",
        message: "Content cannot be empty.",
      },
      400,
    );
  }

  const id = generateId();
  const createdAt = new Date().toISOString();
  const ttlSeconds = parseTtlHeader(c.req.raw);
  const expiresAt = expiresAtFromTtl(ttlSeconds);
  const manageTokenHash = await hashPassword(manageToken);
  const passwordPlain = readSharePassword(c.req.raw);
  const passwordHash = passwordPlain ? await hashPassword(passwordPlain) : null;
  const viewProtected = parseViewProtected(c.req.raw);
  // viewProtected without password is meaningless for GET gate — force off
  const effectiveViewProtected = Boolean(passwordHash) && viewProtected;
  const filename = sanitizeShareFilename(
    c.req.raw.headers.get("X-Share-Filename"),
  );

  const meta: ShareMetadata = {
    id,
    type: parseShareType(c.req.raw),
    filename,
    contentType,
    size: contentSize,
    createdAt,
    expiresAt,
    manageTokenHash,
    passwordHash,
    viewProtected: effectiveViewProtected,
    protocol: 3,
  };

  try {
    await putShare(c.env.R2_BUCKET, meta, content);

    const frontendUrlObj = new URL(frontendOrigin);
    frontendUrlObj.pathname = `/share/${encodeURIComponent(id)}`;
    frontendUrlObj.search = "";
    frontendUrlObj.hash = "";

    const apiContentUrl = new URL(c.req.url);
    apiContentUrl.pathname = `/share/${encodeURIComponent(id)}`;
    apiContentUrl.search = "";
    apiContentUrl.hash = "";

    return c.json(
      {
        id,
        frontendShareUrl: frontendUrlObj.toString(),
        /** Raw markdown on this Worker (`/share/:id`) */
        contentUrl: apiContentUrl.toString(),
        size: contentSize,
        uploadedAt: createdAt,
        expiresAt,
        viewProtected: effectiveViewProtected,
        hasPassword: Boolean(passwordHash),
      },
      200,
      {
        "X-RateLimit-Limit": String(fairUse.limit),
        "X-RateLimit-Remaining": String(fairUse.remaining),
        "X-RateLimit-Reset": String(fairUse.resetAt),
        "X-Expires-At": expiresAt,
      },
    );
  } catch (error) {
    console.error("Error storing file:", error);
    return c.json(
      {
        error: "Storage error",
        message: "Failed to store file. Please try again.",
      },
      500,
    );
  }
});

export default app;
