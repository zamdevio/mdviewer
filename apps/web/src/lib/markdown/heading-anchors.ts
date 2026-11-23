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

/** Normalize `#foo` / `foo` for history comparisons. */
export function normalizeMarkdownHash(raw: string): string {
  const id = decodeURIComponent(raw.replace(/^#/, "")).trim();
  return id ? `#${id}` : "";
}

/**
 * Scroll to a heading and record browser history so Back restores the prior hash.
 * Uses pushState (not replaceState) when the hash changes.
 */
export function navigateToMarkdownHeading(
  rawHash: string,
  root: ParentNode | null | undefined,
  behavior: ScrollBehavior = "smooth",
): boolean {
  const ok = scrollToMarkdownHeading(rawHash, root, behavior);
  if (!ok) return false;

  const next = normalizeMarkdownHash(rawHash);
  if (!next) return true;

  try {
    const current = normalizeMarkdownHash(window.location.hash);
    if (current === next) return true;
    history.pushState(null, "", next);
  } catch {
    // sandboxed / opaque origins
  }
  return true;
}

/** Scroll the preview overflow container (or article) back to the top. */
export function scrollMarkdownPreviewToTop(
  root: HTMLElement | null | undefined,
  behavior: ScrollBehavior = "smooth",
): void {
  if (!root) return;
  let node: HTMLElement | null = root.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    const oy = style.overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      node.scrollTo({ top: 0, behavior });
      return;
    }
    node = node.parentElement;
  }
  root.scrollIntoView({ behavior, block: "start" });
}

/**
 * Apply current location.hash to a markdown article (Back/Forward / deep link).
 * Empty hash → top of preview pane.
 */
export function syncMarkdownHeadingFromLocation(
  root: HTMLElement | null | undefined,
  behavior: ScrollBehavior = "smooth",
): void {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) {
    scrollMarkdownPreviewToTop(root, behavior);
    return;
  }
  scrollToMarkdownHeading(hash, root, behavior);
}
