/** Worker rotate-manage failure codes that mean the share is dead locally. */
export const ROTATE_TOMBSTONE_ERRORS = new Set(["not_found", "expired"]);

export type RotateFail = { id: string; error: string };

export function isRotateTombstone(error: string): boolean {
  return ROTATE_TOMBSTONE_ERRORS.has(error);
}

/**
 * Persist the new manage token after rotate when:
 * - at least one share was re-keyed (those hashes already expect the new token), or
 * - every failure is a tombstone / there were no failures (safe token change with no live leftovers).
 *
 * `unauthorized` means that id never matched the old token — does not block commit if others updated.
 */
export function shouldPersistNewManageToken(
  updated: string[],
  failed: RotateFail[],
): boolean {
  if (updated.length > 0) return true;
  return failed.every((f) => isRotateTombstone(f.error));
}

export function partitionRotateFails(failed: RotateFail[]): {
  tombstones: RotateFail[];
  live: RotateFail[];
} {
  const tombstones: RotateFail[] = [];
  const live: RotateFail[] = [];
  for (const f of failed) {
    if (isRotateTombstone(f.error)) tombstones.push(f);
    else live.push(f);
  }
  return { tombstones, live };
}
