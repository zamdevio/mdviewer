/**
 * Appflare / unified install gateway.
 * - `/api/*` → existing share Worker (path stripped to Worker root routes)
 * - everything else → Vite SPA assets
 * Production Pages + `apps/worker` deploy paths stay untouched.
 */
import apiWorker, { RateLimiter } from "../../apps/worker/src/index";
import type { Env as WorkerEnv } from "../../apps/worker/src/env";

export { RateLimiter };

export type Env = WorkerEnv & {
  ASSETS: Fetcher;
};

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/** `/api` → `/`, `/api/health` → `/health` */
function rewriteApiRequest(request: Request): Request {
  const url = new URL(request.url);
  const rest = url.pathname.slice("/api".length);
  url.pathname = rest.length === 0 ? "/" : rest.startsWith("/") ? rest : `/${rest}`;
  return new Request(url.toString(), request);
}

const gateway = {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (isApiPath(pathname)) {
      return apiWorker.fetch(rewriteApiRequest(request), env, ctx);
    }
    return env.ASSETS.fetch(request);
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    return apiWorker.scheduled(controller, env, ctx);
  },
};

export default gateway;
