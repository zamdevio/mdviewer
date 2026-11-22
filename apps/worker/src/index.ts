import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import type { Env } from "./env";
import { parseAllowedOrigins, resolveRequestOrigins } from "./lib/origins";
import health from "./routes/health";
import compatibility from "./routes/compatibility";
import upload from "./routes/upload";
import share from "./routes/share";

export { RateLimiter } from "./rate-limiter";

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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  await next();

  c.res.headers.set("Access-Control-Allow-Origin", corsOrigin);
  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type");
});

app.route("/", health);
app.route("/", compatibility);
app.route("/", upload);
app.route("/", share);

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "MDViewer API",
    version: "1.0.0",
    description:
      "Edge API for sharing markdown and text via Cloudflare Workers + R2. Uploads are rate-limited; downloads are unlimited.",
  },
  tags: [
    { name: "System", description: "Health, compatibility handshake, and ops" },
    { name: "Share", description: "Upload and retrieve shared content" },
  ],
});

app.get("/docs", swaggerUI({ url: "/openapi.json" }));

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
