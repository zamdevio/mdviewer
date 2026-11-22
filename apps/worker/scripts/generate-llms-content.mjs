#!/usr/bin/env node
/**
 * Single source of truth: apps/web/public/llms.txt + llms-full.txt
 * → apps/worker/src/lib/llms-content.generated.ts
 *
 * Run: pnpm --filter @mdviewer/worker generate:llms
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workerRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webPublic = resolve(workerRoot, "../web/public");
const outFile = resolve(workerRoot, "src/lib/llms-content.generated.ts");

const llmsTxt = readFileSync(resolve(webPublic, "llms.txt"), "utf8");
const llmsFull = readFileSync(resolve(webPublic, "llms-full.txt"), "utf8");

mkdirSync(dirname(outFile), { recursive: true });

const banner = `/**
 * AUTO-GENERATED — do not edit by hand.
 * Source: apps/web/public/llms.txt + llms-full.txt
 * Regen: pnpm --filter @mdviewer/worker generate:llms
 */
`;

const body = `${banner}export const LLMS_TXT = ${JSON.stringify(llmsTxt)};\n\nexport const LLMS_FULL_TXT = ${JSON.stringify(llmsFull)};\n`;

writeFileSync(outFile, body, "utf8");
console.log(`Wrote ${outFile}`);
