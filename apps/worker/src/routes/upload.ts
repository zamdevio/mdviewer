import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";
import {
  ALLOWED_CONTENT_TYPES,
  extractContent,
  generateId,
  MAX_FILE_SIZE,
} from "../lib/content";
import { checkRateLimit, getClientIP } from "../lib/rate-limit";

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
    "Accepts text/plain (or markdown content-types) body, or multipart/form-data with a file field. Rate limited per IP.",
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
            size: z.number(),
            uploadedAt: z.string(),
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
      description: "Rate limit exceeded",
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

app.openapi(uploadRoute, async (c) => {
  const frontendOrigin = c.get("frontendOrigin");
  const ip = getClientIP(c.req.raw);
  const rateLimit = await checkRateLimit(c.env, ip, frontendOrigin);

  if (!rateLimit.allowed) {
    return c.json(
      {
        error: "Rate limit exceeded",
        message: `Too many uploads. Please try again after ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds.`,
        resetAt: rateLimit.resetAt,
      },
      429,
      {
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
        "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
      },
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
  try {
    await c.env.R2_BUCKET.put(id, content, {
      httpMetadata: {
        contentType: `${contentType}; charset=utf-8`,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        size: String(contentSize),
      },
    });

    const frontendUrlObj = new URL(frontendOrigin);
    frontendUrlObj.pathname = "/share";
    frontendUrlObj.searchParams.set("id", id);

    return c.json(
      {
        id,
        frontendShareUrl: frontendUrlObj.toString(),
        size: contentSize,
        uploadedAt: new Date().toISOString(),
      },
      200,
      {
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
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
