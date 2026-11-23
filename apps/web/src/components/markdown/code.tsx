import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentProps,
} from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { toast } from "sonner";

/** Collapse long fences so huge blocks don’t dominate the preview. */
export const CODE_COLLAPSE_LINES = 100;

const LazySyntaxHighlighter = lazy(async () => {
  const [{ Prism }, { ghcolors }] = await Promise.all([
    import("react-syntax-highlighter"),
    import("react-syntax-highlighter/dist/esm/styles/prism"),
  ]);
  return {
    default: function Highlighter(
      props: ComponentProps<typeof Prism> & { lightStyle?: typeof ghcolors },
    ) {
      const { lightStyle: _unused, style, ...rest } = props;
      void _unused;
      return <Prism style={style ?? ghcolors} {...rest} />;
    },
  };
});

// GitHub Dark theme colors
const githubDarkTheme: Record<string, CSSProperties> = {
  'code[class*="language-"]': {
    color: "#c9d1d9",
    background: "#161b22",
    textShadow: "none",
  },
  'pre[class*="language-"]': {
    color: "#c9d1d9",
    background: "#161b22",
    textShadow: "none",
    padding: "16px",
    overflow: "auto",
    fontSize: "85%",
    lineHeight: "1.45",
    borderRadius: "6px",
  },
  comment: { color: "#8b949e", fontStyle: "italic" },
  prolog: { color: "#8b949e" },
  doctype: { color: "#8b949e" },
  cdata: { color: "#8b949e" },
  punctuation: { color: "#c9d1d9" },
  property: { color: "#79c0ff" },
  tag: { color: "#ff7b72" },
  boolean: { color: "#79c0ff" },
  number: { color: "#79c0ff" },
  constant: { color: "#79c0ff" },
  symbol: { color: "#ff7b72" },
  deleted: { color: "#ffdcd7", backgroundColor: "rgba(248,81,73,0.15)" },
  selector: { color: "#79c0ff" },
  "attr-name": { color: "#79c0ff" },
  string: { color: "#a5d6ff" },
  char: { color: "#a5d6ff" },
  builtin: { color: "#ffa657" },
  inserted: { color: "#7ee787", backgroundColor: "rgba(46,160,67,0.15)" },
  operator: { color: "#ff7b72" },
  entity: { color: "#79c0ff", cursor: "help" },
  url: { color: "#58a6ff" },
  "attr-value": { color: "#a5d6ff" },
  keyword: { color: "#ff7b72" },
  function: { color: "#d2a8ff" },
  "class-name": { color: "#ffa657" },
  regex: { color: "#a5d6ff" },
  important: { color: "#79c0ff", fontWeight: "bold" },
  "template-string": { color: "#a5d6ff" },
};

interface CodeBlockProps {
  language: string;
  code: string;
}

