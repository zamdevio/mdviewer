/**
 * Durable Object for rate limiting
 * 
 * This Durable Object handles rate limiting per IP address.
 * It's more efficient than KV and works well for free tier users.
 */

interface Env {
  // No environment variables needed for rate limiter
}

export class RateLimiter {
  private state: DurableObjectState;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.pathname;

    if (action === '/check') {
      return this.handleCheck(request);
    } else if (action === '/reset') {
      return this.handleReset();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleCheck(request: Request): Promise<Response> {
    const RATE_LIMIT_WINDOW = 60; // 60 seconds
    const RATE_LIMIT_MAX_REQUESTS = 10; // 10 uploads per minute

    // Get current count from storage
    let entry = await this.state.storage.get<{ count: number; resetAt: number }>('rateLimit');
    const now = Date.now();

    // Initialize or reset if expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW * 1000,
      };
      await this.state.storage.put('rateLimit', entry);
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: RATE_LIMIT_MAX_REQUESTS - 1,
          resetAt: entry.resetAt,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if limit exceeded
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          resetAt: entry.resetAt,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Increment count
    entry.count++;
    await this.state.storage.put('rateLimit', entry);

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
        resetAt: entry.resetAt,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  private async handleReset(): Promise<Response> {
    await this.state.storage.delete('rateLimit');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

