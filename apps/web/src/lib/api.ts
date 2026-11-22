/**
 * API client for markdown sharing
 */

import { getEffectiveApiConfig } from "./config";
import {
  ApiRequestError,
  classifyFetchFailure,
  type ApiFailureKind,
} from "./api-errors";

export interface UploadResponse {
  id: string;
  shareUrl: string;
  frontendShareUrl?: string;
  size: number;
  uploadedAt: string;
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
}

export { ApiRequestError, isCorsFailure } from "./api-errors";
export type { ApiFailureKind };

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

export async function uploadMarkdown(content: string): Promise<UploadResponse> {
  const base = apiBase();
  const uploadUrl = `${base}/upload`;
  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
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

export async function fetchSharedMarkdown(id: string): Promise<string> {
  const base = apiBase();
  const shareUrl = `${base}/share/${id}`;
  try {
    const response = await fetch(shareUrl, {
      method: "GET",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiRequestError("http", "Shared content not found", 404);
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
