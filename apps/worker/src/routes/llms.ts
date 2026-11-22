import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";
import { LLMS_FULL_TXT, LLMS_TXT } from "../lib/llms-content";

const app = new OpenAPIHono<{ Bindings: Env }>();

const llmsRoute = createRoute({
  method: "get",
  path: "/llms.txt",
  tags: ["System"],
  summary: "Agent brief (llms.txt)",
  responses: {
    200: {
      description: "Markdown brief",
      content: { "text/plain": { schema: z.string() } },
    },
  },
});

app.openapi(llmsRoute, (c) =>
  c.text(LLMS_TXT, 200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  }),
);

const llmsFullRoute = createRoute({
  method: "get",
  path: "/llms-full.txt",
  tags: ["System"],
  summary: "Full agent brief (llms-full.txt)",
  responses: {
    200: {
      description: "Markdown brief",
      content: { "text/plain": { schema: z.string() } },
    },
  },
});

app.openapi(llmsFullRoute, (c) =>
  c.text(LLMS_FULL_TXT, 200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  }),
);

export default app;
