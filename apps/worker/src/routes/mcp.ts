import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../env";
import { checkFairUse } from "../lib/fair-use";
import { hashPassword, verifyPassword } from "../lib/password";
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
import {
  clampTtlSeconds,
  expiresAtFromTtl,
  isExpired,
  TTL_DEFAULT_SECONDS,
} from "../lib/ttl";
import { generateId, MAX_FILE_SIZE } from "../lib/content";

const app = new OpenAPIHono<{
  Bindings: Env;
  Variables: { corsOrigin: string; frontendOrigin: string };
}>();

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
};

const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"] as const;

const TOOLS = [
  {
    name: "get_share",
    description: "Fetch shared markdown content by id (password if viewProtected).",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        password: { type: "string", description: "Required when viewProtected" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_share_meta",
    description: "Anonymous share metadata (no content, no password hash).",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "upload_share",
    description: "Create a share (fair-use limited). Optional password / TTL / viewProtected.",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string" },
        password: { type: "string" },
        ttlSeconds: { type: "number" },
        viewProtected: { type: "boolean" },
        filename: { type: "string" },
        type: { type: "string", enum: ["file", "project"] },
      },
      required: ["content"],
    },
  },
  {
    name: "update_share",
    description: "Replace share content; keeps expiresAt. Requires password.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        content: { type: "string" },
        password: { type: "string" },
        filename: { type: "string" },
      },
      required: ["id", "content", "password"],
    },
  },
  {
    name: "delete_share",
    description: "Wipe shares/{id}/ prefix. Requires password.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        password: { type: "string" },
      },
      required: ["id", "password"],
    },
  },
] as const;

