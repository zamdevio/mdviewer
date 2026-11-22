import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";
import { parseAllowedOrigins } from "../lib/origins";

const app = new OpenAPIHono<{
  Bindings: Env;
  Variables: { corsOrigin: string };
}>();

const EndpointSchema = z.object({
  method: z.string(),
  path: z.string(),
  description: z.string().optional(),
});

const CompatibilitySchema = z.object({
  name: z.literal("mdviewer-api"),
  version: z.string(),
  protocol: z.number().int(),
  endpoints: z.array(EndpointSchema),
  cors: z.object({
    allowedOriginsConfigured: z.boolean(),
  }),
});

const compatibilityRoute = createRoute({
  method: "get",
  path: "/compatibility",
  tags: ["System"],
  summary: "Client/server compatibility handshake",
  description:
    "Versioned contract so frontends (including BYO hosts) can verify they speak the same share API.",
  responses: {
    200: {
      description: "Compatibility metadata",
      content: {
        "application/json": {
          schema: CompatibilitySchema,
        },
      },
    },
  },
});

app.openapi(compatibilityRoute, (c) => {
  const allowed = parseAllowedOrigins(c.env);
  return c.json(
    {
      name: "mdviewer-api" as const,
      version: "1.0.0",
      protocol: 1,
      endpoints: [
        { method: "GET", path: "/health", description: "Liveness" },
        {
          method: "GET",
          path: "/compatibility",
          description: "This handshake document",
        },
        { method: "POST", path: "/upload", description: "Upload markdown (rate limited)" },
        { method: "GET", path: "/share/:id", description: "Fetch shared markdown" },
        { method: "GET", path: "/docs", description: "Swagger UI" },
        { method: "GET", path: "/openapi.json", description: "OpenAPI document" },
      ],
      cors: {
        allowedOriginsConfigured: allowed.length > 0,
      },
    },
    200,
  );
});

export default app;
