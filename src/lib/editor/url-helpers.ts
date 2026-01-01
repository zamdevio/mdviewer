/**
 * URL Helpers
 * 
 * Functions for managing URL parameters and navigation
 */

export interface EditorUrlParams {
    loadId: string | null;
    newParam: boolean;
    fileId: string | null;
}

/**
 * Parse editor URL parameters
 */
export function parseEditorUrlParams(): EditorUrlParams {
    if (typeof window === 'undefined') {
        return { loadId: null, newParam: false, fileId: null };
    }

    const urlParams = new URLSearchParams(window.location.search);
    const loadId = urlParams.get('load');
    const newParam = urlParams.get('new') === 'true';
    const fileId = urlParams.get('file');

    return {
        loadId,
        newParam,
        fileId,
    };
}

/**
 * Update editor URL with parameters
 */
export function updateEditorUrl(params: {
    loadId?: string | null;
    fileId?: string | null;
    removeLoad?: boolean;
    removeFile?: boolean;
}): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);

    if (params.removeLoad || params.loadId === null) {
        url.searchParams.delete('load');
    } else if (params.loadId) {
        url.searchParams.set('load', params.loadId);
    }

    if (params.removeFile || params.fileId === null) {
        url.searchParams.delete('file');
    } else if (params.fileId) {
        url.searchParams.set('file', params.fileId);
    }

    window.history.replaceState({}, '', url.toString());
}

/**
 * Clean editor URL (remove all editor params)
 */
export function cleanEditorUrl(): void {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    url.searchParams.delete('load');
    url.searchParams.delete('file');
    url.searchParams.delete('new');
    window.history.replaceState({}, '', url.toString());
}

