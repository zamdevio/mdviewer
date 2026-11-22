/**
 * Editor Constants
 * 
 * Default markdown content and other constants
 */

export const DEFAULT_MARKDOWN = `# Welcome to MDViewer Editor

Start typing to see your markdown render in real-time! This default content showcases all the powerful features available.

## 🎨 Features Showcase

### 📝 Core Features
- **Real-time Preview**: See changes instantly as you type
- **Auto-save**: Your work is automatically saved every 2 seconds
- **GitHub-style Preview**: Matches GitHub's markdown rendering exactly
- **Syntax Highlighting**: Beautiful code highlighting with copy buttons
- **Undo/Redo**: Full undo/redo support (Ctrl+Z / Ctrl+Y) synced across all view modes

### 🎯 View Modes
- **Split View**: Edit and preview side-by-side (desktop)
- **Editor Only**: Focus on writing with expanding textarea
- **Preview Only**: Full-screen preview of your rendered markdown
- **Scroll Synchronization**: Scroll positions preserved when switching modes

### 🔗 Badge Images (Shields.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

Badges automatically display in a single row when placed consecutively!

### 💻 Code Blocks with Copy Button

\`\`\`javascript
// JavaScript example with syntax highlighting
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome, \${name}!\`;
}

greet("MDViewer");
\`\`\`

\`\`\`typescript
// TypeScript example
interface User {
  name: string;
  age: number;
  role: 'admin' | 'user';
}

const user: User = {
  name: "John Doe",
  age: 30,
  role: "admin"
};
\`\`\`

\`\`\`python
# Python example
def fibonacci(n):
    """Calculate Fibonacci number recursively."""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"Fibonacci(10) = {fibonacci(10)}")
\`\`\`

Hover over any code block to see the copy button!

### 🧮 Math/LaTeX Support

Inline math: The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}
$$

### 😊 Emoji Support

You can use emojis directly: 😊 🚀 ⭐ ✅ ❤️ 💡 🎉 👏 💪

Or use shortcodes: :smile: :rocket: :star: :check: :heart: :bulb: :tada: :clap: :muscle:

Emojis work everywhere in your markdown! :fire: :zap: :trophy: :100:

### 📊 Mermaid Diagrams

\`\`\`mermaid
graph TD
    A[Start] --> B{Features Enabled?}
    B -->|Yes| C[Render with All Features]
    B -->|No| D[Basic Rendering]
    C --> E[HTML Support]
    C --> F[Math Support]
    C --> G[Mermaid Diagrams]
    C --> H[Image Lightbox]
    E --> I[Perfect Output!]
    F --> I
    G --> I
    H --> I
\`\`\`

\`\`\`mermaid
sequenceDiagram
    participant U as User
    participant E as Editor
    participant P as Preview
    U->>E: Type Markdown
    E->>P: Real-time Update
    P-->>U: Rendered Output
    U->>E: Edit Code Block
    E->>P: Syntax Highlighted
\`\`\`

### 🖼️ HTML Support

<div align="center">

#### Centered Content with HTML

You can use HTML tags like \`<div align="center">\` to center content!

</div>

<details>
<summary>Click to expand - Collapsible Section</summary>

This is hidden content that can be expanded. Great for FAQs, documentation, or hiding detailed information!

- Item 1
- Item 2
- **Bold text** and *italic text* work here too!
- ~~Strikethrough with double tildes~~ and ~~this is also strikethrough~~.


</details>

### 📸 Image Support


### Standard markdown image
![Placeholder Image](https://picsum.photos/seed/mdviewer/900/260)

### HTML image with width (good test for sanitize + custom img component)
<img src="https://picsum.photos/seed/mdviewer2/1200/600" alt="Large image" width="420" />

### Image that should fail gracefully (broken URL)
![Broken Image](https://example.com/this-should-404.png)

Images support:
- Click to view in lightbox
- Automatic scrolling for large images
- Theme-aware background
- Image sizing: \`![alt](url =200x300)\`

### 📋 Tables

| Feature | Status | Notes |
|---------|--------|-------|
| HTML Support | ✅ | Full sanitization |
| Math/LaTeX | ✅ | KaTeX rendering |
| Mermaid | ✅ | Interactive diagrams |
| Code Blocks | ✅ | Copy button included |
| Badges | ✅ | Auto-row layout |
| Images | ✅ | Lightbox preview |

### 📝 Other Markdown Features

> This is a blockquote demonstrating the styling.
> 
> It can span multiple lines and supports **formatting**.

#### Lists

- Unordered list item 1
- Unordered list item 2
  - Nested item
  - Another nested item
- Unordered list item 3

1. Ordered list item 1
2. Ordered list item 2
3. Ordered list item 3

#### Task Lists

- [x] Completed task
- [x] Another completed task
- [ ] Pending task
- [ ] Another pending task

#### Inline Code

Use \`inline code\` for variables, functions, or technical terms.

#### Strikethrough

You can use strikethrough with double tildes: ~~This text is crossed out~~ and ~~this is also strikethrough~~.

#### Links

[MDViewer GitHub](https://github.com) - Standard markdown links work perfectly!

---

**Happy writing!** 🚀

Try editing this content to see all features in action!
`;

