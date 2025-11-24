/**
 * Cloudflare Workers API for Markdown Sharing
 * 
 * Endpoints:
 * - POST /upload - Upload markdown/text content (rate limited, 2MB max)
 * - GET /share/:id - Get share URL (redirects to R2 public URL)
 */

export interface Env {
  R2_BUCKET: R2Bucket;
  RATE_LIMITER: DurableObjectNamespace;
}

// Durable Object for rate limiting
// Must be defined in the main entry file for Wrangler to recognize it
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
      return this.handleCheck();
    } else if (action === '/reset') {
      return this.handleReset();
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleCheck(): Promise<Response> {
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

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 uploads per minute per IP

function getClientIP(request: Request): string {
  // Try to get real IP from CF headers
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Fallback to X-Forwarded-For
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  
  return 'unknown';
}

async function checkRateLimit(env: Env, ip: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  // Get or create Durable Object instance for this IP
  const id = env.RATE_LIMITER.idFromName(ip);
  const stub = env.RATE_LIMITER.get(id);
  
  // Call the rate limiter Durable Object
  const response = await stub.fetch(new Request('https://rate-limiter/check', {
    method: 'GET',
  }));
  
  return response.json();
}

function generateId(): string {
  // Generate a random ID (URL-safe base64)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function handleUpload(request: Request, env: Env): Promise<Response> {
  // Check rate limit
  const ip = getClientIP(request);
  const rateLimit = await checkRateLimit(env, ip);
  
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many uploads. Please try again after ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds.`,
        resetAt: rateLimit.resetAt,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Get content from request body
  const content = await request.text();
  
  // Check file size
  const contentSize = new Blob([content]).size;
  if (contentSize > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({
        error: 'File too large',
        message: `File size (${(contentSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 2MB.`,
      }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (contentSize === 0) {
    return new Response(
      JSON.stringify({
        error: 'Empty content',
        message: 'Content cannot be empty.',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Generate unique ID
  const id = generateId();
  
  // Store in R2
  try {
    await env.R2_BUCKET.put(id, content, {
      httpMetadata: {
        contentType: 'text/plain; charset=utf-8',
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        size: String(contentSize),
      },
    });

    // Return share URL
    // The share URL should point to the frontend, not the API
    // The frontend will fetch from the API when viewing
    // For now, we return the API share URL - the frontend can construct the proper URL
    const apiShareUrl = new URL(request.url);
    apiShareUrl.pathname = `/share/${id}`;
    
    // Return both the ID and the API share URL
    // The frontend will construct the proper frontend URL: /share/{id}
    return new Response(
      JSON.stringify({
        id,
        shareUrl: apiShareUrl.toString(), // API URL for direct access
        frontendShareUrl: `/share/${id}`, // Frontend route
        size: contentSize,
        uploadedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
        },
      }
    );
  } catch (error) {
    console.error('Error storing file:', error);
    return new Response(
      JSON.stringify({
        error: 'Storage error',
        message: 'Failed to store file. Please try again.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleShare(request: Request, env: Env, id: string): Promise<Response> {
  try {
    // Get object from R2
    const object = await env.R2_BUCKET.get(id);
    
    if (!object) {
      return new Response(
        JSON.stringify({
          error: 'Not found',
          message: 'The shared content was not found or has expired.',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the content
    const content = await object.text();
    
    // Return the content directly (or redirect to R2 public URL if configured)
    // For simplicity, we return the content directly
    // If you want to use R2 public URLs, you'd need to configure public access
    // and return: Response.redirect(`https://your-r2-public-url.com/${id}`)
    
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Size': object.customMetadata?.size || '0',
        'X-Uploaded-At': object.customMetadata?.uploadedAt || '',
      },
    });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return new Response(
      JSON.stringify({
        error: 'Retrieval error',
        message: 'Failed to retrieve shared content.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route handling
    if (request.method === 'POST' && path === '/upload') {
      const response = await handleUpload(request, env);
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    if (request.method === 'GET' && path.startsWith('/share/')) {
      const id = path.split('/share/')[1];
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Invalid share ID' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      const response = await handleShare(request, env, id);
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  },
};

