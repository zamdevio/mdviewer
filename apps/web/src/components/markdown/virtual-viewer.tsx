import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { MarkdownDocument } from "./viewer";
import { splitMarkdownChunks } from "@/lib/markdown/split-chunks";
import { scrollToMarkdownHeading } from "@/lib/markdown/heading-anchors";

/**
 * Virtualized markdown preview for large docs.
 * One article wraps measured chunk rows; only near-viewport chunks mount.
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
  const chunks = splitMarkdownChunks(content);
  const articleRef = useRef<HTMLElement>(null);

  const virtualizer = useVirtualizer({
    count: chunks.length,
    getScrollElement: () => scrollElement,
    estimateSize: (index) => {
      const len = chunks[index]?.length ?? 0;
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
  }, [content]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (!hash || hash.length < 2) return;
      scrollToMarkdownHeading(hash, articleRef.current, "smooth");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

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
          <MarkdownDocument content={chunks[item.index] ?? ""} />
        </div>
      ))}
    </article>
  );
}
