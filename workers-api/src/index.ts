/**
 * Cloudflare Workers API for Markdown Sharing
 * 
 * @description
 * A high-performance edge API for sharing markdown and text content globally.
 * Built on Cloudflare Workers with R2 storage and Durable Objects for rate limiting.
 * 
 * @features
 * - ⚡ Edge-powered uploads with global distribution
 * - 🔒 Secure content storage in Cloudflare R2
 * - 🚦 Smart rate limiting using Durable Objects
 * - 🌍 Unlimited downloads with no rate limits
 * - 📝 Content-type validation for markdown/text only
 * - 🔗 Automatic share URL generation
 * 
 * @endpoints
 * - POST /upload - Upload markdown/text/plain content (rate limited, 1MB max, content-type restricted)
 *   Accepts: Direct text/plain or multipart/form-data file uploads
 *   Returns: { id, frontendShareUrl: "https://domain.com/share?id=ID_HERE", ... }
 * - GET /share/:id - Get shared content from R2 storage (unlimited, no rate limiting)
 * 
 * @rateLimiting
 * - Uploads: Rate limited (10 per minute per IP, configurable via env vars)
 * - Downloads: Unlimited access for fast content delivery
 * 
 * @environmentVariables
 * - FRONTEND_URL (required): The frontend URL for CORS and share URL construction
 *   Example: "https://yourdomain.com" or "http://localhost:3000"
 * - RATE_LIMIT_WINDOW (optional): Rate limit window in seconds (default: 60)
 * - RATE_LIMIT_MAX_REQUESTS (optional): Max requests per window (default: 10)
 * 
 * @author MDViewer Team
 * @version 1.0.0
 */

/**
 * Environment interface for Cloudflare Workers
 * 
 * @interface Env
 * @property {R2Bucket} R2_BUCKET - R2 bucket binding for storing shared content
 * @property {DurableObjectNamespace} RATE_LIMITER - Durable Object namespace for rate limiting
 * @property {string} FRONTEND_URL - Required: Frontend URL for CORS and share URL construction
 * @property {string} [RATE_LIMIT_WINDOW] - Optional: Rate limit window in seconds (default: 60)
 * @property {string} [RATE_LIMIT_MAX_REQUESTS] - Optional: Max requests per window (default: 10)
 */
export interface Env {
  R2_BUCKET: R2Bucket;
  RATE_LIMITER: DurableObjectNamespace;
  FRONTEND_URL: string; // Required: Frontend URL for CORS and share URL construction
  RATE_LIMIT_WINDOW?: string; // Optional: Rate limit window in seconds (default: 60)
  RATE_LIMIT_MAX_REQUESTS?: string; // Optional: Max requests per window (default: 10)
}

// Import RateLimiter from separate file for better organization
export { RateLimiter } from './rate-limiter';

/**
 * Maximum file size for uploads (1MB)
 * 
 * @constant MAX_FILE_SIZE
 * @type {number}
 */
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

/**
 * Allowed content types for upload
 * 
 * Only markdown and text content types are accepted for security and storage efficiency.
 * These apply to both direct text uploads and file uploads.
 * 
 * The API accepts uploads in two formats:
 * 1. Direct text/plain (Content-Type: text/plain)
 * 2. Multipart form data with file (Content-Type: multipart/form-data)
 * 
 * @constant ALLOWED_CONTENT_TYPES
 * @type {string[]}
 */
const ALLOWED_CONTENT_TYPES = [
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/md',
  'application/x-markdown',
];

/**
 * Default rate limit configuration
 * 
 * These values are used when environment variables are not set.
 * Can be overridden via RATE_LIMIT_WINDOW and RATE_LIMIT_MAX_REQUESTS env vars.
 * 
 * @constant DEFAULT_RATE_LIMIT_WINDOW
 * @constant DEFAULT_RATE_LIMIT_MAX_REQUESTS
 */
