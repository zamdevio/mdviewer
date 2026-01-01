/**
 * Durable Object for Distributed Rate Limiting
 * 
 * @description
 * A high-performance rate limiting system using Cloudflare Durable Objects.
 * Provides distributed, consistent rate limiting across all worker instances
 * without the read/write limits of KV storage.
 * 
 * @features
 * - 🚀 Distributed rate limiting across all worker instances
 * - ⚡ Strong consistency guarantees (no race conditions)
 * - 🔒 Per-IP rate limiting with isolated state
 * - 📊 Standard rate limit headers (X-RateLimit-*)
 * - 🌍 CORS support for cross-origin requests
 * - ⚙️ Configurable limits via query parameters
 * 
 * @architecture
 * Each IP address gets its own Durable Object instance, ensuring:
 * - Accurate rate limiting even with multiple workers
 * - No shared state conflicts
 * - Automatic cleanup when objects are evicted
 * 
 * @configuration
 * Configuration is passed via query parameters since Durable Objects
 * receive env only at construction time. This allows dynamic configuration
 * without redeploying Durable Objects.
 * 
 * @author MDViewer Team
 * @version 1.0.0
 */

/**
 * Default rate limit values
 * 
 * Used when configuration is not provided via query parameters.
 * 
 * @constant DEFAULT_RATE_LIMIT_WINDOW
 * @constant DEFAULT_RATE_LIMIT_MAX_REQUESTS
 */
const DEFAULT_RATE_LIMIT_WINDOW = 60; // 60 seconds
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per window

/**
 * Rate Limiter Durable Object
 * 
 * @class RateLimiter
 * @description
 * Handles rate limiting state for individual IP addresses.
 * Uses Durable Object storage for persistent, consistent rate limit tracking.
 */
export class RateLimiter {
  private state: DurableObjectState;

  /**
   * Creates a new RateLimiter instance
   * 
   * @param {DurableObjectState} state - Durable Object state for storage
   * @param {unknown} _env - Environment (not used, config comes from query params)
   */
  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    // Note: env parameter is required by Durable Object interface but not used
    // Configuration is passed via query params instead for flexibility
    void _env; // Suppress unused parameter warning
  }

  /**
   * Main request handler
   * 
   * Routes requests to appropriate handlers based on pathname.
   * 
   * @param {Request} request - Incoming request
   * @returns {Promise<Response>} Response from handler or 404
   */
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

  /**
   * Checks rate limit for the current request
   * 
   * @description
   * Implements a fixed-window rate limiting algorithm:
   * 1. Gets or initializes rate limit entry from storage
   * 2. Checks if window has expired (resets if needed)
   * 3. Checks if limit is exceeded
   * 4. Increments counter if allowed
   * 5. Returns result with standard rate limit headers
   * 
   * @param {Request} request - The rate limit check request
   * @returns {Promise<Response>} Rate limit check result with headers
   * 
   * @example
   * // Request URL: https://rate-limiter/check?window=60&maxRequests=10&frontendUrl=https://example.com
   * const response = await rateLimiter.fetch(request);
   * // Returns: { allowed: true, remaining: 9, resetAt: 1234567890, limit: 10 }
   */
  private async handleCheck(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Get configuration from query params (passed from main worker)
    // This allows dynamic configuration without redeploying Durable Objects
    const rateLimitWindow = url.searchParams.get('window') 
      ? parseInt(url.searchParams.get('window')!, 10) 
      : DEFAULT_RATE_LIMIT_WINDOW;
    const rateLimitMaxRequests = url.searchParams.get('maxRequests')
      ? parseInt(url.searchParams.get('maxRequests')!, 10)
      : DEFAULT_RATE_LIMIT_MAX_REQUESTS;
    const frontendUrl = url.searchParams.get('frontendUrl') || '*';

    // Get current rate limit entry from storage
    let entry = await this.state.storage.get<{ count: number; resetAt: number }>('rateLimit');
    const now = Date.now();

    // Case 1: Initialize or reset if window expired
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 1, // First request in new window
        resetAt: now + rateLimitWindow * 1000, // Reset time = now + window duration
      };
      await this.state.storage.put('rateLimit', entry);
      
      const remaining = rateLimitMaxRequests - 1;
      return new Response(
        JSON.stringify({
          allowed: true,
          remaining,
          resetAt: entry.resetAt,
          limit: rateLimitMaxRequests,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': frontendUrl,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-RateLimit-Limit': String(rateLimitMaxRequests),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(entry.resetAt),
          },
        }
      );
    }

    // Case 2: Check if limit exceeded
    if (entry.count >= rateLimitMaxRequests) {
      return new Response(
        JSON.stringify({
          allowed: false,
          remaining: 0,
          resetAt: entry.resetAt,
          limit: rateLimitMaxRequests,
        }),
        {
          status: 429, // Too Many Requests
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': frontendUrl,
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'X-RateLimit-Limit': String(rateLimitMaxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(entry.resetAt),
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)), // Seconds until retry
          },
        }
      );
    }

    // Case 3: Increment counter and allow request
    entry.count++;
    await this.state.storage.put('rateLimit', entry);

    const remaining = rateLimitMaxRequests - entry.count;
    return new Response(
      JSON.stringify({
        allowed: true,
        remaining,
        resetAt: entry.resetAt,
        limit: rateLimitMaxRequests,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': frontendUrl,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-RateLimit-Limit': String(rateLimitMaxRequests),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(entry.resetAt),
        },
      }
    );
  }

  /**
   * Resets rate limit for testing/debugging
   * 
   * @description
   * Clears the rate limit entry from storage. Useful for:
   * - Testing rate limiting behavior
   * - Debugging rate limit issues
   * - Manual reset in development
   * 
   * @returns {Promise<Response>} Success response
   * 
   * @example
   * // Request: POST https://rate-limiter/reset
   * const response = await rateLimiter.fetch(resetRequest);
   * // Returns: { success: true }
   */
  private async handleReset(): Promise<Response> {
    await this.state.storage.delete('rateLimit');
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
}
