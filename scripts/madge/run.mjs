import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** TypeScript app roots checked for import cycles. */
export const MADGE_SCAN_ROOTS = ["apps/web/src", "apps/worker/src"];

const mode = process.argv[2];
if (mode !== "circular" && mode !== "orphans" && mode !== "leaves") {
  console.error("Usage: node scripts/madge/run.mjs <circular|orphans|leaves>");
  process.exit(1);
}

const require = createRequire(import.meta.url);
const madgeCli = require.resolve("madge/bin/cli.js");
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const args = [
  madgeCli,
  `--${mode}`,
  "--extensions",
  "ts,tsx",
  "--ts-config",
  "tsconfig.json",
  ...MADGE_SCAN_ROOTS,
];

const result = spawnSync(process.execPath, args, {
  stdio: "inherit",
  cwd: repoRoot,
});
process.exit(result.status ?? 1);
