/// <reference lib="webworker" />
import { parseMarkdownToHast } from "./parse-pipeline";

export type WorkerParseRequest = {
  requestId: number;
  chunks: { id: string; markdown: string }[];
};

export type WorkerParseResponse =
  | {
      requestId: number;
      ok: true;
      results: { id: string; hast: ReturnType<typeof parseMarkdownToHast> }[];
    }
  | { requestId: number; ok: false; error: string };

self.onmessage = (event: MessageEvent<WorkerParseRequest>) => {
  const { requestId, chunks } = event.data;
  try {
    const results = chunks.map(({ id, markdown }) => ({
      id,
      hast: parseMarkdownToHast(markdown),
    }));
    const response: WorkerParseResponse = { requestId, ok: true, results };
    self.postMessage(response);
  } catch (err) {
    const response: WorkerParseResponse = {
      requestId,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
