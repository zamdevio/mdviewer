import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { HastDocument } from "./hast-document";
import { MarkdownDocument } from "./viewer";
import {
  scrollToMarkdownHeading,
  syncMarkdownHeadingFromLocation,
} from "@/lib/markdown/heading-anchors";
import { splitMarkdownChunks } from "@/lib/markdown/split-chunks";
import {
  chunkNeedsParse,
  ensureChunkHasts,
  mergePlansKeepStale,
  planDocumentChunks,
  type ChunkPlan,
} from "@/lib/markdown/worker-parser";

const INITIAL_PARSE_COUNT = 6;

/**
 * Virtualized markdown preview for large docs.
 * Splits immediately; parses near-viewport chunks via worker + content-hash cache.
 * Keeps prior hast on-screen while a chunk re-parses so edits don’t flicker blank.
 */
export function VirtualMarkdownViewer({
  content,
  className = "",
  scrollElement,
}: {
  content: string;
  className?: string;
  /** Overflow container that scrolls the preview (PreviewSection / share pane). */
  scrollElement: HTMLElement | null;
}) {
  const [plans, setPlans] = useState<ChunkPlan[]>(() => planDocumentChunks(content));
  const [parseFailed, setParseFailed] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const plansRef = useRef(plans);
  plansRef.current = plans;
  const contentGen = useRef(0);

  // Resplit when content changes; keep stale hast until fresh parse lands
  useEffect(() => {
    const gen = ++contentGen.current;
    const planned = planDocumentChunks(content);
    setPlans((prev) => mergePlansKeepStale(prev, planned));
    setParseFailed(false);
    const ac = new AbortController();
    const initial = Math.min(INITIAL_PARSE_COUNT, planned.length);
    const indices = Array.from({ length: initial }, (_, i) => i).filter((i) =>
      chunkNeedsParse(planned[i]!),
    );
    if (indices.length === 0) return () => ac.abort();

    void ensureChunkHasts(planned, indices, { signal: ac.signal })
      .then((filled) => {
        if (ac.signal.aborted || gen !== contentGen.current) return;
        setPlans(filled);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || gen !== contentGen.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setParseFailed(true);
      });
    return () => ac.abort();
  }, [content]);

  const virtualizer = useVirtualizer({
    count: plans.length,
    getScrollElement: () => scrollElement,
    estimateSize: (index) => {
      const len = plans[index]?.markdown.length ?? 0;
      return Math.min(1200, Math.max(160, Math.ceil(len / 40) * 20));
    },
    overscan: 2,
  });

  const items = virtualizer.getVirtualItems();
  const visibleKey = useMemo(
    () => items.map((i) => i.index).join(","),
    [items],
  );

  // Lazy-parse visible + overscan as user scrolls
  useEffect(() => {
    if (parseFailed || plans.length === 0) return;
    const indices = items.map((i) => i.index);
    if (indices.length === 0) return;
    const needs = indices.some((i) => {
      const plan = plansRef.current[i];
      return plan ? chunkNeedsParse(plan) : false;
    });
    if (!needs) return;

    const gen = contentGen.current;
    const ac = new AbortController();
    void ensureChunkHasts(plansRef.current, indices, { signal: ac.signal })
      .then((filled) => {
        if (ac.signal.aborted || gen !== contentGen.current) return;
        setPlans(filled);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || gen !== contentGen.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
      });
    return () => ac.abort();
    // visibleKey tracks scroll window; plans.length for resplit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey, plans.length, parseFailed]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      scrollToMarkdownHeading(hash, articleRef.current, "smooth");
    };
    const id = requestAnimationFrame(() => requestAnimationFrame(run));
    const t = window.setTimeout(run, 120);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
      window.clearTimeout(t);
    };
  }, [content, plans]);

  useEffect(() => {
    const sync = () => {
      syncMarkdownHeadingFromLocation(articleRef.current, "smooth");
    };
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  if (parseFailed) {
    return (
      <FallbackVirtualMarkdown
        content={content}
        className={className}
        scrollElement={scrollElement}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <article ref={articleRef} className={`markdown-body ${className}`}>
        <p className="text-sm text-muted-foreground">Parsing preview…</p>
      </article>
    );
  }

  return (
    <article
      ref={articleRef}
      className={`markdown-body ${className}`}
      style={{
        height: virtualizer.getTotalSize(),
        width: "100%",
        maxWidth: "100%",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {items.map((item) => {
        const plan = plans[item.index];
        return (
          <div
            key={item.index}
            data-index={item.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${item.start}px)`,
            }}
          >
            {plan?.hast ? (
              <HastDocument hast={plan.hast} />
            ) : (
              <p className="text-xs text-muted-foreground py-4">Loading section…</p>
            )}
          </div>
        );
      })}
    </article>
  );
}

/** Sync split + ReactMarkdown if worker path blows up. */
function FallbackVirtualMarkdown({
  content,
  className,
  scrollElement,
}: {
  content: string;
  className: string;
  scrollElement: HTMLElement | null;
}) {
  const parts = splitMarkdownChunks(content);
  const articleRef = useRef<HTMLElement>(null);
  const virtualizer = useVirtualizer({
    count: parts.length,
    getScrollElement: () => scrollElement,
    estimateSize: (index) => {
      const len = parts[index]?.length ?? 0;
      return Math.min(1200, Math.max(160, Math.ceil(len / 40) * 20));
    },
    overscan: 2,
  });
  const items = virtualizer.getVirtualItems();

  return (
    <article
      ref={articleRef}
      className={`markdown-body ${className}`}
      style={{
        height: virtualizer.getTotalSize(),
        width: "100%",
        maxWidth: "100%",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {items.map((item) => (
        <div
          key={item.key}
          data-index={item.index}
          ref={virtualizer.measureElement}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${item.start}px)`,
          }}
        >
          <MarkdownDocument content={parts[item.index] ?? ""} />
        </div>
      ))}
    </article>
  );
}
