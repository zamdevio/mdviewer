import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";

const app = new OpenAPIHono<{
  Bindings: Env;
  Variables: { corsOrigin: string; frontendOrigin: string };
}>();

const shareRoute = createRoute({
  method: "get",
  path: "/share/{id}",
  tags: ["Share"],
  summary: "Fetch shared markdown/text content",
  description: "Unlimited downloads. Returns raw text/plain content from R2.",
  request: {
    params: z.object({
      id: z.string().min(1).openapi({
        param: { name: "id", in: "path" },
        description: "Share ID returned from POST /upload",
      }),
    }),
  },
  responses: {
    200: {
      description: "Shared content",
      content: {
        "text/plain": {
          schema: z.string(),
        },
      },
    },
    400: {
      description: "Invalid share ID",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Retrieval error",
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

app.openapi(shareRoute, async (c) => {
  const { id } = c.req.valid("param");
  if (!id) {
    return c.json({ error: "Invalid share ID" }, 400);
  }

  try {
    const object = await c.env.R2_BUCKET.get(id);
    if (!object) {
      return c.json(
        {
          error: "Not found",
          message: "The shared content was not found or has expired.",
        },
        404,
      );
    }

    const content = await object.text();
    return c.text(content, 200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Size": object.customMetadata?.size || "0",
      "X-Uploaded-At": object.customMetadata?.uploadedAt || "",
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

export default app;
