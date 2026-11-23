/**
 * API client for markdown sharing (protocol 3)
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
  features?: {
    manageToken?: boolean;
    viewPasswordSeparate?: boolean;
    fixedTtl?: boolean;
    viewProtected?: boolean;
    fairUseFingerprint?: boolean;
    mcp?: boolean;
    llmsTxt?: boolean;
  };
  ttl?: {
    defaultSeconds: number;
    minSeconds: number;
    maxSeconds: number;
  };
  limits?: {
    maxFileBytes: number;
    rotateManageMaxIds: number;
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

function manageHeaders(manageToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${manageToken}`,
    "X-Share-Manage-Token": manageToken,
  };
}

export type UploadShareOptions = {
  manageToken: string;
  /** Disposable view password (only when viewProtected) */
  viewPassword?: string;
  ttlSeconds?: number;
  viewProtected?: boolean;
  filename?: string;
  type?: "file" | "project";
};

function shareCreateHeaders(opts: UploadShareOptions): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "text/plain",
    ...manageHeaders(opts.manageToken),
  };
  if (opts.viewPassword) headers["X-Share-Password"] = opts.viewPassword;
  if (opts.ttlSeconds != null) {
    headers["X-Share-TTL-Seconds"] = String(opts.ttlSeconds);
  }
  if (opts.viewProtected) headers["X-Share-View-Protected"] = "true";
  if (opts.filename) headers["X-Share-Filename"] = opts.filename;
  if (opts.type) headers["X-Share-Type"] = opts.type;
  return headers;
}

export async function uploadMarkdown(
  content: string,
  opts: UploadShareOptions,
): Promise<UploadResponse> {
  const base = apiBase();
  const uploadUrl = `${base}/upload`;
  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: shareCreateHeaders(opts),
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
  manageToken: string,
  opts?: Pick<UploadShareOptions, "filename">,
): Promise<{ id: string; size: number; expiresAt: string; updatedAt: string }> {
  const base = apiBase();
  const url = `${base}/share/${encodeURIComponent(id)}`;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "text/plain",
      ...manageHeaders(manageToken),
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

export async function patchShareViewProtect(
  id: string,
  manageToken: string,
  body: { viewProtected: boolean; viewPassword?: string },
): Promise<PublicShareMeta> {
  const base = apiBase();
  const url = `${base}/share/${encodeURIComponent(id)}`;
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...manageHeaders(manageToken),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      let message = "Failed to update view protection";
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
    throw await toApiRequestError(error, `${base}/health`, "Failed to patch share");
  }
}

export async function deleteRemoteShare(
  id: string,
  manageToken: string,
): Promise<void> {
  const base = apiBase();
  const url = `${base}/share/${encodeURIComponent(id)}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: manageHeaders(manageToken),
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

export async function rotateManageTokens(
  shareIds: string[],
  oldManageToken: string,
  newManageToken: string,
): Promise<{ updated: string[]; failed: Array<{ id: string; error: string }> }> {
  const base = apiBase();
  const url = `${base}/share/rotate-manage`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...manageHeaders(oldManageToken),
      },
      body: JSON.stringify({ shareIds, newManageToken }),
    });
    if (!response.ok) {
      let message = "Failed to rotate manage token";
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
    throw await toApiRequestError(error, `${base}/health`, "Failed to rotate manage token");
  }
}

/** Chunk rotate calls using compatibility limit (default 50). */
export async function rotateManageTokensBatched(
  shareIds: string[],
  oldManageToken: string,
  newManageToken: string,
  maxPerBatch = 50,
): Promise<{ updated: string[]; failed: Array<{ id: string; error: string }> }> {
  const updated: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];
  const size = Math.max(1, maxPerBatch);
  for (let i = 0; i < shareIds.length; i += size) {
    const chunk = shareIds.slice(i, i + size);
    const result = await rotateManageTokens(chunk, oldManageToken, newManageToken);
    updated.push(...result.updated);
    failed.push(...result.failed);
  }
  return { updated, failed };
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
  protocol: 3;
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
  viewPassword?: string,
): Promise<string> {
  const base = apiBase();
  const shareUrl = `${base}/share/${id}`;
  try {
    const headers: Record<string, string> = {};
    if (viewPassword) headers["X-Share-Password"] = viewPassword;
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
