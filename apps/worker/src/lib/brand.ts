/**
 * Worker-hosted brand assets for MCP clients (SEP-973 icons) and browsers.
 * SVG kept in sync with apps/web/public/favicon.svg; PNG is a raster twin for
 * clients that prefer image/png (and for data: URIs in initialize).
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

/** Raster twin (128×128 PNG), base64 without data: prefix. */
export const FAVICON_PNG_128_BASE64 =
  "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";

function decodePng(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function faviconPng128Bytes(): Uint8Array<ArrayBuffer> {
  return decodePng(FAVICON_PNG_128_BASE64);
}

/**
 * Absolute + embedded icons for MCP initialize (SEP-973).
 * data: PNG first — best chance for clients that brand the list;
 * HTTPS PNG/SVG for Inspector / future hosts.
 *
 * Note: Cursor IDE (as of 2026-03 staff reply) may still show a generic MCP
 * glyph even when icons[] is valid — client UI limitation, not a bad handshake.
 */
export function mcpIcons(apiOrigin: string) {
  const origin = apiOrigin.replace(/\/$/, "");
  return [
    {
      src: `data:image/png;base64,${FAVICON_PNG_128_BASE64}`,
      mimeType: "image/png",
      sizes: ["128x128"],
    },
    {
      src: `${origin}/favicon.png`,
      mimeType: "image/png",
      sizes: ["128x128"],
    },
    {
      src: `${origin}/favicon.svg`,
      mimeType: "image/svg+xml",
      sizes: ["any"],
    },
  ];
}
