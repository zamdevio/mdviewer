# Deployment Guide

This comprehensive guide walks you through deploying both the frontend (Cloudflare Pages) and the API (Cloudflare Workers), including environment variable configuration.

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

### Required Environment Variables

**Important**: The app requires these environment variables. No defaults are provided to prevent mismatches.

1. **Set Environment Variables in Cloudflare Pages:**
   
   Go to Cloudflare Pages dashboard > Your Project > Settings > Environment Variables
   
   Add these variables:
   - `API_URL` = `https://mdviewer-api.your-subdomain.workers.dev` (your Workers API URL)
   - `FRONTEND_URL` = `https://your-domain.com` (your frontend website URL)

2. **Build and deploy the frontend:**
   ```bash
   npm run build
   npm run cf:deploy
   ```

   Or use Cloudflare Pages dashboard:
   - Connect your GitHub repository
   - Build command: `npm run build`
   - Output directory: `out`
   - Add environment variables:
     - `API_URL` = `https://mdviewer-api.your-subdomain.workers.dev`
     - `FRONTEND_URL` = `https://your-domain.com`

### Local Development Setup

For local development, create a `.env.local` file:

```bash
API_URL=http://localhost:8787
FRONTEND_URL=http://localhost:3000
```

**Note**: The app will fail to start if these variables are not set.

## Step 3: Test

1. Visit your deployed site
2. Go to the editor
3. Click "Share" button (should auto-copy URL)
4. Verify the share URL works in a new tab
5. Test deep links: `https://your-domain.com/editor?new`
6. Test search: `https://your-domain.com/search`
7. Test export/import:
   - Go to Settings page
   - Create some test files in the editor
   - Export data with a password
   - Clear browser data or use incognito mode
   - Import the exported file and verify all data is restored
   - Test password panel appears for encrypted files
   - Verify conflict resolution works when importing files with existing names

### Environment Variable Errors

**Error: "API_URL environment variable is required"**
- Solution: Set `API_URL` in Cloudflare Pages environment variables
- Or create `.env.local` file for local development

**Error: "FRONTEND_URL environment variable is required"**
- Solution: Set `FRONTEND_URL` in Cloudflare Pages environment variables
- Or create `.env.local` file for local development

**Build fails with environment variable errors**
- Ensure all required variables are set before building
- Check that variable names are correct (case-sensitive)

### API Issues

**API returns 404**
- Make sure the R2 bucket exists: `wrangler r2 bucket list`
- Check that the bucket name in `wrangler.toml` matches the created bucket (should be `mdviewer`)
- Verify the API is deployed: `wrangler deployments list`

**CORS errors**
- The API already includes CORS headers
- Make sure `API_URL` is set correctly
- Check that the API URL matches the deployed Workers URL

**Rate limit errors**
- Default is 10 uploads per minute per IP
- Uses Durable Objects for distributed rate limiting
- Works across all worker instances
- No read/write limits (unlike KV)

**File too large**
- Maximum file size is 2MB
- Check the content size before uploading

## Production Considerations

### Environment Variables

1. **Always Set in Production:**
   - `API_URL` - Your production Workers API URL
   - `FRONTEND_URL` - Your production frontend URL
   - Never use localhost URLs in production
   - No defaults are provided to prevent accidental misconfiguration

2. **Cloudflare Pages:**
   - Set environment variables in dashboard (Settings > Environment Variables)
   - Variables are embedded at build time
   - Different values can be set for production, preview, and branch deployments

### API Configuration

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
   - Update `API_URL` accordingly
   - Update `FRONTEND_URL` if using custom domain

4. **Monitoring:**
   - Use `wrangler tail` to monitor API logs
   - Set up Cloudflare Analytics for usage tracking
   - Monitor R2 bucket usage and costs

### Security

1. **Environment Variables:**
   - Never commit `.env.local` to git
   - Use Cloudflare Pages environment variables for production
   - Rotate API keys and secrets regularly

2. **API Security:**
   - Rate limiting prevents abuse
   - Content is stored securely in R2
   - No authentication required (public sharing)
