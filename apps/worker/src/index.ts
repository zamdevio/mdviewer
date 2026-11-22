import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { Env } from "./env";
import { parseAllowedOrigins, resolveRequestOrigins } from "./lib/origins";
import { sweepExpiredShares } from "./lib/share-store";
import health from "./routes/health";
import compatibility from "./routes/compatibility";
import upload from "./routes/upload";
import share from "./routes/share";
import brand from "./routes/brand";
import llms from "./routes/llms";
import mcp from "./routes/mcp";

export { RateLimiter } from "./rate-limiter";

const CORS_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";
const CORS_HEADERS =
  "Content-Type, X-Share-Password, X-Share-TTL-Seconds, X-Share-View-Protected, X-Share-Type, X-Share-Filename, X-MDViewer-Client";
const CORS_EXPOSE =
  "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After, X-Expires-At, X-Content-Size, X-Uploaded-At, X-Share-Filename, X-Share-Legacy";

const app = new OpenAPIHono<{
  Bindings: Env;
  Variables: { corsOrigin: string; frontendOrigin: string };
}>();

app.use("*", async (c, next) => {
  const allowedOrigins = parseAllowedOrigins(c.env);
  if (allowedOrigins.length === 0) {
    return c.json(
      {
        error: "Configuration error",
        message:
          "ALLOWED_ORIGINS environment variable is not set or invalid. Configure it in wrangler.jsonc.",
      },
      500,
    );
  }

  const { frontendOrigin, corsOrigin } = resolveRequestOrigins(
    c.req.raw,
    allowedOrigins,
  );
  c.set("frontendOrigin", frontendOrigin);
  c.set("corsOrigin", corsOrigin);

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": CORS_METHODS,
        "Access-Control-Allow-Headers": CORS_HEADERS,
        "Access-Control-Expose-Headers": CORS_EXPOSE,
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  await next();

  c.res.headers.set("Access-Control-Allow-Origin", corsOrigin);
  c.res.headers.set("Access-Control-Allow-Methods", CORS_METHODS);
  c.res.headers.set("Access-Control-Allow-Headers", CORS_HEADERS);
  c.res.headers.set("Access-Control-Expose-Headers", CORS_EXPOSE);
});

app.route("/", health);
app.route("/", compatibility);
app.route("/", brand);
app.route("/", upload);
app.route("/", share);
app.route("/", llms);
app.route("/", mcp);

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "MDViewer API",
    version: "2.0.0",
    description:
      "Edge API for sharing markdown via Cloudflare Workers + R2. Protocol 2: prefix layout, fixed TTL, optional password / viewProtected, fair-use (IP+UA). Uploads fair-use limited; downloads unlimited.",
  },
  tags: [
    { name: "System", description: "Health, compatibility handshake, and ops" },
    { name: "Share", description: "Upload, retrieve, update, and delete shared content" },
  ],
});

app.get("/docs", swaggerUI({ url: "/openapi.json" }));

app.notFound((c) => c.json({ error: "Not found" }, 404));

const worker = {
  fetch: app.fetch,
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) {
    ctx.waitUntil(
      sweepExpiredShares(env).then((result) => {
        console.log(`TTL sweep deleted ${result.deleted} expired share(s)`);
      }),
    );
  },
};

export default worker;
