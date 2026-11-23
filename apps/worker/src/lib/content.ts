export { MAX_FILE_SIZE } from "./config";

export const ALLOWED_CONTENT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "text/md",
  "application/x-markdown",
] as const;

/**
 * Share id — 128-bit entropy, lowercase hex only.
 * No `-` / `+` / `/` so a double-click selects the whole id in most UIs.
 */
export function generateId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

export async function extractContent(
  request: Request,
): Promise<{ content: string; contentType: string }> {
  const requestContentType = request.headers.get("Content-Type") || "";
  const requestContentTypeLower = requestContentType.toLowerCase().split(";")[0].trim();

  if (requestContentTypeLower === "multipart/form-data") {
    const formData = await request.formData();
    const file =
      (formData.get("file") as File | null) ||
      (formData.get("content") as File | null) ||
      (formData.get("markdown") as File | null) ||
      (formData.get("text") as File | null);

    if (!file) {
      throw new Error(
        'No file found in form data. Use field name "file", "content", "markdown", or "text"',
      );
    }

    const fileContent = await file.text();
    const fileType = file.type || "text/plain";
    const fileTypeLower = fileType.toLowerCase().split(";")[0].trim();

    if (
      !ALLOWED_CONTENT_TYPES.includes(
        fileTypeLower as (typeof ALLOWED_CONTENT_TYPES)[number],
      ) &&
      fileType !== ""
    ) {
      throw new Error(
        `File type "${fileType}" is not allowed. Only markdown/text/plain content types are accepted.`,
      );
    }

    return { content: fileContent, contentType: fileTypeLower || "text/plain" };
  }

  if (
    ALLOWED_CONTENT_TYPES.includes(
      requestContentTypeLower as (typeof ALLOWED_CONTENT_TYPES)[number],
    )
  ) {
    const content = await request.text();
    return { content, contentType: requestContentTypeLower };
  }

  throw new Error(
    `Content type "${requestContentType}" is not allowed. Use multipart/form-data for file uploads or text/plain for direct text.`,
  );
}
