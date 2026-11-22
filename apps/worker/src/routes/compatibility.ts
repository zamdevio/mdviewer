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
  features: z.object({
    password: z.boolean(),
    fixedTtl: z.boolean(),
    viewProtected: z.boolean(),
    fairUseFingerprint: z.boolean(),
    legacyFlatKeys: z.boolean(),
  }),
  ttl: z.object({
    defaultSeconds: z.number(),
    minSeconds: z.number(),
    maxSeconds: z.number(),
  }),
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
    "Versioned contract so frontends (including BYO hosts) can verify they speak the same share API. Protocol 2 = Phase C (TTL + password + prefix layout).",
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
      version: "2.0.0",
      protocol: 2,
      endpoints: [
        { method: "GET", path: "/health", description: "Liveness" },
        {
          method: "GET",
          path: "/compatibility",
          description: "This handshake document",
        },
        {
          method: "POST",
          path: "/upload",
          description: "Create share (fair-use limited; optional password/TTL headers)",
        },
        { method: "GET", path: "/share/:id", description: "Fetch shared markdown" },
        { method: "GET", path: "/share/:id/meta", description: "Anonymous share metadata" },
        {
          method: "PUT",
          path: "/share/:id",
          description: "Replace content (X-Share-Password); keeps expiresAt",
        },
        {
          method: "PATCH",
          path: "/share/:id",
          description: "Update viewProtected (X-Share-Password)",
        },
        {
          method: "DELETE",
          path: "/share/:id",
          description: "Wipe share prefix (X-Share-Password)",
        },
        { method: "GET", path: "/docs", description: "Swagger UI" },
        { method: "GET", path: "/openapi.json", description: "OpenAPI document" },
      ],
      features: {
        password: true,
        fixedTtl: true,
        viewProtected: true,
        fairUseFingerprint: true,
        legacyFlatKeys: true,
      },
      ttl: {
        defaultSeconds: 7 * 24 * 60 * 60,
        minSeconds: 60,
        maxSeconds: 30 * 24 * 60 * 60,
      },
      cors: {
        allowedOriginsConfigured: allowed.length > 0,
      },
    },
    200,
  );
});

export default app;
