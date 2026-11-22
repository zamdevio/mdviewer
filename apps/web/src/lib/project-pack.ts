/**
 * Project share pack — text payload over existing /upload (no worker multipart).
 *
 * Format:
 *   MDVIEWER_PROJECT_V1\n
 *   { "name": "...", "files": [ { "filename", "content" } ] }
 */

export const PROJECT_PACK_MAGIC = "MDVIEWER_PROJECT_V1";

export interface ProjectPackFile {
  filename: string;
  content: string;
}

export interface ProjectPack {
  name: string;
  files: ProjectPackFile[];
}

export function packProject(name: string, files: ProjectPackFile[]): string {
  const body: ProjectPack = {
    name,
    files: files.map((f) => ({
      filename: f.filename.endsWith(".md") ? f.filename : `${f.filename}.md`,
      content: f.content,
    })),
  };
  return `${PROJECT_PACK_MAGIC}\n${JSON.stringify(body)}`;
}

export function tryParseProjectPack(raw: string): ProjectPack | null {
  const text = raw.replace(/^\uFEFF/, "");
  if (!text.startsWith(`${PROJECT_PACK_MAGIC}\n`) && !text.startsWith(`${PROJECT_PACK_MAGIC}\r\n`)) {
    return null;
  }
  const nl = text.indexOf("\n");
  if (nl < 0) return null;
  try {
    const parsed = JSON.parse(text.slice(nl + 1)) as ProjectPack;
    if (!parsed?.name || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      return null;
    }
    return {
      name: String(parsed.name),
      files: parsed.files
        .filter((f) => f && typeof f.filename === "string" && typeof f.content === "string")
        .map((f) => ({
          filename: f.filename.replace(/\.md$/i, "") + ".md",
          content: f.content,
        })),
    };
  } catch {
    return null;
  }
}

/** Fast non-crypto fingerprint for import dedupe (same content → same hash). */
export function contentFingerprint(content: string): string {
  let h = 2166136261;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
