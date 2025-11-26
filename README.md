<div align="center">

   # Markdown Viewer
   
**A premium, high-performance Markdown viewer built for the modern web**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-markview.pages.dev-blue?style=for-the-badge)](https://markview.pages.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**[🌐 Live Demo](https://markview.pages.dev/)** • **[✍️ Editor](https://markview.pages.dev/editor/)** • **[📖 Documentation](#)**

</div>

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

### 🎯 Additional Features

- **📄 Beautiful Typography** - Optimized reading experience with carefully selected fonts and spacing
- **🔒 Privacy First** - Everything runs client-side, your content never leaves your browser
- **🎭 Custom 404 Page** - Elegant error page with helpful navigation
- **⚙️ Zero Configuration** - Start writing immediately, no signup required

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

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

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
4. Your content is automatically saved to local storage

### Solo Mode

On large screens, use the layout toggle to switch between:
- **Split View** - Editor and preview side by side
- **Editor Only** - Focus on writing
- **Preview Only** - Focus on reading

### Features in Action

- **Markdown Support**: Headers, lists, code blocks, tables, blockquotes, links, images
- **GitHub Flavored Markdown**: Task lists, tables, strikethrough, autolinks
- **Syntax Highlighting**: Automatic language detection for code blocks
- **Theme Switching**: Toggle between light and dark modes
- **Share & Collaborate**: Generate shareable links for your markdown content

---

## 🏗️ Project Structure

```
mdviewer/
├── public/                 # Static assets
│   ├── favicon.svg        # Site favicon
│   └── _redirects         # Cloudflare Pages redirects
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   ├── editor/
│   │   │   └── page.tsx   # Editor page
│   │   ├── not-found.tsx  # 404 page
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   ├── pages/         # Page components
│   │   ├── layout/        # Layout components
│   │   ├── theme/         # Theme components
│   │   └── ui/            # UI components
│   └── lib/               # Utility functions
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
   - Update `src/lib/config.ts` with your Workers API URL
   - Or set `NEXT_PUBLIC_API_URL` environment variable
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
