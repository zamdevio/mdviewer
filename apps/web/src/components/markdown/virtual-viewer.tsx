import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { HastDocument } from "./hast-document";
import { MarkdownDocument } from "./viewer";
import { scrollToMarkdownHeading } from "@/lib/markdown/heading-anchors";
import { splitMarkdownChunks } from "@/lib/markdown/split-chunks";
import {
  parseDocumentChunks,
  type ParsedMarkdownChunk,
} from "@/lib/markdown/worker-parser";

/**
 * Virtualized markdown preview for large docs.
 * Chunks are split on h1/h2; hast is parsed off-thread (worker + content-hash cache).
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
  const [chunks, setChunks] = useState<ParsedMarkdownChunk[] | null>(null);
  const [parseFailed, setParseFailed] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ac = new AbortController();
    setParseFailed(false);
    void parseDocumentChunks(content, { signal: ac.signal })
      .then((parsed) => {
        if (ac.signal.aborted) return;
        setChunks(parsed);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setParseFailed(true);
      });
    return () => ac.abort();
  }, [content]);

  const rowCount = chunks?.length ?? 0;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: (index) => {
      const len = chunks?.[index]?.markdown.length ?? 0;
      return Math.min(1200, Math.max(160, Math.ceil(len / 40) * 20));
    },
    overscan: 2,
  });

  const items = virtualizer.getVirtualItems();

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
  }, [content, chunks]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash.length < 2) return;
      scrollToMarkdownHeading(hash, articleRef.current, "smooth");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
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

  if (!chunks) {
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
        position: "relative",
      }}
    >
      {items.map((item) => (
        <div
          key={chunks[item.index]?.hash ?? item.key}
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
          <HastDocument hast={chunks[item.index]!.hast} />
        </div>
      ))}
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
        position: "relative",
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
