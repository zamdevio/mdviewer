import type { Env } from "../env";

export function parseAllowedOrigins(env: Env): string[] {
  if (!env.ALLOWED_ORIGINS || env.ALLOWED_ORIGINS.trim() === "") {
    return [];
  }

  return env.ALLOWED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
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

export function resolveRequestOrigins(
  request: Request,
  allowedOrigins: string[],
): { frontendOrigin: string; corsOrigin: string } {
  const requestOrigin = request.headers.get("Origin");
  const frontendOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0];
  const corsOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0];

  return { frontendOrigin, corsOrigin };
}