const DEFAULT_RATE_LIMIT_WINDOW = 60; // 60 seconds
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 10; // 10 uploads per minute per IP

/**
 * Extracts the client IP address from request headers
 * 
 * @description
 * Tries multiple methods to get the real client IP:
 * 1. CF-Connecting-IP (Cloudflare's header with real client IP)
 * 2. X-Forwarded-For (fallback for other proxies)
 * 3. 'unknown' (if neither is available)
 * 
 * @param {Request} request - The incoming request
 * @returns {string} The client IP address
 * 
 * @example
 * const ip = getClientIP(request);
 * // Returns: "192.168.1.1" or "unknown"
 */
function getClientIP(request: Request): string {
  // Try to get real IP from CF headers (most reliable)
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) return cfConnectingIP;
  
  // Fallback to X-Forwarded-For (for non-CF proxies)
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  
  return 'unknown';
}

/**
 * Checks rate limit for a given IP address
 * 
 * @description
 * Uses Durable Objects to maintain distributed rate limiting state.
 * Each IP gets its own Durable Object instance for accurate tracking.
 * Configuration is passed via query params since Durable Objects receive
 * env only at construction time.
 * 
 * @param {Env} env - Environment bindings (R2, Durable Objects, etc.)
 * @param {string} ip - Client IP address
 * @param {string} frontendUrl - Frontend URL for CORS headers
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number, limit: number}>}
 *   Rate limit check result with remaining requests and reset time
 * 
 * @example
 * const result = await checkRateLimit(env, "192.168.1.1", "https://example.com");
 * if (!result.allowed) {
 *   // Rate limit exceeded
 * }
 */
async function checkRateLimit(env: Env, ip: string, frontendUrl: string): Promise<{ allowed: boolean; remaining: number; resetAt: number; limit: number }> {
  // Parse rate limit config from env (with defaults)
  const rateLimitWindow = env.RATE_LIMIT_WINDOW ? parseInt(env.RATE_LIMIT_WINDOW, 10) : DEFAULT_RATE_LIMIT_WINDOW;
  const rateLimitMaxRequests = env.RATE_LIMIT_MAX_REQUESTS ? parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10) : DEFAULT_RATE_LIMIT_MAX_REQUESTS;
  
  // Get or create Durable Object instance for this IP
  // Each IP gets a unique Durable Object for isolated rate limiting
  const id = env.RATE_LIMITER.idFromName(ip);
  const stub = env.RATE_LIMITER.get(id);
  
  // Create a custom request with rate limit config in query params
  // Durable Objects receive env only at construction time, so we pass
  // dynamic config via the request URL
  const requestUrl = new URL('https://rate-limiter/check');
  requestUrl.searchParams.set('window', String(rateLimitWindow));
  requestUrl.searchParams.set('maxRequests', String(rateLimitMaxRequests));
  requestUrl.searchParams.set('frontendUrl', frontendUrl);
  
  const response = await stub.fetch(new Request(requestUrl.toString(), {
    method: 'GET',
  }));
  
  return response.json();
}

/**
 * Generates a unique, URL-safe identifier
 * 
 * @description
 * Creates a cryptographically secure random ID using Web Crypto API.
 * The ID is URL-safe base64 encoded (replaces + with -, / with _, removes = padding).
 * 
 * @returns {string} A unique 22-character URL-safe base64 string
 * 
 * @example
 * const id = generateId();
 * // Returns: "abc123xyz789-_ABC123"
 */
