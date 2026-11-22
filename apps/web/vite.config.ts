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
const CACHE_VERSION = `v${APP_VERSION.split(".").slice(0, 2).join(".")}`;
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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");

  return {
    plugins: [react(), serviceWorkerPlugin()],
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
      "import.meta.env.VITE_API_URL": JSON.stringify(
        env.VITE_API_URL || env.API_URL || "",
      ),
      "import.meta.env.VITE_FRONTEND_URL": JSON.stringify(
        env.VITE_FRONTEND_URL || env.FRONTEND_URL || "",
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
