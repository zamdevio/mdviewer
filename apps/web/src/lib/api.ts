/**
 * API client for markdown sharing
 */

import { config } from "./config";
import {
  ApiRequestError,
  classifyFetchFailure,
  type ApiFailureKind,
} from "./api-errors";

const API_BASE_URL = config.API_URL;

export interface UploadResponse {
  id: string;
  shareUrl: string; // API URL
  frontendShareUrl?: string; // Frontend route (if provided by API)
  size: number;
  uploadedAt: string;
}

export interface ApiError {
  error: string;
  message: string;
  resetAt?: number;
}

export { ApiRequestError, isCorsFailure } from "./api-errors";
export type { ApiFailureKind };

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
  const uploadUrl = `${API_BASE_URL}/upload`;
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
    throw await toApiRequestError(error, `${API_BASE_URL}/health`, "Failed to upload markdown");
  }
}

export async function fetchSharedMarkdown(id: string): Promise<string> {
  const shareUrl = `${API_BASE_URL}/share/${id}`;
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
    throw await toApiRequestError(error, `${API_BASE_URL}/health`, "Failed to fetch shared content");
  }
}
