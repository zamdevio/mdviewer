import type { Env } from "../env";

const DEFAULT_RATE_LIMIT_WINDOW = 60;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 10;

export function getClientIP(request: Request): string {
  const cfConnectingIP = request.headers.get("CF-Connecting-IP");
  if (cfConnectingIP) return cfConnectingIP;

  const xForwardedFor = request.headers.get("X-Forwarded-For");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();

  return "unknown";
}

export async function checkRateLimit(
  env: Env,
  ip: string,
  frontendOrigin: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  const rateLimitWindow = env.RATE_LIMIT_WINDOW
    ? parseInt(env.RATE_LIMIT_WINDOW, 10)
    : DEFAULT_RATE_LIMIT_WINDOW;
  const rateLimitMaxRequests = env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10)
    : DEFAULT_RATE_LIMIT_MAX_REQUESTS;

  const id = env.RATE_LIMITER.idFromName(ip);
  const stub = env.RATE_LIMITER.get(id);

  const requestUrl = new URL("https://rate-limiter/check");
  requestUrl.searchParams.set("window", String(rateLimitWindow));
  requestUrl.searchParams.set("maxRequests", String(rateLimitMaxRequests));
  requestUrl.searchParams.set("frontendUrl", frontendOrigin);

  const response = await stub.fetch(
    new Request(requestUrl.toString(), {
      method: "GET",
    }),
  );

  return response.json();
}
