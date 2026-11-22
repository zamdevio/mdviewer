import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "package.json"), "utf8"),
) as { version: string };
const APP_VERSION = pkg.version;
// Full semver so every patch deploy busts SW caches (major.minor left stale Next shells around)
const CACHE_VERSION = `v${APP_VERSION}`;
const SW_PLACEHOLDER = "__MDVIEWER_CACHE_VERSION__";

function readSwTemplate(): string {
  const templatePath = path.resolve(__dirname, "src/pwa/sw.template.js");
  return fs
    .readFileSync(templatePath, "utf8")
    .replaceAll(SW_PLACEHOLDER, CACHE_VERSION);
}

/** Serve / emit service worker with cache version from package.json — never mutates source. */
function serviceWorkerPlugin(): Plugin {
  return {
    name: "mdviewer-service-worker",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/sw.js") {
          next();
          return;
        }
        const body = readSwTemplate();
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(body);
      });
    },
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "sw.js"), readSwTemplate(), "utf8");
    },
  };
}

/**
 * Emit real HTML shells for SPA routes so Pages serves Vite at `/settings` etc.
 * (Old Next left per-path CDN ghosts when those routes were only `_redirects` fallbacks.)
 */
const SPA_HTML_ROUTES = [
  "settings",
  "editor",
  "files",
  "search",
  "shares",
] as const;

function spaHtmlShellsPlugin(): Plugin {
  return {
    name: "mdviewer-spa-html-shells",
    closeBundle() {
      const outDir = path.resolve(__dirname, "dist");
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const html = fs.readFileSync(indexPath, "utf8");
      for (const route of SPA_HTML_ROUTES) {
        const dir = path.join(outDir, route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");

  return {
    plugins: [react(), serviceWorkerPlugin(), spaHtmlShellsPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
    },
    preview: {
      port: 3000,
    },
    define: {
      // Public defaults (not secrets) — match .env.example. Override via env / GH Actions Variables.
      "import.meta.env.VITE_API_URL": JSON.stringify(
        env.VITE_API_URL ||
          env.API_URL ||
          "https://api.mdviewer.zamdev.dev",
      ),
      "import.meta.env.VITE_FRONTEND_URL": JSON.stringify(
        env.VITE_FRONTEND_URL ||
          env.FRONTEND_URL ||
          "https://mdviewer.zamdev.dev",
      ),
      __APP_VERSION__: JSON.stringify(APP_VERSION),
      __CACHE_VERSION__: JSON.stringify(CACHE_VERSION),
    },
    build: {
      outDir: "dist",
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("mermaid")) return "mermaid";
            if (
              id.includes("react-syntax-highlighter") ||
              id.includes("refractor") ||
              id.includes("prismjs")
            ) {
              return "syntax";
            }
            if (
              id.includes("react-dom") ||
              id.includes("/react/") ||
              id.includes("scheduler")
            ) {
              return "react-vendor";
            }
            if (
              id.includes("katex") ||
              id.includes("react-markdown") ||
              id.includes("remark-") ||
              id.includes("rehype-") ||
              id.includes("mdast") ||
              id.includes("unist") ||
              id.includes("micromark") ||
              id.includes("/hast")
            ) {
              return "markdown";
            }
          },
        },
      },
    },
  };
});
