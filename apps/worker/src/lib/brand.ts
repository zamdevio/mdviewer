/**
 * Worker-hosted brand assets for MCP clients (SEP-973 icons) and browsers.
 * Keep in sync with apps/web/public/favicon.svg.
 */

export const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ec4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#gradient)" opacity="0.1"/>
  <rect x="32" y="24" width="64" height="80" rx="4" fill="url(#gradient)" opacity="0.9"/>
  <rect x="44" y="40" width="40" height="4" rx="2" fill="white" opacity="0.9"/>
  <rect x="44" y="52" width="32" height="4" rx="2" fill="white" opacity="0.7"/>
  <rect x="44" y="64" width="36" height="4" rx="2" fill="white" opacity="0.8"/>
  <rect x="44" y="80" width="24" height="16" rx="2" fill="white" opacity="0.2" stroke="white" stroke-width="1.5" stroke-opacity="0.6"/>
  <path d="M 50 86 L 54 88 L 50 90 M 58 86 L 62 88 L 58 90" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>
`;

/** Absolute icon URLs for MCP initialize / server-card (same origin as /mcp). */
export function mcpIcons(apiOrigin: string) {
  const src = `${apiOrigin.replace(/\/$/, "")}/favicon.svg`;
  return [
    {
      src,
      mimeType: "image/svg+xml",
      sizes: ["any"],
    },
  ];
}
