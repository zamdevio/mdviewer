import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";

const app = new OpenAPIHono<{ Bindings: Env; Variables: { corsOrigin: string } }>();

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  summary: "Health check",
  responses: {
    200: {
      description: "API is healthy",
      content: {
        "application/json": {
          schema: z.object({
            ok: z.literal(true),
          }),
        },
      },
    },
  },
});

app.openapi(healthRoute, (c) => c.json({ ok: true as const }, 200));

export default app;
