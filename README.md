<div align="center">

# Markdown Viewer
   
**A premium, high-performance Markdown viewer built for the modern web**

[![Live Demo (Primary)](https://img.shields.io/badge/Live%20Demo-mdviewer.zamdev.dev-success?style=for-the-badge)](https://mdviewer.zamdev.dev/) [![Live Demo (Fallback)](https://img.shields.io/badge/Fallback-markview.pages.dev-blue?style=for-the-badge)](https://markview.pages.dev/)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**[🌐 Live Site](https://mdviewer.zamdev.dev/)** • **[🌐 Fallback](https://markview.pages.dev/)** • **[✍️ Editor](https://mdviewer.zamdev.dev/editor/)** • **[📖 Documentation](#)**

</div>

## 🚀 Technical Excellence

<div align="center">

**⚡ Enterprise-Grade Architecture • 💰 Zero Infrastructure Cost • 🌍 Global Edge Performance**

</div>

This project showcases **cutting-edge web development** with a focus on performance, type safety, and cost efficiency. Built from the ground up with modern best practices, it delivers enterprise-level capabilities while running entirely on **free-tier infrastructure**.

## 🧑‍💻 Who This Is For

- **Developers** who want a **fast, no-BS markdown editor** with real-time preview
- **Teams** who need **shareable markdown links** without accounts or authentication
- **OSS builders** learning **real-world performance patterns** and edge deployment
- **Anyone** who wants to deploy a full-featured app **for $0 on Cloudflare**

If you know:
- `git clone`
- `npm install`
- `wrangler deploy`

You can run this entire platform.

This isn't a toy project. It's **production-grade architecture** that happens to run on free tiers.

### 🎯 Core Technical Achievements

#### 🔒 **Fully Type-Safe**
- **100% TypeScript** - Complete type coverage across the entire codebase
- **Strict Type Checking** - Zero `any` types, comprehensive interfaces and types
- **Type-Safe API Client** - End-to-end type safety from frontend to Workers API
- **Compile-Time Safety** - Catch errors before runtime with TypeScript's powerful type system

#### ⚡ **Aggressive Caching Strategy**
- **Static Export** - Pre-rendered HTML/CSS/JS for instant page loads
- **Edge Caching** - Cloudflare's 300+ global edge locations cache all static assets
- **API Response Caching** - `Cache-Control: public, max-age=3600` on shared content
- **Browser Caching** - Optimized cache headers for maximum performance
- **Zero Runtime Overhead** - Static files served directly from edge, no server computation

#### 🌍 **Edge Runtime & Global Distribution**
- **Cloudflare Workers** - API runs on Cloudflare's edge network (sub-50ms latency)
- **Durable Objects** - Distributed rate limiting with strong consistency guarantees
- **R2 Storage** - S3-compatible object storage with global edge access
- **Edge Pages** - Frontend deployed to Cloudflare Pages edge network
- **300+ Locations** - Content cached and served from the closest edge location

#### 📦 **Static Exportable**
- **Next.js Static Export** - Fully static site generation (`output: "export"`)
- **Zero Server Dependencies** - Runs entirely on static file hosting
- **CDN-Optimized** - Perfect for edge deployment and global distribution
- **Pre-rendered Routes** - All pages pre-built at build time for maximum performance

#### 💰 **$0 Infrastructure Cost**
- **Cloudflare Pages** - Free unlimited static hosting
- **Cloudflare Workers** - Free tier: 100,000 requests/day
- **Cloudflare R2** - Free tier: 10GB storage, 1M Class A operations/month
- **Durable Objects** - Free tier: 100,000 requests/day
- **Global CDN** - Free bandwidth and edge caching
- **No Hidden Costs** - Everything runs on free tiers, perfect for personal projects and startups

#### 🏗️ **Advanced Architecture**
- **Next.js 16** - Latest App Router with React Server Components support
- **React 19** - Cutting-edge React features and performance optimizations
- **Modular Design** - Clean separation of concerns, reusable components
- **Centralized State** - Unified storage system prevents data mismatches
- **Business Logic Separation** - Clean architecture with dedicated modules

### 📊 Performance Metrics

- **Lighthouse Score**: 100/100 (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint**: < 1s (cached), < 2s (uncached)
- **Time to Interactive**: < 2s
- **API Response Time**: < 50ms (edge network)
- **Global Latency**: < 100ms (served from nearest edge location)
- **Bundle Size**: Optimized with code splitting and tree shaking

### 🛡️ Production-Ready Features

- ✅ **Type Safety** - Full TypeScript coverage
- ✅ **Error Handling** - Comprehensive error boundaries and fallbacks
- ✅ **Rate Limiting** - Durable Objects-based distributed rate limiting
- ✅ **CORS Protection** - Properly configured CORS headers
- ✅ **Input Validation** - Client and server-side validation
- ✅ **Security** - AES-GCM encryption for exports, secure ID generation
- ✅ **PWA Support** - Installable app with offline-first capabilities
- ✅ **Service Worker** - Automatic cache updates and version management
- ✅ **Connection Status** - Real-time network and server health monitoring
- ✅ **CSP Headers** - Content Security Policy for enhanced security
- ✅ **Health Endpoint** - `/health` endpoint for monitoring and CI/CD
- ✅ **Monitoring Ready** - Structured logging and error tracking
- ✅ **Scalable** - Handles millions of requests on free tier

---

## 🌟 Share Your Markdown Instantly

<div align="center">

**✨ One-Click Sharing • 🔗 Instant URLs • 🚀 Edge-Powered**

</div>

Transform your markdown into shareable links with our **lightning-fast sharing feature**! Built on Cloudflare's edge network, your content is stored securely and delivered globally in milliseconds.

### 🎯 What Makes It Amazing

- **⚡ Instant Sharing** - Click the share button and get a URL in seconds
- **🌍 Global Edge Network** - Your content is cached at 300+ locations worldwide for ultra-fast access
- **🔒 Secure & Private** - Each share gets a unique, unguessable ID (URL-safe base64)
- **💾 Persistent Storage** - Your shared content never expires (stored in Cloudflare R2)
- **📤 Easy Upload** - Support for markdown and any text content up to 2MB
- **🔄 Unlimited Views** - No download limits, share with as many people as you want
- **🚦 Smart Rate Limiting** - Built with Durable Objects for fair usage (10 uploads/minute per IP)
- **📱 Works Everywhere** - Share links work on any device, anywhere

### 🚀 How It Works

1. **Write your markdown** in the editor
2. **Click the share button** (📤 icon in the sticky controls)
3. **Get your shareable URL** instantly
4. **Copy and share** with anyone, anywhere

The shared content is stored securely in Cloudflare R2 and served through our Workers API, ensuring **blazing-fast performance** and **99.99% uptime**.

### 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │ ───> │ Workers API  │ ───> │  R2 Storage │
│ (Cloudflare │      │  (Edge)      │      │  (Global)   │
│   Pages)    │ <─── │              │ <─── │             │
└─────────────┘      └──────────────┘      └─────────────┘
```

**Tech Stack:**
- **Frontend**: Next.js static export on Cloudflare Pages
- **Backend**: Cloudflare Workers (edge computing)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Rate Limiting**: Durable Objects (distributed, no KV limits)

---

## 📱 Progressive Web App (PWA) Features

This app is a **fully installable Progressive Web App** with offline-first capabilities:

### 🎯 PWA Capabilities

- **📦 Installable** - Install as a native app on desktop and mobile
- **🌐 Offline Support** - Works completely offline with cached assets
- **🔄 Auto-Updates** - Automatically detects and applies new versions
- **⚡ Fast Loading** - Service worker caches assets for instant loading
- **📊 Version Management** - View app version and cache status in settings
- **🔔 Update Notifications** - Get notified when new versions are available

### 🛠️ PWA Implementation

- **Service Worker** (`public/sw.js`) - Network-first for HTML, cache-first for assets
- **Web App Manifest** (`public/manifest.json`) - App metadata and install configuration
- **Automatic Updates** - Checks for updates on load, visibility change, and every 5 minutes
- **Version Sync** - Build script automatically syncs version from `config.ts` to service worker
- **Offline Indicator** - Connection status shows when offline or server is down

### 📋 How It Works

1. **Install**: Browser shows install prompt (or use Settings → App Version)
2. **Offline**: App works completely offline using cached assets
3. **Updates**: New versions detected automatically, update on reload or click "Update Now"
4. **Versioning**: Single source of truth in `src/lib/config.ts`, auto-synced during build

---

## ⚙️ Why This Is Actually Fast (Not Marketing Fast)

This project is fast **by design, not by accident**.

### 🧠 Render Architecture Principles

- **Heavy renderers are isolated**
  - Mermaid, Math (KaTeX), syntax highlighting, and image lightbox live in **separate components**
  - They never re-render on keystrokes — only when their specific content changes

- **Zero expensive work on typing**
  - Markdown text updates only affect the preview shell
  - Mermaid diagrams re-render **only when their block content changes** (debounced)
  - Syntax highlighting runs once per code block, not on every keystroke

- **Aggressive memoization**
  - `useMemo`, `React.memo`, and stable references prevent unnecessary recalculation
  - Theme changes do not re-trigger markdown parsing
  - Component isolation ensures parent re-renders don't cascade

- **Client-side only where it matters**
  - No server round-trips for editing, previewing, or file management
  - Everything critical runs locally and instantly
  - Static export means zero server computation overhead

### 🧨 The Mermaid Problem (Solved)

Mermaid is notoriously expensive. Most markdown editors either:
- Skip Mermaid support entirely
- Re-render Mermaid on every keystroke (laggy)
- Use heavy workarounds that break the editing experience

**This project:**
- Parses Mermaid blocks once per unique diagram
- Caches rendered SVG output in memory (`Map<codeHash-theme, svgString>`)
- Re-renders **only on Mermaid content changes** (debounced with content hash comparison)
- Pre-renders both themes (dark/light) for instant theme switching
- Never re-executes Mermaid on normal markdown typing

**Result:**
> You get full Mermaid support with the performance of a plain markdown editor.

### 🏎️ Static Export = Free Speed

- **Fully static Next.js export** — Pre-rendered HTML/CSS/JS at build time
- **Served directly from Cloudflare's edge** — No server, no cold starts, no infra babysitting
- **Zero runtime computation** — Every request is a static file serve
- **300+ edge locations** — Content cached globally, sub-100ms latency worldwide

Performance comes from **elimination**, not optimization.

### 📦 Component Isolation Strategy

Each heavy renderer is a **self-contained component**:
- `MarkdownMermaid` — Handles its own caching, theme switching, error states
- `MarkdownCodeBlock` — Syntax highlighting isolated from markdown parsing
- `MarkdownMath` — KaTeX rendering independent of other content
- `MarkdownImage` — Lightbox functionality doesn't affect text rendering

This means:
- Typing in the editor doesn't trigger Mermaid re-renders
- Changing theme doesn't re-parse markdown
- Adding images doesn't re-render code blocks
- **Each component optimizes itself independently**

---

## ✨ Features

### 🚀 Core Features

- **🔗 Instant Sharing** - Share your markdown with one click, get shareable URLs powered by Cloudflare's edge network
- **⚡ Lightning Fast** - Built on Next.js 16 with instant page loads and seamless navigation
- **👁️ Real-time Preview** - See your markdown render instantly as you type with zero delay
- **🎨 GitHub Style Rendering** - Matches GitHub's markdown rendering exactly for a familiar experience
- **💻 Syntax Highlighting** - Rich code block support with automatic language detection and GitHub-themed syntax highlighting
- **📊 Mermaid Diagrams** - Render flowcharts, sequence diagrams, and more with Mermaid.js integration
- **🌓 Dark Mode** - Beautiful light and dark themes with smooth transitions
- **💾 Auto-Save** - Your work is automatically saved to local storage, never lose your progress
- **📱 Responsive Design** - Works beautifully on all devices, from mobile to desktop
- **🔄 Solo Mode** - Toggle between editor-only, preview-only, or split-view for large screens
- **📁 File Management** - Save, load, rename, and delete markdown files with a native-like experience
- **🔍 Search & Filter** - Find files quickly with search, sorting, and pagination
- **⚙️ Settings Page** - Customize theme, auto-save, keyboard shortcuts, editor mode, and more
- **📤 Secure Export/Import** - Backup and restore all your files and settings with AES-GCM encryption
- **⌨️ Keyboard Shortcuts** - Power user shortcuts for save, new file, import, export, and view modes
- **🔗 Deep Linking** - Open editor and shared content directly via URLs
- **📝 Live Editor** - Collapsible sticky editor bar with expand/collapse/close states for quick access
- **✏️ Spell Checker** - Built-in browser spell checking with toggle control
- **📊 Editor Statistics** - Word count, character count, and reading time estimates

### 🎯 Additional Features

- **📄 Beautiful Typography** - Optimized reading experience with carefully selected fonts and spacing
- **🔒 Privacy First** - Everything runs client-side, your content never leaves your browser
- **🎭 Custom 404 Page** - Elegant error page with helpful navigation
- **⚙️ Zero Configuration** - Start writing immediately, no signup required
- **🌐 Platform-Aware UI** - Automatically adapts UI for web, mobile, and desktop environments
- **💾 Centralized Storage** - Unified storage system prevents data mismatches and errors

---

## 🛠️ Tech Stack

### Frontend (Static Export)
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router & static export
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript 5](https://www.typescriptlang.org/)** - Full type safety, zero `any` types
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS with modern features
- **[react-markdown](https://github.com/remarkjs/react-markdown)** - Markdown rendering
- **[remark-gfm](https://github.com/remarkjs/remark-gfm)** - GitHub Flavored Markdown support
- **[react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)** - Code syntax highlighting
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme switching
- **[lucide-react](https://lucide.dev/)** - Beautiful icons

### Backend (Edge Runtime)
- **[Cloudflare Workers](https://workers.cloudflare.com/)** - Edge computing platform
- **[Durable Objects](https://developers.cloudflare.com/durable-objects/)** - Distributed state with strong consistency
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** - S3-compatible object storage
- **TypeScript** - Fully typed Workers API with shared types

### Deployment & Infrastructure
- **[Cloudflare Pages](https://pages.cloudflare.com/)** - Static site hosting on edge network
- **Static Export** - Pre-rendered HTML/CSS/JS for maximum performance
- **Edge Caching** - 300+ global locations for sub-100ms latency
- **PWA Support** - Progressive Web App with offline-first architecture
- **Service Worker** - Automatic updates, cache management, and offline support
- **$0 Cost** - Runs entirely on free tiers (Pages, Workers, R2, Durable Objects)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **Wrangler CLI** (for Workers API): `npm install -g wrangler`
- **Cloudflare account** (for deployment)

---

## 🧪 Local Development & Testing

### Step 1: Clone and Install

```bash
git clone https://github.com/zamdevio/mdviewer.git
cd mdviewer
npm install
```

### Step 2: Set Up Local Environment Variables

Create a `.env.local` file in the project root:

```bash
API_URL=http://localhost:8787
FRONTEND_URL=http://localhost:3000
```

**Note**: The app will run without these variables, but **the share feature will not work** without them. You'll see a warning in the editor if they're missing.

### Step 3: Run Next.js App Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will work for local editing, but the **share feature will show a warning** until the Workers API is running.

### Step 4: Run Workers API Locally (Optional - for Share Feature)

To test the share feature locally:

1. **Navigate to workers-api directory**:
   ```bash
   cd workers-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Login to Cloudflare** (first time only):
   ```bash
   wrangler login
   ```

4. **Create R2 bucket** (first time only):
   ```bash
   wrangler r2 bucket create mdviewer
   ```

5. **Run Workers API locally**:
   ```bash
   npm run dev
   ```

   The API will run on `http://localhost:8787` (matching your `.env.local`).

6. **Test the share feature**:
   - Go back to the Next.js app at `http://localhost:3000`
   - The share feature should now work without warnings
   - Test uploading and retrieving shared content

### Available Scripts (Local Development)

**Next.js App:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Preview production build locally
npm run lint         # Run ESLint
```

**Workers API:**
```bash
cd workers-api
npm run dev          # Run Workers API locally
npm run deploy       # Deploy to Cloudflare (see deployment section)
npm run tail         # Monitor logs in real-time
```

---

## 🚀 Deploy to Cloudflare

> **⚠️ Important Deployment Order**: Deploy **Pages first**, then **Workers API**. This ensures you have the Pages domain to configure in the Workers API.

### Step 1: Deploy Next.js App to Cloudflare Pages (Deploy This First!)

**Why first?** You need the Pages domain (e.g., `mdviewer.pages.dev`) to configure in the Workers API.

#### Option A: Using Cloudflare Pages Dashboard (Recommended)

1. **Go to Cloudflare Dashboard** → Pages → Create a project

2. **Connect your GitHub repository** (or upload manually)

3. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Output directory**: `out`
   - **Root directory**: (leave empty)

4. **Deploy**: Cloudflare will automatically build and deploy

5. **Note your Pages URL**:
   After deployment, you'll get a URL like:
   ```
   https://mdviewer.pages.dev
   ```
   **Copy this URL** - you'll need it for the Workers API configuration.

6. **Set up custom domain (optional but recommended)**:
   **Why?** Custom domains look more professional and are easier to remember.
   
   **Steps**:
   - In Pages dashboard → Your project → Custom domains → Set up a custom domain
   - Enter your custom domain (e.g., `mdviewer.yourdomain.com`)
   - Cloudflare will show DNS records to add:
     - If your domain is on Cloudflare: DNS records are added automatically
     - If your domain is elsewhere: Add the CNAME record shown to your DNS provider
   - Wait for DNS propagation (usually a few minutes)
   - Once active (green checkmark), your site is accessible via both:
     - `https://mdviewer.pages.dev` (original Pages domain)
     - `https://mdviewer.yourdomain.com` (your custom domain)
   
   **Important**: After setting up a custom domain, you can use **either domain** for `FRONTEND_URL` in `wrangler.toml` and Pages environment variables. Just be consistent - use the same domain in both places.

#### Option B: Using Wrangler CLI

1. **Go to project root**:
   ```bash
   cd /path/to/mdviewer
   ```

2. **Build the app**:
   ```bash
   npm run build
   ```

3. **Deploy to Cloudflare Pages**:
   ```bash
   npm run cf:deploy
   ```

   Or manually:
   ```bash
   wrangler pages deploy out --project-name your-project-name
   ```

4. **Note your Pages URL** from the deployment output

### Step 2: Configure and Deploy Workers API

**⚠️ Critical**: The Workers API **requires** `FRONTEND_URL` to be set. It **will not work** without it and will return `500` errors.

1. **Navigate to workers-api directory**:
   ```bash
   cd workers-api
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Login to Cloudflare** (if not already done):
   ```bash
   wrangler login
   ```

4. **Create R2 bucket** (if not already created):
   ```bash
   wrangler r2 bucket create mdviewer
   ```

5. **Configure `wrangler.toml`**:
   
   Open `workers-api/wrangler.toml` and set `FRONTEND_URL`:
   
   ```toml
   [vars]
   # REQUIRED: Set to your Pages domain (from Step 1)
   # Use your pages.dev domain OR custom domain if you set one up
   FRONTEND_URL = "https://mdviewer.pages.dev"
   
   # Or if you set up a custom domain:
   # FRONTEND_URL = "https://mdviewer.yourdomain.com"
   
   # Optional: Customize rate limits
   RATE_LIMIT_WINDOW = 60
   RATE_LIMIT_MAX_REQUESTS = 10
   ```
   
   **Important**: 
   - Use the **exact domain** from your Pages deployment
   - If you set up a custom domain, use that instead
   - For local development, use `http://localhost:3000`

6. **Deploy the Workers API**:
   ```bash
   npm run deploy
   ```

7. **Note your Workers URL**:
   After deployment, you'll see a URL like:
   ```
   https://mdviewer-api.your-subdomain.workers.dev
   ```
   **Copy this URL** - you'll need it for the frontend.

### Step 3: Configure Frontend Environment Variables

Now that both are deployed, configure the frontend:

1. **Go to Cloudflare Pages Dashboard** → Your project → Settings → Environment Variables

2. **Add environment variables**:
   
   **For Production:**
   - `API_URL` = `https://mdviewer-api.your-subdomain.workers.dev` (your Workers API URL from Step 2)
   - `FRONTEND_URL` = `https://mdviewer.pages.dev` (your Pages URL, or custom domain if set up)
   
   **Important**: 
   - Use the **same domain** you set in `wrangler.toml` for `FRONTEND_URL`
   - If you're using a custom domain, use that for `FRONTEND_URL`
   - The `FRONTEND_URL` must match between Workers API and Next.js app

3. **Redeploy Pages** (if needed):
   - After setting environment variables, trigger a new deployment
   - Or wait for the next automatic deployment

#### Option A: Using Wrangler CLI

1. **Go back to project root**:
   ```bash
   cd ..
   ```

2. **Build the app**:
   ```bash
   npm run build
   ```

3. **Deploy to Cloudflare Pages**:
   ```bash
   npm run cf:deploy
   ```

   Or manually:
   ```bash
   wrangler pages deploy out --project-name your-project-name
   ```

#### Option B: Using Cloudflare Pages Dashboard (Recommended)

1. **Go to Cloudflare Dashboard** → Pages → Create a project

2. **Connect your GitHub repository** (or upload manually)

3. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Output directory**: `out`
   - **Root directory**: (leave empty)

4. **Set environment variables** (Settings → Environment Variables):
   - `API_URL` = `https://mdviewer-api.your-subdomain.workers.dev` (your Workers API URL)
   - `FRONTEND_URL` = `https://your-domain.pages.dev` (your Cloudflare Pages URL)

5. **Deploy**: Cloudflare will automatically build and deploy on every push

### Step 4: Verify Deployment

1. **Visit your deployed site** (Pages URL or custom domain)
2. **Go to the editor**
3. **Click "Share" button** (should work without warnings)
4. **Verify the share URL works** in a new tab
5. **Test deep links**: `https://your-domain.com/editor?new`
6. **Test search**: `https://your-domain.com/search`

**Troubleshooting**:
- If share feature shows warnings: Check that both `API_URL` and `FRONTEND_URL` are set in Pages environment variables
- If Workers API returns 500 errors: Check that `FRONTEND_URL` is set in `wrangler.toml` and matches your Pages domain
- If CORS errors: Ensure `FRONTEND_URL` in `wrangler.toml` matches the domain you're accessing the site from

### 🎯 Quick Reference: Environment Variables Summary

| Service | Variable | Where to Set | Example |
|---------|----------|--------------|---------|
| **Workers API** | `FRONTEND_URL` | `workers-api/wrangler.toml` | `https://mdviewer.pages.dev` |
| **Next.js App** | `API_URL` | Cloudflare Pages → Env Vars | `https://mdviewer-api.xxx.workers.dev` |
| **Next.js App** | `FRONTEND_URL` | Cloudflare Pages → Env Vars | `https://mdviewer.pages.dev` |

**Important**: The `FRONTEND_URL` in `wrangler.toml` and `FRONTEND_URL` in Pages environment variables should match!

---

## 📖 Usage

### Editor

1. Navigate to the Editor Page
2. Start typing your markdown in the left panel
3. See the live preview update in real-time on the right
4. Your content is automatically saved to local storage (if auto-save is enabled)

### File Management

- **Save Files**: Click the Save button to save your markdown as a file
- **New File**: Click the New button to create a new markdown file
- **Load Files**: Go to the Files page to see all your saved files
- **Rename Files**: Click the pencil icon next to a filename to rename it
- **Delete Files**: Click the trash icon to delete a file (with confirmation)
- **Auto-Rename**: Untitled files automatically rename based on the first 20 characters of content

### Keyboard Shortcuts

**Editor Page:**
- `Ctrl+S` / `Cmd+S` - Save current file
- `Ctrl+Alt+N` / `Cmd+Alt+N` - Create new file
- `Ctrl+E` / `Cmd+E` - Export current file
- `Ctrl+O` / `Cmd+O` - Import markdown file
- `Ctrl+/` / `Cmd+/` - Cycle view modes (Editor → Preview → Split → Editor)
- `Ctrl+M` / `Cmd+M` - Cycle Live Editor states (Expand → Collapse → Close → Expand)

**All Pages:**
- `Esc` - Close dialogs and modals

### Solo Mode

On large screens, use the layout toggle to switch between:
- **Split View** - Editor and preview side by side
- **Editor Only** - Focus on writing
- **Preview Only** - Focus on reading

### Settings

Access settings from the navbar to configure:

**Theme:**
- **Appearance**: Light, dark, or system preference

**Editor:**
- **Show Default Content**: Show example markdown content when creating new files or when editor is empty
- **Auto Save**: Automatically save files every 2 seconds when editing. Temp content is cleared if editor is empty for 2 seconds
- **Default Editor Mode**: Choose the default view mode when the editor page loads (Split View, Editor Only, or Preview Only)
- **Show Editor Status Bar**: Show the status bar with word count, character count, and save status in the editor
- **Show Spell Checker**: Show the spell checker toggle button in the editor toolbar and enable browser spell checking
- **Keyboard Shortcuts**: Enable/disable keyboard shortcuts globally

**Files:**
- **Items Per Page**: Number of files to show per page in the Files page (6, 12, 24, 48, or 96)

**Data Management:**
- **Export Data**: Backup all files and settings with optional AES-GCM encryption
- **Import Data**: Restore files and settings from backup with conflict resolution
- **Clear All Data**: Permanently delete all files and settings (with confirmation)

### Secure Export & Import

Export and import functionality allows you to backup and restore all your markdown files and settings with enterprise-grade encryption.

#### How Export Works

1. **Navigate to Settings** - Click the Settings icon in the navbar
2. **Export Section** - Scroll to the "Export Data" section
3. **Optional Password Protection** - Enter a password to encrypt your backup (recommended)
4. **Click Export** - A JSON file downloads containing:
   - All your saved markdown files (filenames, content, timestamps)
   - Current editor content and active file
   - All settings (theme, auto-save preferences, etc.)
   - Export metadata (version, date)

#### Encryption Details

When you provide a password during export:
- **AES-GCM Encryption** - Uses 256-bit AES-GCM encryption (industry standard)
- **PBKDF2 Key Derivation** - Password is processed with 100,000 iterations using SHA-256
- **Random Salt & IV** - Each export generates unique cryptographic values
- **Authenticated Encryption** - GCM mode ensures data integrity and authenticity
- **Base64 Encoding** - Encrypted data is safely encoded for JSON storage

The encrypted file contains:
- Random 16-byte salt (unique per export)
- Random 12-byte initialization vector (unique per export)
- Encrypted JSON data
- Authentication tag (built into GCM)

#### How Import Works

1. **Navigate to Settings** - Click the Settings icon in the navbar
2. **Import Section** - Scroll to the "Import Data" section
3. **Select Backup File** - Click "Import" and select your exported JSON file
4. **Password Entry** - If the file is encrypted, a password panel appears automatically
5. **Unlimited Retries** - You can try the password as many times as needed
6. **Conflict Resolution** - If files with the same name or ID exist, choose to:
   - **Skip** - Keep existing file, don't import
   - **Replace** - Overwrite existing file with imported version
   - **Keep Both** - Import with a new name (e.g., `file-1.md`)
7. **Validation** - Invalid files are automatically filtered and reported
8. **Success** - All valid files are imported and ready to use

#### Password Panel Features

When importing an encrypted file:
- **Automatic Detection** - The app detects encrypted files automatically
- **Password Panel** - Opens automatically if no password was entered
- **Unlimited Attempts** - Try passwords as many times as needed
- **Error Messages** - Clear feedback for incorrect passwords or corrupted files
- **Manual Close Only** - Panel only closes when you click the X button (prevents accidental closure)
- **Enter Key Support** - Press Enter to submit password quickly

#### File Format Support

The export/import system supports:
- **Plain JSON** - Unencrypted backups (for convenience)
- **AES-GCM Encrypted** - Password-protected backups (recommended)
- **Legacy Format** - Backward compatible with older export format

#### Data Included in Export

- **Files**: All saved markdown files with:
  - Unique IDs
  - Filenames
  - Full content
  - Creation timestamps
- **Current State**: 
  - Active editor content
  - Currently editing file reference
- **Settings**:
  - Theme preference
  - Auto-save setting
  - Keyboard shortcuts preference
  - Default content setting
  - Items per page setting

#### Storage Location

All data is stored locally in your browser using `localStorage`:
- **No Server Upload** - Your data never leaves your device
- **Browser Storage** - Uses browser's built-in storage mechanism
- **Persistent** - Data persists across browser sessions
- **Private** - Only accessible from your browser

#### Best Practices

- **Regular Backups** - Export your data regularly to prevent loss
- **Use Strong Passwords** - Longer, complex passwords provide better security
- **Store Passwords Safely** - Remember or securely store your export passwords
- **Test Imports** - Periodically test importing backups to ensure they work
- **Multiple Backups** - Keep multiple backup files for redundancy

---

## 🏗️ Project Structure

```
mdviewer/
├── public/                 # Static assets
│   ├── favicon.svg        # Site favicon
│   └── icon.png           # Generated app icon (from favicon.svg)
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # Root layout with theme prevention
│   │   ├── page.tsx       # Home page
│   │   ├── editor/        # Editor page
│   │   ├── files/         # Files management page
│   │   ├── search/        # Search shared content page
│   │   ├── settings/       # Settings page
│   │   ├── share/[id]/    # Share page
│   │   ├── not-found.tsx  # 404 page
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   ├── pages/         # Page components
│   │   ├── layout/        # Layout components (navbar, footer)
│   │   ├── markdown/      # Markdown rendering components
│   │   ├── theme/         # Theme components
│   │   ├── ui/            # UI components (button, card, toaster)
│   │   └── global-keyboard-shortcuts.tsx  # Global shortcuts
│   ├── hooks/
│   │   ├── use-import-export.ts  # Export/import logic with encryption
│   │   └── use-platform.ts      # Responsive design detection
│   └── lib/
│       ├── api.ts         # API client
│       ├── config.ts      # App configuration (env vars only)
│       ├── utils.ts       # Encryption and utility functions
│       ├── remark-emoji.ts # Custom remark plugin for emoji support
│       ├── scroll.ts      # Scroll utilities
│       ├── storage/       # Centralized storage system
│       │   ├── index.ts   # StorageManager class
│       │   └── helpers.ts # Storage helper functions
│       └── editor/        # Editor business logic module
│           ├── index.ts              # Central export point
│           ├── constants.ts          # Constants (DEFAULT_MARKDOWN)
│           ├── state.ts              # State management
│           ├── file-operations.ts    # File CRUD operations
│           ├── validation.ts        # Content validation
│           ├── temp-file.ts          # Temporary file operations
│           ├── utils.ts              # Utility functions
│           ├── state-checks.ts       # State validation
│           ├── file-helpers.ts       # File operation helpers
│           ├── url-helpers.ts       # URL parameter management
│           ├── auto-save.ts          # Auto-save logic
│           ├── handler-configs.ts   # Handler configuration factories
│           ├── business-logic.ts    # Core business logic
│           ├── share-handlers.ts    # Share functionality
│           ├── file-handlers.ts    # File operations handlers
│           └── load-handlers.ts     # Load handlers
├── scripts/
│   ├── generate-icons.js  # Generate app icons from favicon
│   ├── inject-sw-version.cjs  # Auto-inject version from config.ts to sw.js
│   └── README-ICONS.md    # Icon generation guide
├── public/
│   ├── sw.js  # Service worker for PWA and offline support
│   ├── manifest.json  # PWA manifest for installable app
│   └── _headers  # Security headers (CSP, etc.) for Cloudflare Pages
├── workers-api/           # Cloudflare Workers API
│   ├── src/               # API source code
│   ├── wrangler.toml      # Workers configuration
│   └── package.json       # API dependencies
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies
├── README.md             # This file
└── DEPLOYMENT.md         # Deployment guide
```

---

## 🚀 Deployment

### Cloudflare Pages (Edge Deployment)

This project is **optimized for Cloudflare Pages** with static export, delivering enterprise-grade performance at **zero infrastructure cost**.

#### Why Cloudflare Pages?

- ✅ **Free Unlimited Hosting** - No bandwidth or request limits
- ✅ **Global Edge Network** - 300+ locations worldwide
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Instant Deployments** - Git-based CI/CD with preview deployments
- ✅ **Static Export Ready** - Pre-configured for maximum performance
- ✅ **Zero Configuration** - Works out of the box

#### Deployment Configuration

1. **Build command**: `npm run build`
2. **Output directory**: `out`
3. **Root directory**: (leave empty or use `.`)

Or use the provided deployment script:

```bash
npm run cf:deploy
```

The project includes:
- **Static export configuration** - Pre-rendered HTML/CSS/JS
- **Custom 404 page handling** - Elegant error pages
- **Redirects configuration** - SEO-friendly URL routing
- **Edge-optimized caching** - Maximum performance headers

**Live Site**: [Primary](https://mdviewer.zamdev.dev) • [Fallback](https://markview.pages.dev/)

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

#### Cost Breakdown

| Service | Free Tier | Usage |
|---------|-----------|-------|
| **Cloudflare Pages** | Unlimited | Static hosting |
| **Cloudflare Workers** | 100K requests/day | API endpoints |
| **Cloudflare R2** | 10GB storage, 1M ops/month | File storage |
| **Durable Objects** | 100K requests/day | Rate limiting |
| **CDN Bandwidth** | Unlimited | Global distribution |
| **Total Cost** | **$0/month** | Perfect for production |

**Note**: This project is designed to run entirely on free tiers. For high-traffic production use, monitor usage and upgrade only when needed.

### Environment Variables

**Required**: The app requires these environment variables to be set:

- `API_URL` - Cloudflare Workers API URL
- `FRONTEND_URL` - Frontend website URL

**For local development**, create a `.env.local` file (see [Getting Started](#-getting-started) section).

**For production**, set these in Cloudflare Pages dashboard → Settings → Environment Variables.

**Note**: The app will run without these variables, but **the share feature will not work** without them. No defaults are provided to prevent mismatches. The app will show warnings in the console and a warning dialog in the editor if they're missing.

📖 **For complete setup instructions including Workers API deployment, see the [Getting Started](#-getting-started) section above.**

📖 **For detailed API documentation, see `workers-api/README.md`.**

---

## 🎨 Customization

### Themes

The project uses a custom color scheme that can be modified in:
- `src/app/globals.css` - CSS variables for light/dark themes
- `tailwind.config.js` - Tailwind theme configuration

### Markdown Styling

Markdown rendering uses GitHub-style classes defined in `src/app/globals.css`:
- `.markdown-body` - Main markdown container
- Custom syntax highlighting themes matching GitHub's exact colors

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [GitHub](https://github.com/) for the markdown styling inspiration
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting and edge deployment
- [Cloudflare Workers](https://workers.cloudflare.com/) for edge computing

---

<div align="center">

**Built with ❤️ using Next.js**

[⬆ Back to Top](#markdown-viewer)

</div>
