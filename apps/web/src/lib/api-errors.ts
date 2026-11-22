export type ApiFailureKind = "cors" | "network" | "http";

export class ApiRequestError extends Error {
  readonly kind: ApiFailureKind;
  readonly status?: number;

  constructor(kind: ApiFailureKind, message: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.kind = kind;
    this.status = status;
  }
}

export function isCorsFailure(error: unknown): boolean {
  return error instanceof ApiRequestError && error.kind === "cors";
}

/**
 * Distinguish CORS block vs unreachable host.
 * CORS often surfaces as TypeError("Failed to fetch") while the server is up —
 * a follow-up `no-cors` request that resolves means the origin is reachable but blocked.
 */
export async function classifyFetchFailure(
  url: string,
  timeoutMs = 3000
): Promise<"cors" | "network"> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-cache",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    // Opaque success → host answered; original failure was almost certainly CORS.
    return "cors";
  } catch {
    return "network";
  }
}

export async function probeApiHealth(
  healthUrl: string,
  timeoutMs = 3000
): Promise<"ok" | "cors" | "down"> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(healthUrl, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response.ok ? "ok" : "down";
  } catch {
    return (await classifyFetchFailure(healthUrl, timeoutMs)) === "cors"
      ? "cors"
      : "down";
  }
}
