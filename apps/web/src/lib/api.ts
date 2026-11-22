/**
 * API client for markdown sharing
 */

import { getEffectiveApiConfig } from "./config";
import { ApiRequestError, classifyFetchFailure } from "./api-errors";

export interface UploadResponse {
  id: string;
  shareUrl: string;
  frontendShareUrl?: string;
  /** Worker raw markdown at `/share/:id` */
  contentUrl?: string;
  size: number;
  uploadedAt: string;
  /** Protocol 2+ — fixed wipe time */
  expiresAt?: string;
  viewProtected?: boolean;
  hasPassword?: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  resetAt?: number;
}

export interface CompatibilityResponse {
  name: string;
  version: string;
  protocol: number;
  endpoints: Array<{ method: string; path: string; description?: string }>;
  cors: {
    allowedOriginsConfigured: boolean;
  };
  /** Protocol 2+ */
  features?: {
    password: boolean;
    fixedTtl: boolean;
    viewProtected: boolean;
    fairUseFingerprint: boolean;
    legacyFlatKeys: boolean;
    mcp?: boolean;
    llmsTxt?: boolean;
  };
  ttl?: {
    defaultSeconds: number;
    minSeconds: number;
    maxSeconds: number;
  };
}

export { ApiRequestError, isCorsFailure } from "./api-errors";

function apiBase(): string {
  return getEffectiveApiConfig().API_URL;
}

async function toApiRequestError(
  error: unknown,
  probeUrl: string,
  fallback: string
): Promise<ApiRequestError> {
  if (error instanceof ApiRequestError) return error;

  const kind = await classifyFetchFailure(probeUrl);
  if (kind === "cors") {
    return new ApiRequestError(
      "cors",
      "Share API blocked by CORS. Add this origin to the worker ALLOWED_ORIGINS (e.g. http://localhost:3000 for local dev)."
    );
  }

  return new ApiRequestError(
    "network",
    error instanceof Error ? error.message || fallback : fallback
  );
}

export type UploadShareOptions = {
  password?: string;
  ttlSeconds?: number;
  viewProtected?: boolean;
  filename?: string;
  type?: "file" | "project";
};

function shareMutationHeaders(opts?: UploadShareOptions): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "text/plain",
  };
  if (opts?.password) headers["X-Share-Password"] = opts.password;
  if (opts?.ttlSeconds != null) {
    headers["X-Share-TTL-Seconds"] = String(opts.ttlSeconds);
  }
  if (opts?.viewProtected) headers["X-Share-View-Protected"] = "true";
  if (opts?.filename) headers["X-Share-Filename"] = opts.filename;
  if (opts?.type) headers["X-Share-Type"] = opts.type;
  return headers;
}

export async function uploadMarkdown(
  content: string,
  opts?: UploadShareOptions,
): Promise<UploadResponse> {
  const base = apiBase();
  const uploadUrl = `${base}/upload`;
  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: shareMutationHeaders(opts),
      body: content,
    });

    if (!response.ok) {
      let message = "Failed to upload markdown";
      try {
        const error: ApiError = await response.json();
        message = error.message || message;
      } catch {
        /* ignore body parse */
      }
      throw new ApiRequestError("http", message, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw await toApiRequestError(error, `${base}/health`, "Failed to upload markdown");
  }
}

export async function replaceSharedMarkdown(
  id: string,
  content: string,
  password: string,
  opts?: Pick<UploadShareOptions, "filename">,
): Promise<{ id: string; size: number; expiresAt: string; updatedAt: string }> {
  const base = apiBase();
  const url = `${base}/share/${encodeURIComponent(id)}`;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "text/plain",
      "X-Share-Password": password,
    };
    if (opts?.filename) headers["X-Share-Filename"] = opts.filename;
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: content,
    });
    if (!response.ok) {
      let message = "Failed to update share";
      try {
        const error: ApiError = await response.json();
        message = error.message || message;
      } catch {
        /* ignore */
      }
      throw new ApiRequestError("http", message, response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw await toApiRequestError(error, `${base}/health`, "Failed to update share");
  }
}

export async function deleteRemoteShare(
  id: string,
  password: string,
): Promise<void> {
  const base = apiBase();
  const url = `${base}/share/${encodeURIComponent(id)}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: { "X-Share-Password": password },
    });
    if (!response.ok) {
      let message = "Failed to delete remote share";
      try {
        const error: ApiError = await response.json();
        message = error.message || message;
      } catch {
        /* ignore */
      }
      throw new ApiRequestError("http", message, response.status);
    }
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw await toApiRequestError(error, `${base}/health`, "Failed to delete remote share");
  }
}

export type PublicShareMeta = {
  id: string;
  type: "file" | "project";
  filename: string;
  contentType: string;
  size: number;
  createdAt: string;
  expiresAt: string;
  viewProtected: boolean;
  hasPassword: boolean;
  protocol: 2;
  legacy?: boolean;
};

export async function fetchShareMeta(
  id: string,
): Promise<PublicShareMeta> {
  const base = apiBase();
  const url = `${base}/share/${encodeURIComponent(id)}/meta`;
  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiRequestError("http", "Share metadata not found", 404);
      }
      throw new ApiRequestError("http", "Failed to fetch share metadata", response.status);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw await toApiRequestError(error, `${base}/health`, "Failed to fetch share metadata");
  }
}

export async function fetchSharedMarkdown(
  id: string,
  password?: string,
): Promise<string> {
  const base = apiBase();
  const shareUrl = `${base}/share/${id}`;
  try {
    const headers: Record<string, string> = {};
    if (password) headers["X-Share-Password"] = password;
    const response = await fetch(shareUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiRequestError("http", "Shared content not found", 404);
      }
      if (response.status === 401) {
        throw new ApiRequestError(
          "http",
          "This share is view-protected — password required",
          401,
        );
      }
      throw new ApiRequestError("http", "Failed to fetch shared content", response.status);
    }

    return response.text();
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw await toApiRequestError(error, `${base}/health`, "Failed to fetch shared content");
  }
}

export async function fetchCompatibility(): Promise<CompatibilityResponse> {
  const base = apiBase();
  if (!base) {
    throw new ApiRequestError("network", "Share API URL is not configured");
  }
  const url = `${base}/compatibility`;
  try {
    const response = await fetch(url, { method: "GET", cache: "no-cache" });
    if (!response.ok) {
      throw new ApiRequestError(
        "http",
        "Compatibility endpoint failed",
        response.status
      );
    }
    return response.json();
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw await toApiRequestError(error, `${base}/health`, "Failed to reach compatibility endpoint");
  }
}

export async function testShareConnection(): Promise<{
  health: boolean;
  compatibility: CompatibilityResponse | null;
}> {
  const base = apiBase();
  if (!base) {
    throw new ApiRequestError("network", "Share API URL is not configured");
  }
  const healthRes = await fetch(`${base}/health`, { method: "GET", cache: "no-cache" });
  if (!healthRes.ok) {
    throw new ApiRequestError("http", "Health check failed", healthRes.status);
  }
  let compatibility: CompatibilityResponse | null = null;
  try {
    compatibility = await fetchCompatibility();
  } catch {
    compatibility = null;
  }
  return { health: true, compatibility };
}
