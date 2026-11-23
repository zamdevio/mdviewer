#!/usr/bin/env node
/**
 * Appflare / unified Worker prep: SPA dist + Worker llms embed.
 * Injects VITE_API_URL=/api and VITE_FRONTEND_URL=same-origin (hostname unknown at pack time).
 * Strips Pages `_redirects` from dist — Workers assets already SPA-fallback via wrangler.jsonc.
 */
import { spawnSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function run(label, args, env = process.env) {
  console.log(`[appflare:build] ${label}`);
  const result = spawnSync("pnpm", args, {
    cwd: root,
    stdio: "inherit",
    env,
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("generate worker llms embed", [
  "--filter",
  "@mdviewer/worker",
  "run",
  "generate:llms",
]);

// Same Worker host: SPA at `/`, API at `/api/*` (see scripts/appflare/entry.ts).
run(
  "build SPA (apps/web → dist, VITE_API_URL=/api)",
  ["--filter", "@mdviewer/web", "run", "build"],
  {
    ...process.env,
    VITE_API_URL: "/api",
    VITE_FRONTEND_URL: "same-origin",
  },
);

const distDir = path.join(root, "apps/web/dist");
const distIndex = path.join(distDir, "index.html");
if (!existsSync(distIndex)) {
  console.error(`[appflare:build] missing ${distIndex}`);
  process.exit(1);
}

// public/_redirects is for Cloudflare Pages. On Workers Assets it fights
// not_found_handling: single-page-application → "Infinite loop detected".
const redirects = path.join(distDir, "_redirects");
if (existsSync(redirects)) {
  unlinkSync(redirects);
  console.log("[appflare:build] removed dist/_redirects (Pages-only; Worker SPA via assets)");
}

console.log("[appflare:build] ok — wrangler main: scripts/appflare/entry.ts, assets: apps/web/dist");
