/**
 * Resolve in-doc fragment links (#heading) against markdown preview headings.
 * rehype-sanitize prefixes ids with `user-content-` (GitHub-style); try both.
 * Duplicate headings: rehype-slug keeps the first as bare id — `#x` hits the upper one.
 */

const CLOBBER_PREFIX = "user-content-";

export function resolveHeadingElement(
  rawHash: string,
  root: ParentNode | null | undefined,
): Element | null {
  const scope = root ?? document;
  const id = decodeURIComponent(rawHash.replace(/^#/, "")).trim();
  if (!id) return null;

  const candidates = id.startsWith(CLOBBER_PREFIX)
    ? [id, id.slice(CLOBBER_PREFIX.length)]
    : [id, `${CLOBBER_PREFIX}${id}`];

  for (const candidate of candidates) {
    try {
      const el = scope.querySelector(`#${CSS.escape(candidate)}`);
      if (el) return el;
    } catch {
      // invalid selector id — skip
    }
  }
  return null;
}

export function scrollToMarkdownHeading(
  rawHash: string,
  root: ParentNode | null | undefined,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const el = resolveHeadingElement(rawHash, root);
  if (!el) return false;
  el.scrollIntoView({ behavior, block: "start" });
  return true;
}
