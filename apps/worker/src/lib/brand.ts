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
  "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAADMElEQVR42u2d3U0jQRCE3S2e4R0RBnIWRHHWOSYQREEWK8JAvJ8juKdD6GRY/8x6uqa+el15PTNVXV3jtcerFQAAAAAcEQ6T/PX7z92pr315unlHAAZEuwojINxbEAHp3mIIiPcWQkC6txgC4r2FEBDvLYSEfO/5Bgvh7QYJ+d5uEBDv7QYJ+d5ukJDvLYKAeO+WkJDv7QYJ+d4iSMj3FkFCvrcIEvK9RRDFBjcZcbmusDuIIuRPxkW97imCXAFrJNXfHVOndW8jAEKfdihMyPcWARmADED1O7tAQr63CGgBtACq39kFEvK9RUALoAVQ/c4ugAPgAFS/swtcKU7s+fG67Ng2293Y20DI1x7f0QLA/sduA4RAQqBW9VfvsRXH9xOPkiFQLWgRAoGeAAh/HmEQB8ABAAIACID+75kDVJ8FvHXcgt7TAkzJr/D+ZACAAICxAHr34NEyQBTYAUzU4XmHRRyLr+cK0AJoAQABAAQAEABAAMANqs8CPqqMZbPd3eIApuRXHA8tACAAMLAAqvVc9Qyg+ruAW2qXFgAQAGguAIX/vAen439+cQAcACAAgAAAAgAIgJ2A0w4ABwCy3wd4Xerem+3ugQxgSv4l7i/jAC9PN++Vfya+RKWOTP53uY4MwC4AIIAjbQOMYf9DOcDcIc1qhziXaQFKLvD8eP1J9D7C5667Vf9QDrDZ7j6PkN1H7tx1HGCAFvCP2H1nCc9dd8XVoTaicHTcV2L3kTx33c3+h2sB51ynBQwUBsHhfPFBEA7QXlVAo/oPDoEVA6HbU7ulilTxt4EPyvevhjj1hQ1dgHMCG50TeEqLzku+Gahj/ewCwPkCwAW0q7+JAyACXfKbtYAzB7E253Dds/jIAOaIljdrsDWcqPzLtt5oPSv+cax+31+0BRAKdchfLAMgAg3yFw2BiEBjPVNx0JAvIgBEUH/94pKTYYdQr3ByxElBflEBIIJ66xM9J0tL6F8Y6ThpyC/iAO5uUKEAksXwnm9UXJyR3aCa0KPyYo0khKoOFyoLqCgGhbYWaouqIASlPCMngKpiUA2x0gLoKYhRdi1DCWAJYfBhFQAAgEHxF8CMhosSDpXwAAAAAElFTkSuQmCC";

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
