# Deployment Guide

This guide walks you through deploying both the frontend (Cloudflare Pages) and the API (Cloudflare Workers).

## Prerequisites

- Cloudflare account
- Node.js 18+ installed
- Wrangler CLI installed (`npm install -g wrangler`)

## Step 1: Deploy the Workers API

1. **Navigate to the workers-api directory:**
   ```bash
   cd workers-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

4. **Create the R2 bucket:**
   ```bash
   wrangler r2 bucket create mdviewer
   ```

5. **Deploy the Workers API:**
   ```bash
   npm run deploy
   ```

6. **Note your Workers URL:**
   After deployment, you'll see a URL like:
   ```
   https://mdviewer-api.your-subdomain.workers.dev
   ```
   Copy this URL - you'll need it for the frontend.

## Step 2: Configure Frontend

1. **Set the API URL:**
   
   Option A: Environment variable (recommended for production)
   - In Cloudflare Pages dashboard, go to Settings > Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-api.workers.dev`

   Option B: Update the code directly
   - Edit `src/lib/api.ts`
   - Change the `API_BASE_URL` constant to your Workers URL

2. **Build and deploy the frontend:**
   ```bash
   npm run build
   npm run cf:deploy
   ```

   Or use Cloudflare Pages dashboard:
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Output directory: `out`
   - Add environment variable: `NEXT_PUBLIC_API_URL`

## Step 3: Test

1. Visit your deployed site
2. Go to the editor
3. Click "Share" button
4. Copy the share URL
5. Open the share URL in a new tab to verify it works

## Troubleshooting

### API returns 404
- Make sure the R2 bucket exists: `wrangler r2 bucket list`
- Check that the bucket name in `wrangler.toml` matches the created bucket (should be `mdviewer`)

### CORS errors
- The API already includes CORS headers
- Make sure `NEXT_PUBLIC_API_URL` is set correctly

### Rate limit errors
- Default is 10 uploads per minute per IP
- Uses Durable Objects for distributed rate limiting
- Works across all worker instances
- No read/write limits (unlike KV)

### File too large
- Maximum file size is 2MB
- Check the content size before uploading

## Production Considerations

1. **Rate Limiting:**
   - Uses Durable Objects for distributed rate limiting
   - Works across all worker instances
   - No read/write limits (unlike KV)
   - See `workers-api/src/index.ts` and `workers-api/src/rate-limiter.ts` for implementation

2. **R2 Public URLs (Optional):**
   - Currently, the API serves content directly
   - You can configure R2 public access and redirect to public URLs
   - This reduces Workers execution time

3. **Custom Domain:**
   - Add a custom domain to your Workers API
   - Update `NEXT_PUBLIC_API_URL` accordingly

4. **Monitoring:**
   - Use `wrangler tail` to monitor API logs
   - Set up Cloudflare Analytics for usage tracking

