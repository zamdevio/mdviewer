/**
 * Share Handlers
 *
 * Business logic for sharing markdown content (protocol 3).
 */

import {
  uploadMarkdown,
  replaceSharedMarkdown,
  patchShareViewProtect,
  isCorsFailure,
  type UploadShareOptions,
} from '@/lib/api';
import { isApiConfigured, getEffectiveApiConfig } from '@/lib/config';
import {
  addSharedLink,
  getSavedFiles,
  getSettings,
  upsertSavedFile,
  type SharedLink,
} from '@/lib/storage';
import type { EditorState } from '@/types';

interface ShareResult {
  success: boolean;
  shareUrl?: string;
  shareId?: string;
  expiresAt?: string;
  sharedLink?: SharedLink;
  error?: string;
  requiresSave?: boolean;
  requiresManageToken?: boolean;
  shouldShowApiWarning?: boolean;
  shouldShowCorsWarning?: boolean;
}

export type ShareActionOptions = {
  mode?: 'create' | 'replace' | 'existing';
  existingShareId?: string | null;
  viewPassword?: string;
  ttlSeconds?: number;
  viewProtected?: boolean;
};

/**
 * Share markdown content (create or replace).
 */
export async function handleShare(
  markdown: string,
  editorState: EditorState,
  options: ShareActionOptions = {},
): Promise<ShareResult> {
  if (!markdown.trim()) {
    return {
      success: false,
      error: 'Cannot share empty content',
    };
  }

  const { currentFileName } = editorState;

  if (!currentFileName) {
    return {
      success: false,
      requiresSave: true,
      error: 'Please save this content with a filename before sharing',
    };
  }

  if (!isApiConfigured()) {
    return {
      success: false,
      shouldShowApiWarning: true,
      error: 'API not configured. Please configure the API URL to use the share feature.',
    };
  }

  const manageToken = getSettings()?.manageToken?.trim() ?? '';
  if (!manageToken) {
    return {
      success: false,
      requiresManageToken: true,
      error: 'Manage token required. Open Settings → Manage token.',
    };
  }

  const filename = `${currentFileName}.md`;
  const uploadOpts: UploadShareOptions = {
    manageToken,
    viewPassword: options.viewPassword,
    ttlSeconds: options.ttlSeconds,
    viewProtected: options.viewProtected,
    filename,
    type: 'file',
  };

  try {
    let resultId: string;
    let frontendShareUrl: string | undefined;
    let expiresAt: string | undefined;

    if (options.mode === 'replace' && options.existingShareId) {
      const updated = await replaceSharedMarkdown(
        options.existingShareId,
        markdown,
        manageToken,
        { filename },
      );
      resultId = updated.id;
      expiresAt = updated.expiresAt;
      const { FRONTEND_URL } = getEffectiveApiConfig();
      frontendShareUrl = `${FRONTEND_URL}/share/${encodeURIComponent(resultId)}`;

      if (options.viewProtected != null) {
        await patchShareViewProtect(resultId, manageToken, {
          viewProtected: Boolean(options.viewProtected),
          viewPassword: options.viewPassword || undefined,
        });
      }
    } else {
      const result = await uploadMarkdown(markdown, uploadOpts);
      resultId = result.id;
      frontendShareUrl = result.frontendShareUrl;
      expiresAt = result.expiresAt;
    }

    const { FRONTEND_URL } = getEffectiveApiConfig();
    const fullUrl =
      frontendShareUrl ||
      `${FRONTEND_URL}/share/${encodeURIComponent(resultId)}`;

    const viewPassword = options.viewProtected
      ? options.viewPassword || undefined
      : undefined;

    const sharedLink: SharedLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      shareId: resultId,
      url: fullUrl,
      preview: markdown.substring(0, 100) + (markdown.length > 100 ? '...' : ''),
      filename,
      timestamp: new Date().toISOString(),
      password: viewPassword,
      expiresAt,
    };
    addSharedLink(sharedLink);

    const files = getSavedFiles();
    const file = files.find(
      (f) =>
        f.filename === currentFileName ||
        f.filename === filename ||
        f.filename === currentFileName.replace(/\.md$/i, ''),
    );
    if (file) {
      upsertSavedFile({
        ...file,
        shareId: resultId,
        sharePassword: options.viewProtected ? viewPassword : undefined,
      });
    }

    return {
      success: true,
      shareUrl: fullUrl,
      shareId: resultId,
      expiresAt,
      sharedLink,
      shouldShowApiWarning: false,
    };
  } catch (error) {
    if (isCorsFailure(error)) {
      return {
        success: false,
        shouldShowCorsWarning: true,
        error: error instanceof Error ? error.message : 'Share blocked by CORS',
      };
    }
    if (error instanceof Error && /fetch|network|Failed to connect/i.test(error.message)) {
      return {
        success: false,
        shouldShowApiWarning: true,
        error: 'Failed to connect to API. Please check your API configuration.',
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share. Please try again.',
    };
  }
}
