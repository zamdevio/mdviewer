<div align="center">

# Markdown Viewer
   
**A premium, high-performance Markdown viewer built for the modern web**

[![Live Demo (Primary)](https://img.shields.io/badge/Live%20Demo-mdviewer.zamdev.dev-success?style=for-the-badge)](https://mdviewer.zamdev.dev/)
[![Live Demo (Fallback)](https://img.shields.io/badge/Fallback-markview.pages.dev-blue?style=for-the-badge)](https://markview.pages.dev/)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**[🌐 Live Site](https://mdviewer.zamdev.dev/)** • **[🌐 Fallback](https://markview.pages.dev/)** • **[✍️ Editor](https://mdviewer.zamdev.dev/editor/)** • **[📖 Documentation](#)**

</div>

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

## ✨ Features

### 🚀 Core Features

- **🔗 Instant Sharing** - Share your markdown with one click, get shareable URLs powered by Cloudflare's edge network
- **⚡ Lightning Fast** - Built on Next.js 16 with instant page loads and seamless navigation
- **👁️ Real-time Preview** - See your markdown render instantly as you type with zero delay
- **🎨 GitHub Style Rendering** - Matches GitHub's markdown rendering exactly for a familiar experience
- **💻 Syntax Highlighting** - Rich code block support with automatic language detection and GitHub-themed syntax highlighting
- **🌓 Dark Mode** - Beautiful light and dark themes with smooth transitions
- **💾 Auto-Save** - Your work is automatically saved to local storage, never lose your progress
- **📱 Responsive Design** - Works beautifully on all devices, from mobile to desktop
- **🔄 Solo Mode** - Toggle between editor-only, preview-only, or split-view for large screens
- **📁 File Management** - Save, load, rename, and delete markdown files with a native-like experience
- **🔍 Search & Filter** - Find files quickly with search, sorting, and pagination
- **⚙️ Settings Page** - Customize theme, auto-save, keyboard shortcuts, and more
- **📤 Secure Export/Import** - Backup and restore all your files and settings with AES-GCM encryption
- **⌨️ Keyboard Shortcuts** - Power user shortcuts for save, new file, import, and export
- **🔗 Deep Linking** - Open editor and shared content directly via URLs

### 🎯 Additional Features

- **📄 Beautiful Typography** - Optimized reading experience with carefully selected fonts and spacing
- **🔒 Privacy First** - Everything runs client-side, your content never leaves your browser
- **🎭 Custom 404 Page** - Elegant error page with helpful navigation
- **⚙️ Zero Configuration** - Start writing immediately, no signup required
- **🌐 Platform-Aware UI** - Automatically adapts UI for web, mobile, and desktop environments
- **💾 Centralized Storage** - Unified storage system prevents data mismatches and errors

---

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS
- **[react-markdown](https://github.com/remarkjs/react-markdown)** - Markdown rendering
- **[remark-gfm](https://github.com/remarkjs/remark-gfm)** - GitHub Flavored Markdown support
- **[react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)** - Code syntax highlighting
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme switching
- **[lucide-react](https://lucide.dev/)** - Beautiful icons

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zamdevio/mdviewer.git
   cd mdviewer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create a `.env.local` file in the project root:
   ```bash
   API_URL=https://mdviewer-api.your-subdomain.workers.dev
   FRONTEND_URL=https://your-domain.com
   ```
   
   For local development:
   ```bash
   API_URL=http://localhost:8787
   FRONTEND_URL=http://localhost:3000
   ```
   
   **Important**: These environment variables are required. The app will not work without them.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start            # Preview production build locally

# Deployment
npm run cf:deploy    # Build and deploy to Cloudflare Pages

# Code Quality
npm run lint         # Run ESLint
```

---

## 📖 Usage

### Editor

1. Navigate to the [Editor](https://markview.pages.dev/editor/)
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

- `Ctrl+S` / `Cmd+S` - Save current file
- `Ctrl+N` / `Cmd+N` - Create new file
- `Ctrl+E` / `Cmd+E` - Export all data (opens settings export)
- `Ctrl+O` / `Cmd+O` - Import backup file (opens file picker)
- `Ctrl+/` / `Cmd+/` - Toggle keyboard shortcuts help

### Solo Mode

On large screens, use the layout toggle to switch between:
- **Split View** - Editor and preview side by side
- **Editor Only** - Focus on writing
- **Preview Only** - Focus on reading

### Settings

Access settings from the navbar to configure:
- **Theme**: Light, dark, or system preference
- **Auto-Save**: Enable/disable automatic saving
- **Keyboard Shortcuts**: Enable/disable keyboard shortcuts
- **Default Content**: Show default markdown template for new files
- **Items Per Page**: Configure pagination for files page
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

### Features in Action

- **Markdown Support**: Headers, lists, code blocks, tables, blockquotes, links, images
- **GitHub Flavored Markdown**: Task lists, tables, strikethrough, autolinks
- **Syntax Highlighting**: Automatic language detection for code blocks
- **Theme Switching**: Toggle between light and dark modes
- **Share & Collaborate**: Generate shareable links for your markdown content
- **Search Shared Content**: Search for shared markdown by ID or URL
- **Fork Shared Content**: Import shared markdown into your editor

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
│   │   ├── theme/         # Theme components
│   │   ├── ui/            # UI components (button, card)
│   │   ├── deep-link-handler.tsx      # Deep link routing
│   │   ├── global-keyboard-shortcuts.tsx  # Global shortcuts
│   │   └── native-link-protection.tsx     # Native link protection
│   ├── hooks/
│   │   ├── use-import-export.ts  # Export/import logic with encryption
│   │   └── use-platform.ts      # Responsive design detection
│   └── lib/
│       ├── api.ts         # API client
│       ├── config.ts      # App configuration (env vars only)
│       ├── utils.ts       # Encryption and utility functions
│       └── storage/       # Centralized storage system
│           ├── index.ts   # StorageManager class
│           └── helpers.ts # Storage helper functions
├── scripts/
│   ├── generate-icons.js  # Generate app icons from favicon
│   └── README-ICONS.md    # Icon generation guide
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

### Cloudflare Pages

This project is configured for deployment on Cloudflare Pages:

1. **Build command**: `npm run build`
2. **Output directory**: `out`
3. **Root directory**: (leave empty or use `.`)

Or use the provided deployment script:

```bash
npm run cf:deploy
```

The project includes:
- Static export configuration
- Custom 404 page handling
- Redirects configuration for Cloudflare Pages

**Live Site**: [https://markview.pages.dev/](https://markview.pages.dev/)

📖 **For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**

### Environment Variables

**Required**: The app requires these environment variables to be set:

- `API_URL` - Cloudflare Workers API URL
- `FRONTEND_URL` - Frontend website URL

Create a `.env.local` file:
```bash
API_URL=https://mdviewer-api.your-subdomain.workers.dev
FRONTEND_URL=https://your-domain.com
```

**Important**: No defaults are provided to prevent mismatches. The app will fail with clear errors if these are not set.

### Share Feature Setup

To enable the share feature, you need to deploy the Workers API:

1. **Deploy the Workers API:**
   ```bash
   cd workers-api
   npm install
   wrangler r2 bucket create mdviewer
   npm run deploy
   ```

2. **Configure Frontend:**
   - Set `API_URL` environment variable to your Workers API URL
   - Set `FRONTEND_URL` environment variable to your frontend URL
   - The editor will show a warning if the API isn't configured properly

3. **API Endpoints:**
   - `POST /upload` - Upload content (rate limited, 2MB max)
   - `GET /share/:id` - Retrieve shared content

See `workers-api/README.md` for detailed API documentation.

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
- [Vercel](https://vercel.com/) for the deployment inspiration
- [Cloudflare Pages](https://pages.cloudflare.com/) for hosting

---

<div align="center">

**Built with ❤️ using Next.js**

[⬆ Back to Top](#markdown-viewer)

</div>
