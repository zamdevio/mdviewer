/**
 * URL Helpers
 *
 * Functions for managing URL parameters and navigation
 */

/**
 * Clean editor URL (remove all editor params)
 */
export function cleanEditorUrl(): void {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.delete("load");
    url.searchParams.delete("file");
    url.searchParams.delete("new");
    window.history.replaceState({}, "", url.toString());
}
