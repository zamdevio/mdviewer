/**
 * API client for markdown sharing
 */

import { config } from './config';

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

export async function uploadMarkdown(content: string): Promise<UploadResponse> {
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: content,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'Failed to upload markdown');
  }

  return response.json();
}

export async function fetchSharedMarkdown(id: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/share/${id}`, {
    method: 'GET',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Shared content not found');
    }
    throw new Error('Failed to fetch shared content');
  }

  return response.text();
}

