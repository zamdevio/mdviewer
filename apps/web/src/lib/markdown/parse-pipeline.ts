import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeSanitize from "rehype-sanitize";
import type { Root } from "hast";
import { remarkEmoji } from "@/lib/remark-emoji";
import { sanitizeSchema } from "@/components/markdown/html";

/** Same remark/rehype stack as MarkdownDocument — runs in worker or main. */
export function createMarkdownProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkEmoji)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeSanitize, sanitizeSchema);
}

let shared: ReturnType<typeof createMarkdownProcessor> | null = null;

function processor() {
  if (!shared) shared = createMarkdownProcessor();
  return shared;
}

export function parseMarkdownToHast(markdown: string): Root {
  const tree = processor().runSync(processor().parse(markdown));
  return tree as Root;
}
