# Markdown Share API

Cloudflare Workers API for sharing markdown/text content using R2 storage.

## Features

- ✅ Upload markdown/text content (2MB max)
- ✅ Rate limiting (10 uploads per minute per IP)
- ✅ Generate shareable URLs
- ✅ Retrieve shared content
- ✅ No database required (uses R2 public URLs)
- ✅ CORS enabled

## Setup

### 1. Install Dependencies

```bash
cd workers-api
npm install
```

### 2. Create R2 Bucket

```bash
# Create the R2 bucket
wrangler r2 bucket create mdviewer
```

### 3. Configure Wrangler

The `wrangler.toml` is already configured. Make sure the bucket name matches:

```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "mdviewer"
```

### 4. Deploy

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

Or for development:

```bash
# Run locally
npm run dev
```

## API Endpoints

### POST /upload

Upload markdown/text content.

**Request:**
```bash
curl -X POST https://your-api.workers.dev/upload \
  -H "Content-Type: text/plain" \
  -d "# Hello World"
```

**Response:**
```json
{
  "id": "abc123...",
  "shareUrl": "https://your-api.workers.dev/share/abc123...",
  "size": 13,
  "uploadedAt": "2024-01-01T00:00:00.000Z"
}
```

**Rate Limits:**
- 10 uploads per minute per IP
- Returns `429 Too Many Requests` when exceeded

**File Size:**
- Maximum 2MB
- Returns `413 Payload Too Large` when exceeded

### GET /share/:id

Retrieve shared content.

**Request:**
```bash
curl https://your-api.workers.dev/share/abc123...
```

**Response:**
- `200 OK`: Returns the markdown/text content
- `404 Not Found`: Content doesn't exist
- `500 Internal Server Error`: Server error

## Environment Variables

No environment variables required for basic setup. The R2 bucket is configured via `wrangler.toml`.

## Rate Limiting

Rate limiting is implemented using **Durable Objects**, which provides:
- ✅ Distributed rate limiting across all worker instances
- ✅ Consistent rate limits regardless of which worker handles the request
- ✅ No read/write limits (unlike KV)
- ✅ Perfect for free tier users
- ✅ Strong consistency guarantees

Each IP address gets its own Durable Object instance, ensuring accurate rate limiting even with multiple workers.

## Frontend Integration

Update your frontend `.env.local` or environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-api.workers.dev
```

## Deployment

1. Make sure you're logged in:
   ```bash
   wrangler login
   ```

2. Deploy:
   ```bash
   npm run deploy
   ```

3. Note your Workers URL (e.g., `https://markdown-share-api.your-subdomain.workers.dev`)

4. Update your frontend with this URL.

