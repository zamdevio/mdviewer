export type SearchFailureKind = "password" | "missing" | "other";

/** Map a share lookup failure onto the UI branch it belongs to. */
export function classifySearchError(error: unknown): SearchFailureKind {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? (error as { status?: unknown }).status
      : undefined;
  if (status === 401) return "password";
  if (status === 404) return "missing";
  return "other";
}
