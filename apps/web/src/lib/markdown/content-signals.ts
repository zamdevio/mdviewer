/** Cheap heuristics so we can skip heavy remark/rehype plugins per chunk/doc. */

export function contentLikelyHasMath(content: string): boolean {
  if (!content) return false;
  if (
    !content.includes("$") &&
    !content.includes("\\(") &&
    !content.includes("\\[")
  ) {
    return false;
  }
  return /\$\$[\s\S]+?\$\$|\$[^$\n]+\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\]/.test(
    content,
  );
}
