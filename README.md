# Markdown Viewer

<div align="center">

**A premium, high-performance Markdown viewer built for the modern web**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-markview.pages.dev-blue?style=for-the-badge)](https://markview.pages.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**[🌐 Live Demo](https://markview.pages.dev/)** • **[✍️ Editor](https://markview.pages.dev/editor/)** • **[📖 Documentation](#)**

</div>

---

## ✨ Features

### 🚀 Core Features

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
   git clone https://github.com/zamdevio/markdown.git
   cd markdown
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

---

## 🏗️ Project Structure

```
markdown/
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
├── next.config.ts         # Next.js configuration
├── package.json           # Dependencies
└── README.md             # This file
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

### Share Feature

The share feature allows users to upload their markdown/text content and get a shareable URL. It uses a separate Cloudflare Workers API with R2 storage.

**Architecture:**
```
Frontend (Pages) → Workers API → R2 Storage
```

**Features:**
- 📤 Upload markdown/text (2MB max)
- 🚦 Rate limiting using Durable Objects (10 uploads/minute per IP)
- 🔗 Shareable URLs
- 💾 No database required (uses R2 storage)
- 🔄 Unlimited downloads

**Quick Setup:**

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

**Rate Limiting:**
- Uses Durable Objects for distributed rate limiting
- 10 uploads per minute per IP address
- Works across all worker instances
- No limits on downloads/views

**Storage:**
- Content stored in R2 bucket: `mdviewer`
- Random ID generation (URL-safe base64)
- No expiration (files persist indefinitely)
- Public access via share URLs

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