function generateId(): string {
  // Generate 16 random bytes (128 bits of entropy)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  
  // Convert to base64 and make URL-safe
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')  // Replace + with - (URL-safe)
    .replace(/\//g, '_')  // Replace / with _ (URL-safe)
    .replace(/=/g, '');   // Remove padding
}

/**
 * Extracts content from request (handles both direct text and file uploads)
 * 
 * @description
 * Supports two upload formats:
 * 1. Direct text/plain: Content-Type: text/plain with body as text
 * 2. File upload: Content-Type: multipart/form-data with file in form field
 * 
 * @param {Request} request - The upload request
 * @returns {Promise<{content: string, contentType: string}>} Extracted content and its type
 * @throws {415} Unsupported media type
 * @throws {400} No file or content found
 */
async function extractContent(request: Request): Promise<{ content: string; contentType: string }> {
  const requestContentType = request.headers.get('Content-Type') || '';
  const requestContentTypeLower = requestContentType.toLowerCase().split(';')[0].trim();
  
  // Case 1: Multipart form data (file upload)
  if (requestContentTypeLower === 'multipart/form-data') {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        // Try alternative field names
        const fileField = formData.get('content') as File | null || 
                         formData.get('markdown') as File | null ||
                         formData.get('text') as File | null;
        
        if (!fileField) {
          throw new Error('No file found in form data. Use field name "file", "content", "markdown", or "text"');
        }
        
        const fileContent = await fileField.text();
        const fileType = fileField.type || 'text/plain';
        const fileTypeLower = fileType.toLowerCase().split(';')[0].trim();
        
        // Validate file content type
        if (!ALLOWED_CONTENT_TYPES.includes(fileTypeLower) && fileType !== '') {
          throw new Error(`File type "${fileType}" is not allowed. Only markdown/text/plain content types are accepted.`);
        }
        
        return { content: fileContent, contentType: fileTypeLower || 'text/plain' };
      }
      
      const fileContent = await file.text();
      const fileType = file.type || 'text/plain';
      const fileTypeLower = fileType.toLowerCase().split(';')[0].trim();
      
      // Validate file content type
      if (!ALLOWED_CONTENT_TYPES.includes(fileTypeLower) && fileType !== '') {
        throw new Error(`File type "${fileType}" is not allowed. Only markdown/text/plain content types are accepted.`);
      }
      
      return { content: fileContent, contentType: fileTypeLower || 'text/plain' };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to parse multipart form data');
    }
  }
  
  // Case 2: Direct text/plain upload
  if (ALLOWED_CONTENT_TYPES.includes(requestContentTypeLower)) {
    const content = await request.text();
    return { content, contentType: requestContentTypeLower };
  }
  
  // Invalid content type
  throw new Error(`Content type "${requestContentType}" is not allowed. Use multipart/form-data for file uploads or text/plain for direct text.`);
}

/**
 * Handles file upload requests
 * 
 * @description
 * Processes markdown/text uploads in two formats:
 * 1. Direct text/plain upload (Content-Type: text/plain)
 * 2. File upload via multipart/form-data (Content-Type: multipart/form-data)
 * 
 * Validations:
 * 1. Rate limiting check (per IP)
 * 2. Content-type validation (markdown/text only)
 * 3. File size check (1MB max)
 * 4. Empty content check
 * 
 * On success, stores content in R2 and returns share URL.
 * 
 * @param {Request} request - The upload request
 * @param {Env} env - Environment bindings
 * @param {string} frontendUrl - Frontend URL for CORS
 * @returns {Promise<Response>} Success response with share URL or error response
 * 
 * @throws {429} Rate limit exceeded
 * @throws {415} Unsupported media type
 * @throws {413} Payload too large
 * @throws {400} Empty content
 * @throws {500} Storage error
 */
