import { ApiRequestError } from "@/lib/api-errors";

/** Remote share already gone (TTL wipe or prior delete). */
export function isRemoteShareGone(error: unknown): boolean {
  return error instanceof ApiRequestError && error.status === 404;
}