function detectLanguageFromCode(code: string): string {
  const firstLine = code.split("\n")[0]?.trim() || "";

  const languagePatterns = [
    { pattern: /^\/\/\s*(typescript|ts)(\s|$|:)/i, lang: "typescript" },
    { pattern: /^\/\/\s*(javascript|js)(\s|$|:)/i, lang: "javascript" },
    { pattern: /^\/\/\s*(python|py)(\s|$|:)/i, lang: "python" },
    { pattern: /^\/\/\s*(java)(\s|$|:)/i, lang: "java" },
    { pattern: /^\/\/\s*(c\+\+|cpp)(\s|$|:)/i, lang: "cpp" },
    { pattern: /^\/\/\s*(c#|csharp|cs)(\s|$|:)/i, lang: "csharp" },
    { pattern: /^\/\/\s*(go|golang)(\s|$|:)/i, lang: "go" },
    { pattern: /^\/\/\s*(rust|rs)(\s|$|:)/i, lang: "rust" },
    { pattern: /^\/\/\s*(php)(\s|$|:)/i, lang: "php" },
    { pattern: /^\/\/\s*(ruby|rb)(\s|$|:)/i, lang: "ruby" },
    { pattern: /^\/\/\s*(swift)(\s|$|:)/i, lang: "swift" },
    { pattern: /^\/\/\s*(kotlin|kt)(\s|$|:)/i, lang: "kotlin" },
    { pattern: /^#\s*(python|py)(\s|$|:)/i, lang: "python" },
    { pattern: /^#\s*(bash|sh|shell)(\s|$|:)/i, lang: "bash" },
    { pattern: /^#\s*(ruby|rb)(\s|$|:)/i, lang: "ruby" },
    { pattern: /^\/\*\s*(typescript|ts)(\s|$|:)/i, lang: "typescript" },
    { pattern: /^\/\*\s*(javascript|js)(\s|$|:)/i, lang: "javascript" },
  ];

  for (const { pattern, lang } of languagePatterns) {
    if (pattern.test(firstLine)) return lang;
  }

  if (
    code.includes("interface ") ||
    code.includes(": string") ||
    code.includes(": number") ||
    code.includes("type ") ||
    code.includes(" as ") ||
    code.includes("enum ")
  ) {
    return "typescript";
  }

  if (
    code.includes("function ") ||
    code.includes("const ") ||
    code.includes("let ") ||
    code.includes("var ") ||
    code.includes("=>") ||
    code.includes("export ")
  ) {
    return "javascript";
  }

  if (
    code.includes("def ") ||
    code.includes("import ") ||
    code.includes("print(") ||
    code.includes("if __name__") ||
    code.includes("lambda ")
  ) {
    return "python";
  }

  if (
    code.includes("<html") ||
    code.includes("<!DOCTYPE") ||
    code.includes("<div") ||
    code.includes("<span") ||
    code.includes("<?xml")
  ) {
    return "markup";
  }

  if (
    code.includes("{") &&
    code.includes("}") &&
    (code.includes(":") || code.includes("@media"))
  ) {
    return "css";
  }

  if (
    (code.trim().startsWith("{") && code.trim().endsWith("}")) ||
    (code.trim().startsWith("[") && code.trim().endsWith("]"))
  ) {
    try {
      JSON.parse(code);
      return "json";
    } catch {
      /* not json */
    }
  }

  return "text";
}

function PlainPre({
  code,
  dark,
  maxLines,
}: {
  code: string;
  dark: boolean;
  maxLines?: number;
}) {
  const text =
    maxLines != null
      ? code.split("\n").slice(0, maxLines).join("\n") +
        (code.split("\n").length > maxLines ? "\n…" : "")
      : code;
  return (
    <pre
      className="m-0 rounded-md overflow-auto text-sm border p-4 pt-12"
      style={{
        backgroundColor: dark ? "#161b22" : "#f6f8fa",
        borderColor: dark ? "#30363d" : "#d0d7de",
      }}
    >
      <code>{text}</code>
    </pre>
  );
}

/**
 * Code block with copy, optional collapse (>100 lines), and highlight only when near viewport.
 */
export function MarkdownCodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [inView, setInView] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const codeContent = code || "";
  const lineCount = codeContent === "" ? 0 : codeContent.split("\n").length;
  const collapsible = lineCount > CODE_COLLAPSE_LINES;
  const showCollapsed = collapsible && !expanded;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(
        "Failed to copy code: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  const hasExplicitLanguage =
    language && language.trim() !== "" && language.toLowerCase() !== "text";
  const detectedLanguage = hasExplicitLanguage
    ? ""
    : detectLanguageFromCode(codeContent);
  const finalLanguage = hasExplicitLanguage ? language : detectedLanguage;
  const hasLanguage =
    hasExplicitLanguage || (detectedLanguage && detectedLanguage !== "text");
  const lang = finalLanguage || "text";

  const displayCode = showCollapsed
    ? codeContent.split("\n").slice(0, CODE_COLLAPSE_LINES).join("\n")
    : codeContent;

  return (
    <div ref={hostRef} className="relative group my-4">
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
        {hasLanguage && (
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-background/80 backdrop-blur-sm border rounded pointer-events-auto">
            {lang}
            {collapsible ? (
              <span className="ml-1 opacity-70">· {lineCount} lines</span>
            ) : null}
          </div>
        )}
        <div className="ml-auto flex items-center gap-1 pointer-events-auto">
          {collapsible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="h-8 px-2 bg-background/80 backdrop-blur-sm border gap-1"
              title={expanded ? "Collapse code" : "Expand code"}
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              <span className="text-xs hidden sm:inline">
                {expanded ? "Collapse" : "Expand"}
              </span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-2 bg-background/80 backdrop-blur-sm border"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {!inView ? (
        <PlainPre code={displayCode} dark={dark} />
      ) : (
        <Suspense fallback={<PlainPre code={displayCode} dark={dark} />}>
          <LazySyntaxHighlighter
            style={dark ? githubDarkTheme : undefined}
            language={lang}
            PreTag="div"
            customStyle={{
              margin: 0,
              borderRadius: "6px",
              backgroundColor: dark ? "#161b22" : "#f6f8fa",
              padding: "16px",
              paddingTop: "48px",
              fontSize: "14px",
              lineHeight: "1.45",
              overflow: "auto",
              maxHeight: showCollapsed ? "28rem" : undefined,
              border: dark ? "1px solid #30363d" : "1px solid #d0d7de",
            }}
            codeTagProps={{
              style: {
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
              },
            }}
          >
            {displayCode}
          </LazySyntaxHighlighter>
        </Suspense>
      )}
    </div>
  );
}
