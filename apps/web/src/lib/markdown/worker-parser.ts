import type { Root } from "hast";
import { splitMarkdownChunks } from "./split-chunks";
import { hashChunkMarkdown } from "./chunk-hash";
import { chunkHastCache } from "./chunk-cache";
import { parseMarkdownToHast } from "./parse-pipeline";
import type { WorkerParseRequest, WorkerParseResponse } from "./parser.worker";

export type ParsedMarkdownChunk = {
  hash: string;
  markdown: string;
  hast: Root;
};

export type ChunkPlan = {
  hash: string;
  markdown: string;
  hast: Root | null;
};

let worker: Worker | null = null;
let workerFailed = false;
let nextRequestId = 1;

function getWorker(): Worker | null {
  if (workerFailed) return null;
  if (typeof Worker === "undefined") {
    workerFailed = true;
    return null;
  }
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./parser.worker.ts", import.meta.url), {
      type: "module",
    });
    return worker;
  } catch {
    workerFailed = true;
    worker = null;
    return null;
  }
}

function parseChunksSync(markdowns: { id: string; markdown: string }[]): {
  id: string;
  hast: Root;
}[] {
  return markdowns.map(({ id, markdown }) => ({
    id,
    hast: parseMarkdownToHast(markdown),
  }));
}

function parseChunksViaWorker(
  chunks: { id: string; markdown: string }[],
): Promise<{ id: string; hast: Root }[]> {
  const w = getWorker();
  if (!w) return Promise.resolve(parseChunksSync(chunks));

  const requestId = nextRequestId++;
  const request: WorkerParseRequest = { requestId, chunks };

  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<WorkerParseResponse>) => {
      const data = event.data;
      if (data.requestId !== requestId) return;
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      if (!data.ok) {
        reject(new Error(data.error));
        return;
      }
      resolve(data.results);
    };
    const onError = (err: ErrorEvent) => {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
      workerFailed = true;
      reject(err.error ?? new Error(err.message || "markdown worker failed"));
    };
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.postMessage(request);
  });
}

/** Split + content-hash; fill hast from LRU when available (no worker yet). */
export function planDocumentChunks(content: string): ChunkPlan[] {
  return splitMarkdownChunks(content).map((markdown) => {
    const hash = hashChunkMarkdown(markdown);
    const hit = chunkHastCache.get(hash);
    return { hash, markdown, hast: hit ?? null };
  });
}

/**
 * Ensure the given plan indices have hast (worker for misses). Returns a new array.
 */
export async function ensureChunkHasts(
  plans: ChunkPlan[],
  indices: number[],
  options?: { signal?: AbortSignal },
): Promise<ChunkPlan[]> {
  const next = plans.map((p) => ({ ...p }));
  const unique = [...new Set(indices)].filter(
    (i) => i >= 0 && i < next.length && next[i] && !next[i]!.hast,
  );
  if (unique.length === 0) return next;

  if (options?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const misses = unique.map((index) => ({
    index,
    id: String(index),
    markdown: next[index]!.markdown,
    hash: next[index]!.hash,
  }));

  let results: { id: string; hast: Root }[];
  try {
    results = await parseChunksViaWorker(
      misses.map(({ id, markdown }) => ({ id, markdown })),
    );
  } catch {
    results = parseChunksSync(misses.map(({ id, markdown }) => ({ id, markdown })));
  }

  if (options?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const byId = new Map(results.map((r) => [r.id, r.hast]));
  for (const miss of misses) {
    const hast = byId.get(miss.id);
    if (!hast) continue;
    chunkHastCache.set(miss.hash, hast);
    next[miss.index] = { hash: miss.hash, markdown: miss.markdown, hast };
  }
  return next;
}

/**
 * Split markdown, reuse content-hashed hast from LRU, parse all misses (worker when available).
 */
export async function parseDocumentChunks(
  content: string,
  options?: { signal?: AbortSignal },
): Promise<ParsedMarkdownChunk[]> {
  const planned = planDocumentChunks(content);
  const indices = planned.map((_, i) => i);
  const filled = await ensureChunkHasts(planned, indices, options);
  return filled.map((c, i) => {
    if (c.hast) return { hash: c.hash, markdown: c.markdown, hast: c.hast };
    const hast = parseMarkdownToHast(c.markdown);
    chunkHastCache.set(c.hash, hast);
    return { hash: c.hash, markdown: c.markdown, hast };
  });
}
