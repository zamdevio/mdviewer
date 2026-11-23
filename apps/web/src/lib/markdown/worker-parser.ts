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

/**
 * Split markdown, reuse content-hashed hast from LRU, parse misses (worker when available).
 */
export async function parseDocumentChunks(
  content: string,
  options?: { signal?: AbortSignal },
): Promise<ParsedMarkdownChunk[]> {
  const parts = splitMarkdownChunks(content);
  const planned = parts.map((markdown) => ({
    hash: hashChunkMarkdown(markdown),
    markdown,
  }));

  const ordered: (ParsedMarkdownChunk | null)[] = planned.map(({ hash, markdown }) => {
    const hit = chunkHastCache.get(hash);
    if (hit) return { hash, markdown, hast: hit };
    return null;
  });

  const misses: { index: number; id: string; markdown: string; hash: string }[] = [];
  for (let i = 0; i < planned.length; i++) {
    if (ordered[i]) continue;
    const { hash, markdown } = planned[i]!;
    misses.push({ index: i, id: String(i), markdown, hash });
  }

  if (misses.length === 0) {
    return ordered as ParsedMarkdownChunk[];
  }

  if (options?.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

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
    ordered[miss.index] = { hash: miss.hash, markdown: miss.markdown, hast };
  }

  return ordered.map((c, i) => {
    if (c) return c;
    // Should not happen; sync fallback for safety
    const { hash, markdown } = planned[i]!;
    const hast = parseMarkdownToHast(markdown);
    chunkHastCache.set(hash, hast);
    return { hash, markdown, hast };
  });
}
