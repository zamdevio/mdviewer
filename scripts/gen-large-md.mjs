#!/usr/bin/env node
/**
 * Generate a large markdown fixture for local stress (not committed).
 *
 *   node scripts/gen-large-md.mjs --mb 2
 *   node scripts/gen-large-md.mjs --mb 5 --out /tmp/mdviewer-5mb.md
 *
 * Honest product claim remains ~2MB virtualized preview (machine-dependent).
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

function parseArgs(argv) {
  let mb = 2;
  let out = "";
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--mb" && argv[i + 1]) {
      mb = Number(argv[++i]);
    } else if (a === "--out" && argv[i + 1]) {
      out = argv[++i];
    } else if (a === "--help" || a === "-h") {
      console.log("Usage: node scripts/gen-large-md.mjs --mb <n> [--out path]");
      process.exit(0);
    }
  }
  if (!Number.isFinite(mb) || mb <= 0) {
    console.error("Invalid --mb");
    process.exit(1);
  }
  return { mb, out: out || resolve(process.cwd(), `large-${mb}mb.md`) };
}

const { mb, out } = parseArgs(process.argv);
const target = Math.floor(mb * 1024 * 1024);

const parts = [];
parts.push(`# Large fixture (~${mb} MB)\n\n`);
parts.push("## Contents\n\n");
const sectionCount = Math.max(20, Math.floor(mb * 30));
for (let i = 1; i <= sectionCount; i++) {
  parts.push(`- [Section ${i}](#section-${i})\n`);
}
parts.push("\n");

const filler =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(40) + "\n\n";

let size = parts.join("").length;
let i = 1;
while (size < target) {
  const block = `## Section ${i}\n\n${filler}${filler}`;
  parts.push(block);
  size += block.length;
  i += 1;
  if (i > sectionCount * 50) break;
}

const body = parts.join("");
writeFileSync(out, body, "utf8");
console.log(
  JSON.stringify(
    { out, bytes: Buffer.byteLength(body), mb: +(Buffer.byteLength(body) / (1024 * 1024)).toFixed(2) },
    null,
    2,
  ),
);
