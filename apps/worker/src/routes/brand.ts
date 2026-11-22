import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../env";
import { FAVICON_SVG, faviconPng128Bytes } from "../lib/brand";

const app = new OpenAPIHono<{ Bindings: Env }>();

app.get("/favicon.svg", (c) =>
  c.body(FAVICON_SVG, 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  }),
);

app.get("/favicon.png", (c) =>
  c.body(faviconPng128Bytes(), 200, {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=86400",
  }),
);

app.get("/favicon.ico", (c) => c.redirect("/favicon.png", 302));

export default app;
