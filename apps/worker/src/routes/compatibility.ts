import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Env } from "../env";
import {
  MAX_FILE_SIZE,
  ROTATE_MANAGE_MAX_IDS,
  TTL_DEFAULT_SECONDS,
  TTL_MAX_SECONDS,
  TTL_MIN_SECONDS,
} from "../lib/config";
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
  name: z.literal("mdviewer"),
  version: z.string(),
  protocol: z.number().int(),
  endpoints: z.array(EndpointSchema),
  features: z.object({
    manageToken: z.boolean(),
    viewPasswordSeparate: z.boolean(),
    fixedTtl: z.boolean(),
    viewProtected: z.boolean(),
    fairUseFingerprint: z.boolean(),
    mcp: z.boolean(),
    llmsTxt: z.boolean(),
  }),
  ttl: z.object({
    defaultSeconds: z.number(),
    minSeconds: z.number(),
    maxSeconds: z.number(),
  }),
  limits: z.object({
    maxFileBytes: z.number(),
    rotateManageMaxIds: z.number(),
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
    "Versioned contract so frontends (including BYO hosts) can verify they speak the same share API. Protocol 3 = manage token + separate view password; limits from Worker config.",
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
      name: "mdviewer" as const,
      version: "4.0.0",
      protocol: 3,
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
          description:
            "Create share (manage token required; optional view password / TTL)",
        },
        {
          method: "GET",
          path: "/share/:id",
          description: "Fetch shared markdown (view password if protected)",
        },
        {
          method: "GET",
          path: "/share/:id/meta",
          description: "Anonymous share metadata",
        },
        {
          method: "PUT",
          path: "/share/:id",
          description: "Replace content (Bearer manage token)",
        },
        {
          method: "PATCH",
          path: "/share/:id",
          description: "Update viewProtected (Bearer manage token)",
        },
        {
          method: "DELETE",
          path: "/share/:id",
          description: "Wipe share prefix (Bearer manage token)",
        },
        {
          method: "POST",
          path: "/share/rotate-manage",
          description:
            "Bulk rotate manageTokenHash (Bearer old token; body newManageToken)",
        },
        { method: "POST", path: "/mcp", description: "MCP JSON-RPC tools" },
        {
          method: "GET",
          path: "/favicon.svg",
          description: "Brand icon (MCP serverInfo.icons)",
        },
        { method: "GET", path: "/llms.txt", description: "Agent brief" },
        { method: "GET", path: "/llms-full.txt", description: "Full agent brief" },
        { method: "GET", path: "/docs", description: "Swagger UI" },
        { method: "GET", path: "/openapi.json", description: "OpenAPI document" },
      ],
      features: {
        manageToken: true,
        viewPasswordSeparate: true,
        fixedTtl: true,
        viewProtected: true,
        fairUseFingerprint: true,
        mcp: true,
        llmsTxt: true,
      },
      ttl: {
        defaultSeconds: TTL_DEFAULT_SECONDS,
        minSeconds: TTL_MIN_SECONDS,
        maxSeconds: TTL_MAX_SECONDS,
      },
      limits: {
        maxFileBytes: MAX_FILE_SIZE,
        rotateManageMaxIds: ROTATE_MANAGE_MAX_IDS,
      },
      cors: {
        allowedOriginsConfigured: allowed.length > 0,
      },
    },
    200,
  );
});

export default app;
