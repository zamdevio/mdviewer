import type { Env } from "../env";
import {
  FAIR_USE_AGENT_MAX_REQUESTS,
  FAIR_USE_MAX_REQUESTS,
  FAIR_USE_WINDOW_SECONDS,
} from "./config";
import { getClientIP } from "./rate-limit";

/** Fingerprint for fair-use DO: IP + UA (+ optional CF). Not an account. */
export function getFairUseFingerprint(request: Request): string {
  const ip = getClientIP(request);
  const ua = (request.headers.get("User-Agent") || "").slice(0, 160);
  const country = request.headers.get("CF-IPCountry") || "";
  return `${ip}\n${ua}\n${country}`;
}

export function isAgentShapedRequest(request: Request): boolean {
  if (request.headers.get("X-MDViewer-Client")?.toLowerCase() === "mcp") {
    return true;
  }
  const ua = (request.headers.get("User-Agent") || "").toLowerCase();
  return /(?:bot|crawler|spider|mcp|curl\/|wget|python-requests|httpie|go-http-client|libwww)/i.test(
    ua,
  );
}

export async function checkFairUse(
  env: Env,
  request: Request,
  frontendOrigin: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  const windowSec = env.RATE_LIMIT_WINDOW
    ? parseInt(env.RATE_LIMIT_WINDOW, 10)
    : FAIR_USE_WINDOW_SECONDS;
  const baseMax = env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10)
    : FAIR_USE_MAX_REQUESTS;
  const agent = isAgentShapedRequest(request);
  const maxRequests = agent
    ? Math.min(baseMax, FAIR_USE_AGENT_MAX_REQUESTS)
    : Number.isFinite(baseMax)
      ? baseMax
      : FAIR_USE_MAX_REQUESTS;

  const fingerprint = getFairUseFingerprint(request);
  const id = env.RATE_LIMITER.idFromName(fingerprint);
  const stub = env.RATE_LIMITER.get(id);

  const requestUrl = new URL("https://rate-limiter/check");
  requestUrl.searchParams.set("window", String(windowSec));
  requestUrl.searchParams.set("maxRequests", String(maxRequests));
  requestUrl.searchParams.set("frontendUrl", frontendOrigin);

  const response = await stub.fetch(
    new Request(requestUrl.toString(), { method: "GET" }),
  );

  return response.json();
}
