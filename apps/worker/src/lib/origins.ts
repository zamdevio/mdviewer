import type { Env } from "../env";

/**
 * Parse ALLOWED_ORIGINS. Drops empty / unexpanded Appflare placeholders (`{{appUrl}}`)
 * so a half-applied install does not poison the allowlist.
 */
export function parseAllowedOrigins(env: Env): string[] {
  if (!env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.trim() === "") {
    return [];
  }

  return env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .filter((origin) => !origin.includes("{{"))
    .map((origin) => {
      try {
        const url = new URL(origin.startsWith("http") ? origin : `https://${origin}`);
        return url.origin;
      } catch {
        return null;
      }
    })
    .filter((origin): origin is string => origin !== null);
}

/**
 * Effective allowlist for this request: configured origins + this Worker’s own
 * origin. Unified Appflare installs (SPA + `/api` on one host) always work
 * same-origin even if ALLOWED_ORIGINS is stale localhost or still `{{appUrl}}`.
 */
export function effectiveAllowedOrigins(env: Env, request: Request): string[] {
  const configured = parseAllowedOrigins(env);
  const self = new URL(request.url).origin;
  if (!configured.includes(self)) {
    return [...configured, self];
  }
  return configured;
}

export function resolveRequestOrigins(
  request: Request,
  allowedOrigins: string[],
): { frontendOrigin: string; corsOrigin: string } {
  const self = new URL(request.url).origin;
  const requestOrigin = request.headers.get("Origin");

  // Same-origin SPA ↔ API (Appflare unified Worker) — always prefer the page origin.
  if (requestOrigin && requestOrigin === self) {
    return { frontendOrigin: requestOrigin, corsOrigin: requestOrigin };
  }

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return { frontendOrigin: requestOrigin, corsOrigin: requestOrigin };
  }

  // curl / server-side: prefer allowlist entry, else this Worker (share links on this host).
  const fallback =
    allowedOrigins.find((o) => o !== self) ?? allowedOrigins[0] ?? self;

  return { frontendOrigin: fallback, corsOrigin: fallback };
}