async function handleUpload(request: Request, env: Env, frontendUrl: string): Promise<Response> {
  // Step 1: Check rate limit (only for uploads)
  const ip = getClientIP(request);
  const rateLimit = await checkRateLimit(env, ip, frontendUrl);
  
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
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetAt),
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  // Step 2: Extract content (handles both direct text and file uploads)
  let content: string;
  let contentType: string;
  
  try {
    const extracted = await extractContent(request);
    content = extracted.content;
    contentType = extracted.contentType;
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Invalid content type',
        message: error instanceof Error ? error.message : 'Invalid request format. Use multipart/form-data for file uploads or text/plain for direct text.',
        allowedTypes: ALLOWED_CONTENT_TYPES,
        uploadFormats: [
          'multipart/form-data (for file uploads)',
          ...ALLOWED_CONTENT_TYPES.map(t => `${t} (for direct text uploads)`)
        ],
      }),
      {
        status: 415,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Step 3: Validate content size
  const contentSize = new Blob([content]).size;
  
  // Check file size
  if (contentSize > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({
        error: 'File too large',
        message: `File size (${(contentSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 1MB.`,
      }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check for empty content
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

  // Step 4: Generate unique ID and store in R2
  const id = generateId();
  
  try {
    await env.R2_BUCKET.put(id, content, {
      httpMetadata: {
        contentType: `${contentType}; charset=utf-8`,
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        size: String(contentSize),
      },
    });

    // Step 5: Construct frontend share URL
    const frontendUrlObj = new URL(env.FRONTEND_URL);
    frontendUrlObj.pathname = '/share';
    frontendUrlObj.searchParams.set('id', id);
    
    // Return success response with share URL
    return new Response(
      JSON.stringify({
        id,
        frontendShareUrl: frontendUrlObj.toString(), // Full frontend URL: https://domain.com/share?id=ID_HERE
        size: contentSize,
        uploadedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(rateLimit.limit),
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

/**
 * Handles share content retrieval requests
 * 
 * @description
 * Retrieves shared content from R2 storage. No rate limiting is applied
 * for downloads to ensure fast, unlimited access to shared content.
 * 
 * @param {Request} request - The share request
 * @param {Env} env - Environment bindings
 * @param {string} id - The share ID
 * @returns {Promise<Response>} The markdown/text content or error response
 * 
 * @throws {404} Content not found
 * @throws {500} Retrieval error
 */
async function handleShare(request: Request, env: Env, id: string): Promise<Response> {
  // No rate limiting for downloads - unlimited access for fast content delivery
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
    
    // Return the content directly with appropriate headers
    // Note: We return content directly rather than redirecting to R2 public URLs
    // for better control over caching and headers
    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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

/**
 * Main Worker entry point
 * 
 * @description
 * Handles all incoming requests with the following flow:
 * 1. Validates FRONTEND_URL configuration (required)
 * 2. Sets up CORS headers
 * 3. Routes requests to appropriate handlers
 * 4. Adds CORS headers to all responses
 * 
 * @type {Object}
 * @property {Function} fetch - Main request handler
 */
const worker = {
  /**
   * Main request handler
   * 
   * @param {Request} request - Incoming request
   * @param {Env} env - Environment bindings
   * @returns {Promise<Response>} Response with content or error
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    // Step 1: Validate FRONTEND_URL is set - MUST be checked before any processing or CORS setup
    if (!env.FRONTEND_URL || env.FRONTEND_URL.trim() === '') {
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: 'FRONTEND_URL environment variable is not set. Please configure it in wrangler.toml or via environment variables.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Validate FRONTEND_URL is a valid URL
    let frontendUrlObj: URL;
    try {
      frontendUrlObj = new URL(env.FRONTEND_URL);
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          message: `FRONTEND_URL is not a valid URL: ${env.FRONTEND_URL}. Please set a valid URL in wrangler.toml.`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 3: Extract path and set up CORS headers
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers - use FRONTEND_URL for allowed origin
    const corsHeaders = {
      'Access-Control-Allow-Origin': frontendUrlObj.origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS for CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Step 4: Route handling
    // Health check endpoint for monitoring/CI-CD verification
    if (request.method === 'GET' && path === '/health') {
      return new Response(
        JSON.stringify({ ok: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (request.method === 'POST' && path === '/upload') {
      const response = await handleUpload(request, env, frontendUrlObj.origin);
      // Add CORS headers to response
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
      // Add CORS headers to response
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

export default worker;
