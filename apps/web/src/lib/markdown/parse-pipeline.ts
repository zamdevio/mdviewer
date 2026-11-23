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
import { contentLikelyHasMath } from "./content-signals";

type MarkdownProcessor = ReturnType<typeof createMarkdownProcessor>;

/** Same remark/rehype stack as MarkdownDocument — runs in worker or main. */
export function createMarkdownProcessor(options?: { math?: boolean }) {
  const withMath = options?.math !== false;
  const pipeline = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkEmoji);

  if (withMath) {
    pipeline.use(remarkMath);
  }

  pipeline
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw);

  if (withMath) {
    pipeline.use(rehypeKatex);
  }

  pipeline.use(rehypeSlug).use(rehypeSanitize, sanitizeSchema);
  return pipeline;
}

let sharedWithMath: MarkdownProcessor | null = null;
let sharedNoMath: MarkdownProcessor | null = null;

function processor(math: boolean): MarkdownProcessor {
  if (math) {
    if (!sharedWithMath) sharedWithMath = createMarkdownProcessor({ math: true });
    return sharedWithMath;
  }
  if (!sharedNoMath) sharedNoMath = createMarkdownProcessor({ math: false });
  return sharedNoMath;
}

export function parseMarkdownToHast(markdown: string): Root {
  const math = contentLikelyHasMath(markdown);
  const p = processor(math);
  const tree = p.runSync(p.parse(markdown));
  return tree as Root;
}
