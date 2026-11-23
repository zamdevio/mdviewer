import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { Root } from "hast";
import { useEffect } from "react";
import { ensureKatexCss, MarkdownComponents } from "./viewer";

/** Render a pre-parsed hast tree with the same component map as MarkdownDocument. */
export function HastDocument({ hast }: { hast: Root }) {
  useEffect(() => {
    ensureKatexCss();
  }, []);

  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
    components: MarkdownComponents,
  });
}
