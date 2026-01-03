# Markdown Share API

<div align="center">

**⚡ Lightning-fast edge API for sharing markdown and text content**

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)
[![R2 Storage](https://img.shields.io/badge/R2-Storage-FF6B6B?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/r2/)
[![Durable Objects](https://img.shields.io/badge/Durable-Objects-4ECDC4?style=for-the-badge&logo=cloudflare)](https://developers.cloudflare.com/durable-objects/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**[📖 API Documentation](#api-endpoints)** • **[🚀 Quick Start](#setup)** • **[⚙️ Configuration](#configuration)**

</div>

---

## 🌟 Features

<div align="center">

**✨ Edge-Powered • 🔒 Secure • 🚦 Smart Rate Limiting • 🌍 Unlimited Downloads**

</div>

- **⚡ Edge-Powered Uploads** - Global distribution via Cloudflare's edge network for ultra-fast uploads
- **🔒 Secure Storage** - Content stored securely in Cloudflare R2 with unique, unguessable IDs
- **🚦 Smart Rate Limiting** - Distributed rate limiting using Durable Objects (10 uploads/minute per IP, configurable)
- **🌍 Unlimited Downloads** - No rate limits on downloads for fast, unlimited content access
- **📝 Content Validation** - Only markdown/text/plain content types accepted (1MB max)
- **🔗 Auto Share URLs** - Automatic generation of shareable frontend URLs
- **🌐 CORS Ready** - Built-in CORS support for cross-origin requests
- **📊 Rate Limit Headers** - Standard `X-RateLimit-*` headers for client integration

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   Frontend  │ ───> │ Workers API  │ ───> │  R2 Storage │      │   Durable    │
│ (Next.js)   │      │  (Edge)      │      │  (Global)   │      │   Objects    │
│             │ <─── │              │ <─── │             │      │ (Rate Limit) │
└─────────────┘      └──────────────┘      └─────────────┘      └──────────────┘
```

**Tech Stack:**
- **API**: Cloudflare Workers (edge computing, global distribution)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Rate Limiting**: Durable Objects (distributed, consistent, no KV limits)
- **Language**: TypeScript 5

---

## 🚀 Setup

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Cloudflare account with Workers and R2 enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- **Frontend deployed first** (Cloudflare Pages) - you need the Pages domain to configure here

### ⚠️ Important: Deployment Order

**Deploy your frontend (Cloudflare Pages) FIRST**, then deploy this Workers API. This ensures you have the Pages domain to configure in `wrangler.toml`.

1. Deploy Next.js app to Cloudflare Pages → Get domain (e.g., `mdviewer.pages.dev`)
2. Configure `FRONTEND_URL` in `wrangler.toml` with that domain
3. Deploy this Workers API

### Installation

1. **Install dependencies**:
   ```bash
   cd workers-api
   npm install
   ```

2. **Login to Cloudflare** (first time only):
   ```bash
   wrangler login
   ```

3. **Create R2 Bucket**:
   ```bash
   wrangler r2 bucket create mdviewer
   ```

4. **Configure `wrangler.toml`** (REQUIRED):
   
   **⚠️ CRITICAL**: The Workers API **requires** `FRONTEND_URL` to be set. It **will not work** without it and will return `500` errors on all requests.
   
   Open `wrangler.toml` and set your `FRONTEND_URL`:
   
   ```toml
   [vars]
   # REQUIRED: Set to your Cloudflare Pages domain
   # Get this from your Pages deployment (e.g., mdviewer.pages.dev)
   # Or use your custom domain if you set one up
   FRONTEND_URL = "https://mdviewer.pages.dev"
   
   # For local development, use:
   # FRONTEND_URL = "http://localhost:3000"
   
   # Optional: Customize rate limits
   RATE_LIMIT_WINDOW = 60        # Time window in seconds (default: 60)
   RATE_LIMIT_MAX_REQUESTS = 10  # Max requests per window (default: 10)
   ```
   
   **Important**:
   - Use the **exact domain** from your Cloudflare Pages deployment
   - If you set up a custom domain for Pages, use that instead
   - The domain must match what users will access your site from
   - For local dev, use `http://localhost:3000`

5. **Deploy**:
   ```bash
   # Deploy to Cloudflare Workers
   npm run deploy
   ```

   **Note your Workers URL** from the output (e.g., `https://mdviewer-api.xxx.workers.dev`). You'll need this for your frontend's `API_URL` environment variable.

   Or for local development:
   ```bash
   # Run locally (requires FRONTEND_URL set to localhost:3000)
   npm run dev
   ```

---

## 📖 API Endpoints

### POST /upload

Upload markdown/text content with rate limiting and validation.

**Supports two upload formats:**

1. **Direct text upload** (Content-Type: text/plain):
```bash
curl -X POST https://api.mdviewer.your-domain.com/upload \
  -H "Content-Type: text/plain" \
  -d "# Hello World"
```

2. **File upload** (Content-Type: multipart/form-data):
```bash
curl -X POST https://api.mdviewer.your-domain.com/upload \
  -F "file=@document.md" \
  -F "file=@document.txt"
```

**Note:** For file uploads, the form field can be named `file`, `content`, `markdown`, or `text`. The API will automatically detect and extract the file content.

**Response:**
```json
{
  "id": "abc123...",
  "frontendShareUrl": "https://yourdomain.com/share?id=abc123...",
  "size": 13,
  "uploadedAt": "2024-01-01T00:00:00.000Z"
}
```

**Rate Limits:**
- **Uploads only**: 10 uploads per minute per IP (configurable via `RATE_LIMIT_MAX_REQUESTS`)
- **Downloads**: Unlimited (no rate limiting)
- Returns `429 Too Many Requests` when upload limit exceeded
- Includes `X-RateLimit-*` headers in all responses

**File Size:**
- Maximum 1MB
- Returns `413 Payload Too Large` when exceeded

**Content Types:**
- Only markdown/text/plain content types are accepted:
  - `text/plain`
  - `text/markdown`
  - `text/x-markdown`
  - `text/md`
  - `application/x-markdown`
- Returns `415 Unsupported Media Type` for invalid content types

**Response Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1234567890
```

### GET /share/:id

Retrieve shared content from R2 storage. **No rate limiting** - unlimited access.

**Request:**
```bash
curl https://api.mdviewer.your-domain.com/share/abc123...
```

**Response:**
- `200 OK`: Returns the markdown/text content with caching headers
- `404 Not Found`: Content doesn't exist
- `500 Internal Server Error`: Server error

**Note:** This is the API endpoint for retrieving content. The frontend share URL format is `/share?id=ID_HERE` (using query parameters).

**Response Headers:**
```
Content-Type: text/plain; charset=utf-8
Cache-Control: public, max-age=3600
X-Content-Size: 13
X-Uploaded-At: 2024-01-01T00:00:00.000Z
```

---

## ⚙️ Configuration

### Environment Variables

#### Required

- **`FRONTEND_URL`** (required): The frontend URL for your application
  - **⚠️ CRITICAL**: The API **will not work** without this. All requests will return `500` errors.
  - Used for CORS headers and constructing share URLs
  - **Must be set in `wrangler.toml`** under `[vars]` (recommended) or via environment variables
  - **For production**: Use your Cloudflare Pages domain (e.g., `https://mdviewer.pages.dev`) or custom domain
  - **For local dev**: Use `http://localhost:3000`
  - The API will return a `500` error if this is not set or is invalid
  - **Must match** the domain users access your frontend from

#### Optional

- **`RATE_LIMIT_WINDOW`**: Rate limit time window in seconds
  - Default: `60` (1 minute)
  - Example: `120` for 2-minute windows

- **`RATE_LIMIT_MAX_REQUESTS`**: Maximum requests allowed per window
  - Default: `10` requests per window
  - Example: `20` for higher limits

### Example Configuration

**Production (Cloudflare Pages domain):**
```toml
[vars]
FRONTEND_URL = "https://mdviewer.pages.dev"
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX_REQUESTS = 10
```

**Production (Custom domain):**
```toml
[vars]
FRONTEND_URL = "https://mdviewer.yourdomain.com"
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX_REQUESTS = 10
```

**Local Development:**
```toml
[vars]
FRONTEND_URL = "http://localhost:3000"
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX_REQUESTS = 10
```

---

## 🚦 Rate Limiting

### How It Works

Rate limiting is implemented using **Durable Objects**, which provides:

- ✅ **Distributed Rate Limiting** - Works across all worker instances
- ✅ **Strong Consistency** - No race conditions or inconsistent state
- ✅ **No Read/Write Limits** - Unlike KV, no operation limits
- ✅ **Per-IP Isolation** - Each IP gets its own Durable Object instance
- ✅ **Automatic Cleanup** - Objects are evicted when not in use
- ✅ **Perfect for Free Tier** - No additional costs beyond Workers

### Rate Limit Headers

All responses include standard rate limit headers:

```
X-RateLimit-Limit: 10          # Maximum requests allowed
X-RateLimit-Remaining: 5       # Remaining requests in current window
X-RateLimit-Reset: 1234567890   # Unix timestamp when limit resets
Retry-After: 30                 # Seconds until retry (only on 429)
```

### Algorithm

The rate limiter uses a **fixed-window algorithm**:

1. Each IP gets a unique Durable Object instance
2. Requests are counted within a time window (default: 60 seconds)
3. When the window expires, the counter resets
4. If limit is exceeded, returns `429 Too Many Requests`

---

## 🌐 Frontend Integration

### Environment Variables

Update your frontend `.env.local` or environment variables:

```env
API_URL=https://api.mdviewer.your-domain.com
FRONTEND_URL=https://mdviewer.your-domain.com
```

Both environment variables are required for the frontend to function properly.

### Example Integration

```typescript
// Upload content
const response = await fetch(`${API_URL}/upload`, {
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
  },
  body: markdownContent,
});

const data = await response.json();
// data.frontendShareUrl contains the shareable URL
```

---

## 🚀 Deployment

### ⚠️ Deployment Order (Important!)

**Deploy your frontend (Cloudflare Pages) FIRST**, then deploy this Workers API:

1. **Deploy Next.js app to Cloudflare Pages** → Get your Pages domain (e.g., `mdviewer.pages.dev`)
2. **Set `FRONTEND_URL` in `wrangler.toml`** with that domain
3. **Deploy this Workers API**
4. **Update frontend environment variables** with the Workers API URL

### Quick Deploy

1. **Ensure frontend is deployed** and you have the Pages domain

2. **Configure `wrangler.toml`**:
   ```toml
   [vars]
   FRONTEND_URL = "https://mdviewer.pages.dev"  # Your Pages domain
   ```

3. **Login to Cloudflare** (if not already done):
   ```bash
   wrangler login
   ```

4. **Create R2 bucket** (if not already created):
   ```bash
   wrangler r2 bucket create mdviewer
   ```

5. **Deploy**:
   ```bash
   npm run deploy
   ```

6. **Note your Workers URL** (e.g., `https://mdviewer-api.your-subdomain.workers.dev`)

7. **Update frontend environment variables** in Cloudflare Pages:
   - `API_URL` = Your Workers URL (from step 6)
   - `FRONTEND_URL` = Your Pages domain (same as in `wrangler.toml`)

### Production Checklist

- [ ] Frontend deployed to Cloudflare Pages (get domain first!)
- [ ] Set `FRONTEND_URL` in `wrangler.toml` (matches Pages domain)
- [ ] Create R2 bucket (`wrangler r2 bucket create mdviewer`)
- [ ] Configure rate limits (optional)
- [ ] Deploy worker (`npm run deploy`)
- [ ] Note Workers API URL from deployment output
- [ ] Update frontend environment variables in Cloudflare Pages:
  - [ ] `API_URL` = Workers API URL
  - [ ] `FRONTEND_URL` = Pages domain (must match `wrangler.toml`)
- [ ] Test upload and download endpoints

---

## 📊 Project Structure

```
workers-api/
├── src/
│   ├── index.ts          # Main API worker (upload, share endpoints)
│   └── rate-limiter.ts  # Durable Object for rate limiting
├── wrangler.toml        # Workers configuration
├── package.json         # Dependencies
└── README.md           # This file
```

---

## 🔒 Security

- **Content-Type Validation** - Only markdown/text/plain accepted
- **File Size Limits** - 1MB maximum to prevent abuse
- **Rate Limiting** - Prevents spam and abuse
- **Unique IDs** - Cryptographically secure, URL-safe base64
- **CORS Protection** - Only allows requests from configured frontend
- **No Public Access** - R2 bucket is private, content served through Workers

---

## 🐛 Troubleshooting

### Common Issues

**Error: "FRONTEND_URL is not set" or "Configuration error"**
- **Solution**: Set `FRONTEND_URL` in `wrangler.toml` under `[vars]`
- **Must be set** - the API will not work without it
- Use your Cloudflare Pages domain (e.g., `https://mdviewer.pages.dev`)
- For local dev, use `http://localhost:3000`

**Error: "FRONTEND_URL is not a valid URL"**
- **Solution**: Ensure `FRONTEND_URL` in `wrangler.toml` is a valid URL
- Must include protocol (`https://` or `http://`)
- No trailing slashes

**CORS errors**
- **Solution**: Ensure `FRONTEND_URL` in `wrangler.toml` matches the domain users access your site from
- If using custom domain, update `FRONTEND_URL` to match
- Redeploy after changing `FRONTEND_URL`

**Error: "Rate limit exceeded"**
- **Solution**: Wait for the rate limit window to reset or increase `RATE_LIMIT_MAX_REQUESTS`

**Error: "Invalid content type"**
- **Solution**: Use one of the allowed content types: `text/plain`, `text/markdown`, etc.

**Error: "File too large"**
- **Solution**: Reduce file size to under 1MB

---

## 📝 License

This project is open source and available under the [MIT License](../../LICENSE).

---

<div align="center">

**Built with ❤️ using Cloudflare Workers**

[⬆ Back to Top](#markdown-share-api)

</div>