function rpcResult(id: JsonRpcId | undefined, result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function rpcError(id: JsonRpcId | undefined, code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function toolText(text: string, isError = false) {
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

async function callTool(
  name: string,
  args: Record<string, unknown>,
  env: Env,
  frontendOrigin: string,
  request: Request,
): Promise<{ content: Array<{ type: string; text: string }>; isError: boolean }> {
  switch (name) {
    case "get_share_meta": {
      const id = String(args.id || "");
      if (!id) return toolText("id required", true);
      const meta = await readMetadata(env.R2_BUCKET, id);
      if (meta) {
        if (isExpired(meta.expiresAt)) {
          await deleteSharePrefix(env.R2_BUCKET, id);
          return toolText("Share expired", true);
        }
        return toolText(JSON.stringify(toPublicMeta(meta), null, 2));
      }
      const legacy = await readLegacyShare(env.R2_BUCKET, id);
      if (!legacy) return toolText("Not found", true);
      return toolText(
        JSON.stringify(
          {
            id,
            legacy: true,
            size: legacy.size,
            createdAt: legacy.uploadedAt,
          },
          null,
          2,
        ),
      );
    }
    case "get_share": {
      const id = String(args.id || "");
      const password = args.password != null ? String(args.password) : null;
      if (!id) return toolText("id required", true);
      const meta = await readMetadata(env.R2_BUCKET, id);
      if (meta) {
        if (isExpired(meta.expiresAt)) {
          await deleteSharePrefix(env.R2_BUCKET, id);
          return toolText("Share expired", true);
        }
        if (meta.viewProtected) {
          if (!password || !(await verifyPassword(password, meta.passwordHash))) {
            return toolText("Unauthorized: view password required", true);
          }
        }
        const content = await readShareContent(env.R2_BUCKET, meta);
        if (content == null) return toolText("Content missing", true);
        return toolText(content);
      }
      const legacy = await readLegacyShare(env.R2_BUCKET, id);
      if (!legacy) return toolText("Not found", true);
      return toolText(legacy.content);
    }
    case "upload_share": {
      const fair = await checkFairUse(env, request, frontendOrigin);
      if (!fair.allowed) {
        return toolText(`Rate limited until ${new Date(fair.resetAt).toISOString()}`, true);
      }
      const content = String(args.content ?? "");
      if (!content) return toolText("content required", true);
      const size = new Blob([content]).size;
      if (size > MAX_FILE_SIZE) return toolText("Content exceeds 5MB", true);
      const id = generateId();
      const createdAt = new Date().toISOString();
      const ttl = clampTtlSeconds(
        typeof args.ttlSeconds === "number" ? args.ttlSeconds : TTL_DEFAULT_SECONDS,
      );
      const expiresAt = expiresAtFromTtl(ttl);
      const password = args.password != null ? String(args.password) : "";
      const passwordHash = password ? await hashPassword(password) : null;
      const viewProtected = Boolean(passwordHash) && Boolean(args.viewProtected);
      const filename = sanitizeShareFilename(
        args.filename != null ? String(args.filename) : "content.md",
      );
      const meta: ShareMetadata = {
        id,
        type: args.type === "project" ? "project" : "file",
        filename,
        contentType: "text/plain",
        size,
        createdAt,
        expiresAt,
        passwordHash,
        viewProtected,
        protocol: 2,
      };
      await putShare(env.R2_BUCKET, meta, content);
      const shareUrl = new URL(frontendOrigin);
      shareUrl.pathname = "/share";
      shareUrl.searchParams.set("id", id);
      return toolText(
        JSON.stringify(
          {
            id,
            frontendShareUrl: shareUrl.toString(),
            expiresAt,
            hasPassword: Boolean(passwordHash),
            viewProtected,
            size,
          },
          null,
          2,
        ),
      );
    }
    case "update_share": {
      const id = String(args.id || "");
      const password = String(args.password || "");
      const content = String(args.content ?? "");
      if (!id || !password || !content) {
        return toolText("id, password, and content required", true);
      }
      const meta = await readMetadata(env.R2_BUCKET, id);
      if (!meta || isExpired(meta.expiresAt)) {
        return toolText("Not found or expired", true);
      }
      if (!meta.passwordHash || !(await verifyPassword(password, meta.passwordHash))) {
        return toolText("Unauthorized", true);
      }
      const size = new Blob([content]).size;
      if (size > MAX_FILE_SIZE) return toolText("Content exceeds 5MB", true);
      const filename =
        args.filename != null
          ? sanitizeShareFilename(String(args.filename))
          : meta.filename;
      if (filename !== meta.filename) {
        await env.R2_BUCKET.delete(`shares/${id}/files/${meta.filename}`);
      }
      const next: ShareMetadata = { ...meta, filename, size };
      await putShare(env.R2_BUCKET, next, content);
      return toolText(
        JSON.stringify({ id, size, expiresAt: meta.expiresAt }, null, 2),
      );
    }
    case "delete_share": {
      const id = String(args.id || "");
      const password = String(args.password || "");
      if (!id || !password) return toolText("id and password required", true);
      const meta = await readMetadata(env.R2_BUCKET, id);
      if (!meta) return toolText("Not found", true);
      if (!meta.passwordHash || !(await verifyPassword(password, meta.passwordHash))) {
        return toolText("Unauthorized", true);
      }
      await deleteSharePrefix(env.R2_BUCKET, id);
      return toolText(JSON.stringify({ ok: true, id }));
    }
    default:
      return toolText(`Unknown tool: ${name}`, true);
  }
}

app.post("/mcp", async (c) => {
  let body: JsonRpcRequest;
  try {
    body = (await c.req.json()) as JsonRpcRequest;
  } catch {
    return c.json(rpcError(null, -32700, "Parse error"), 400);
  }

  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return c.json(rpcError(body?.id ?? null, -32600, "Invalid Request"), 400);
  }

  const id = body.id;
  const method = body.method;
  const frontendOrigin = c.get("frontendOrigin");

  // Synthetic request so fair-use always treats MCP as agent-shaped
  const fairUseHeaders = new Headers(c.req.raw.headers);
  if (!fairUseHeaders.get("X-MDViewer-Client")) {
    fairUseHeaders.set("X-MDViewer-Client", "mcp");
  }
  const fairUseRequest = new Request(c.req.url, {
    method: "POST",
    headers: fairUseHeaders,
  });

  if (method === "initialize") {
    const requested =
      typeof body.params?.protocolVersion === "string"
        ? body.params.protocolVersion
        : "";
    const protocolVersion = (PROTOCOL_VERSIONS as readonly string[]).includes(
      requested,
    )
      ? requested
      : "2025-03-26";
    return c.json(
      rpcResult(id, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: "mdviewer-api", version: "2.0.0" },
      }),
    );
  }

  if (method === "notifications/initialized" || method === "notifications/cancelled") {
    return c.body(null, 204);
  }

  if (method === "ping") {
    return c.json(rpcResult(id, {}));
  }

  if (method === "tools/list") {
    return c.json(rpcResult(id, { tools: TOOLS }));
  }

  if (method === "tools/call") {
    const name = String(
      (body.params as { name?: string } | undefined)?.name || "",
    );
    const args =
      ((body.params as { arguments?: Record<string, unknown> } | undefined)
        ?.arguments as Record<string, unknown>) || {};
    if (!name) {
      return c.json(rpcError(id, -32602, "Tool name required"), 400);
    }
    const result = await callTool(
      name,
      args,
      c.env,
      frontendOrigin,
      fairUseRequest,
    );
    return c.json(rpcResult(id, result));
  }

  return c.json(rpcError(id, -32601, `Method not found: ${method}`), 404);
});

app.get("/mcp", (c) =>
  c.json({
    name: "mdviewer-api",
    transport: "streamable-http-jsonrpc",
    endpoint: "POST /mcp",
    tools: TOOLS.map((t) => t.name),
    docs: "/llms-full.txt",
  }),
);

export default app;
