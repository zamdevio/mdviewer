import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../env";
import { FAVICON_SVG } from "../lib/brand";

const app = new OpenAPIHono<{ Bindings: Env }>();

app.get("/favicon.svg", (c) =>
  c.body(FAVICON_SVG, 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  }),
);

app.get("/favicon.ico", (c) => c.redirect("/favicon.svg", 302));

export default app;
