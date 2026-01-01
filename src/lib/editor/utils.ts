/**
 * Editor Utility Functions
 * 
 * Helper functions for filename suggestions, stats, etc.
 */

/**
 * Get suggested filename from content (first line, max 20 chars)
 */
export function getSuggestedFilename(content: string): string {
    const firstLine = content.trim().split('\n')[0];
    if (!firstLine) return 'untitled';
    
    const suggested = firstLine
        .substring(0, 20)
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase();
    
    if (suggested && suggested.length > 0 && suggested !== 'untitled') {
        return suggested.length > 17 ? suggested.substring(0, 17) + '...' : suggested;
    }
    return 'untitled';
}

/**
 * Get editor stats (word count, char count, reading time)
 */
export function getStats(content: string) {
    const text = content.trim();
    if (!text) {
        return { words: 0, characters: 0, readingTime: 0 };
    }
    
    const words = text.split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    // Average reading speed: 200 words per minute
    const readingTime = Math.ceil(words / 200);
    
    return { words, characters, readingTime };
}

