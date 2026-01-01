/**
 * Advanced Scroll Management for Editor Modes
 * 
 * Handles scroll position tracking and restoration when switching between editor modes.
 * Only triggers scroll tasks when mode changes occur.
 */

import React from "react";

export type SoloMode = "both" | "editor" | "preview";

export interface ScrollPositions {
    editor: number;
    preview: number;
    page: number;
}

export interface CursorPosition {
    selectionStart: number;
    selectionEnd: number;
}

export interface ScrollManagerConfig {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    editorRef: React.RefObject<HTMLDivElement | null>;
    previewRef: React.RefObject<HTMLDivElement | null>;
    effectiveMode: SoloMode;
    onModeChangeComplete?: () => void;
}

/**
 * Scroll Manager Class
 * Manages scroll positions and cursor tracking for editor modes
 */
export class ScrollManager {
    private scrollPositions: ScrollPositions = {
        editor: 0,
        preview: 0,
        page: 0,
    };
    
    private cursorPosition: CursorPosition | null = null;
    private previousMode: SoloMode | null = null;
    private isModeChanging: boolean = false;
    private isInitialized: boolean = false; // Track if manager has been initialized
    
    config: ScrollManagerConfig;
    
    constructor(config: ScrollManagerConfig) {
        this.config = config;
        // Mark as initialized after first mode is set
        // This prevents scroll restoration on initial mount
        if (config.effectiveMode) {
            this.previousMode = config.effectiveMode;
            this.isInitialized = true;
        }
    }
    
    /**
     * Update cursor position (called from textarea events)
     * This should ONLY be used for tracking, never triggers scroll
     */
    updateCursorPosition(position: CursorPosition | null): void {
        // Always update cursor position for tracking
        // But it will only be used for scroll restoration on mode changes
        this.cursorPosition = position;
    }
    
    /**
     * Get current cursor position
     */
    getCursorPosition(): CursorPosition | null {
        return this.cursorPosition;
    }
    
    /**
     * Save current scroll positions
     */
    private saveScrollPositions(): void {
        const { textareaRef, editorRef, previewRef, effectiveMode } = this.config;
        
        // Save editor scroll position
        // In "both" mode, the textarea itself is scrollable
        if (effectiveMode === "both" && textareaRef.current) {
            this.scrollPositions.editor = textareaRef.current.scrollTop;
        } else if (editorRef.current) {
            this.scrollPositions.editor = editorRef.current.scrollTop;
        }
        
        // Save preview scroll position
        if (previewRef.current) {
            this.scrollPositions.preview = previewRef.current.scrollTop;
        }
        
        // Save page scroll position (editor-only mode uses page scroll)
        if (typeof window !== 'undefined') {
            this.scrollPositions.page = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        }
    }
    
    /**
     * Calculate scroll position from cursor position
     */
    private calculateScrollFromCursor(textarea: HTMLTextAreaElement): number | null {
        if (!this.cursorPosition) return null;
        
        const { selectionStart } = this.cursorPosition;
        
        // Create a temporary textarea to measure text height
        const tempTextarea = document.createElement('textarea');
        const style = window.getComputedStyle(textarea);
        
        // Copy all relevant styles
        tempTextarea.style.position = 'absolute';
        tempTextarea.style.visibility = 'hidden';
        tempTextarea.style.whiteSpace = 'pre-wrap';
        tempTextarea.style.font = style.font;
        tempTextarea.style.fontSize = style.fontSize;
        tempTextarea.style.fontFamily = style.fontFamily;
        tempTextarea.style.lineHeight = style.lineHeight;
        tempTextarea.style.padding = style.padding;
        tempTextarea.style.width = `${textarea.offsetWidth}px`;
        tempTextarea.style.wordWrap = 'break-word';
        tempTextarea.style.border = style.border;
        tempTextarea.style.boxSizing = style.boxSizing;
        tempTextarea.style.margin = style.margin;
        
        // Get text before cursor
        const textBeforeCursor = textarea.value.substring(0, selectionStart);
        tempTextarea.value = textBeforeCursor;
        
        document.body.appendChild(tempTextarea);
        
        // Get the scroll height (height of content before cursor)
        const scrollHeight = tempTextarea.scrollHeight;
        
        document.body.removeChild(tempTextarea);
        
        // Calculate scroll position to show cursor (1/3 from top for better visibility)
        const scrollTop = scrollHeight - (textarea.clientHeight * 0.33);
        
        return Math.max(0, scrollTop);
    }

    /**
     * Calculate page scroll position from cursor position in a textarea
     */
    private calculatePageScrollFromCursor(textarea: HTMLTextAreaElement): number | null {
        if (!this.cursorPosition || typeof window === 'undefined') return null;

        const { selectionStart } = this.cursorPosition;
        const tempTextarea = document.createElement('textarea');
        const style = window.getComputedStyle(textarea);

        tempTextarea.style.position = 'absolute';
        tempTextarea.style.visibility = 'hidden';
        tempTextarea.style.whiteSpace = 'pre-wrap';
        tempTextarea.style.font = style.font;
        tempTextarea.style.fontSize = style.fontSize;
        tempTextarea.style.fontFamily = style.fontFamily;
        tempTextarea.style.lineHeight = style.lineHeight;
        tempTextarea.style.padding = style.padding;
        tempTextarea.style.width = `${textarea.offsetWidth}px`;
        tempTextarea.style.wordWrap = 'break-word';
        tempTextarea.style.border = style.border;
        tempTextarea.style.boxSizing = style.boxSizing;
        tempTextarea.style.margin = style.margin;

        const textBeforeCursor = textarea.value.substring(0, selectionStart);
        tempTextarea.value = textBeforeCursor;

        document.body.appendChild(tempTextarea);
        const cursorOffset = tempTextarea.scrollHeight;
        document.body.removeChild(tempTextarea);

        const rect = textarea.getBoundingClientRect();
        const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
        const targetScroll = currentScroll + rect.top + cursorOffset - (window.innerHeight * 0.33);

        return Math.max(0, targetScroll);
    }
    
    /**
     * Restore scroll position for "both" mode
     * EXCLUSIVE: Only called when switching TO "both" mode, never during editing
     */
    private restoreBothMode(): void {
        const { textareaRef } = this.config;
        
        if (!textareaRef.current) {
            this.isModeChanging = false;
            this.config.onModeChangeComplete?.();
            return;
        }
        
        // EXCLUSIVE: Only restore cursor-based scroll when switching TO "both" mode
        // This cursor position was saved BEFORE the mode change, not during editing
        if (this.cursorPosition) {
            const { selectionStart, selectionEnd } = this.cursorPosition;
            
            // Restore cursor position first
            textareaRef.current.setSelectionRange(selectionStart, selectionEnd);
            
            // Wait for DOM to update, then calculate and scroll
            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    // Calculate and set scroll position based on cursor
                    const scrollTop = this.calculateScrollFromCursor(textareaRef.current);
                    if (scrollTop !== null && !isNaN(scrollTop) && scrollTop >= 0) {
                        textareaRef.current.scrollTop = scrollTop;
                    } else {
                        // Fallback to saved scroll position
                        textareaRef.current.scrollTop = this.scrollPositions.editor;
                    }
                }
                // Reset mode changing flag after scroll completes
                setTimeout(() => {
                    this.isModeChanging = false;
                    this.config.onModeChangeComplete?.();
                }, 50);
            });
        } else {
            // No cursor position, use saved scroll position
            textareaRef.current.scrollTop = this.scrollPositions.editor;
            this.isModeChanging = false;
            this.config.onModeChangeComplete?.();
        }
    }
    
    /**
     * Restore scroll position for "editor" mode
     * ONLY called when switching TO "editor" mode, never during editing
     * In editor mode, scroll to cursor (same as both mode) and fallback to page scroll
     */
    private restoreEditorMode(): void {
        const { textareaRef } = this.config;

        if (textareaRef.current && this.cursorPosition && typeof window !== 'undefined') {
            const { selectionStart, selectionEnd } = this.cursorPosition;
            textareaRef.current.setSelectionRange(selectionStart, selectionEnd);

            requestAnimationFrame(() => {
                if (textareaRef.current) {
                    const targetScroll = this.calculatePageScrollFromCursor(textareaRef.current);
                    if (targetScroll !== null && !isNaN(targetScroll) && targetScroll >= 0) {
                        window.scrollTo({
                            top: targetScroll,
                            behavior: 'instant' as ScrollBehavior
                        });
                    } else {
                        window.scrollTo({
                            top: this.scrollPositions.page,
                            behavior: 'instant' as ScrollBehavior
                        });
                    }
                }
                this.isModeChanging = false;
                this.config.onModeChangeComplete?.();
            });
            return;
        }

        // Fallback to saved page scroll position
        if (typeof window !== 'undefined') {
            window.scrollTo({
                top: this.scrollPositions.page,
                behavior: 'instant' as ScrollBehavior
            });
        }
        this.isModeChanging = false;
        this.config.onModeChangeComplete?.();
    }
    
    /**
     * Restore scroll position for "preview" mode
     */
    private restorePreviewMode(): void {
        const { previewRef } = this.config;
        
        if (previewRef.current) {
            previewRef.current.scrollTop = this.scrollPositions.preview;
        }
        this.isModeChanging = false;
        this.config.onModeChangeComplete?.();
    }
    
    /**
     * Restore scroll positions after mode change
     * EXCLUSIVE: Only triggers when mode actually changes, NEVER during editing
     * 
     * This method is EXCLUSIVELY for mode changes. It will NOT restore scroll if:
     * - The mode hasn't changed (previousMode === newMode)
     * - Called during normal text editing
     * - Called when content changes but mode stays the same
     * - Not initialized yet (first mount)
     * 
     * @param newMode - The new mode to switch to
     * @returns void - Returns early if no mode change detected
     */
    restoreScroll(newMode: SoloMode): void {
        // EXCLUSIVE CHECK 1: Skip on first initialization
        // On first mount, just set the previous mode without restoring scroll
        if (!this.isInitialized) {
            this.previousMode = newMode;
            this.isInitialized = true;
            return; // Don't restore scroll on initial mount
        }
        
        // EXCLUSIVE CHECK 2: Only restore scroll when mode actually changes
        // If previousMode === newMode, this means no mode change occurred
        // This prevents ANY scroll restoration during normal editing
        if (this.previousMode === newMode) {
            return; // No mode change, skip scroll restoration completely
        }
        
        // EXCLUSIVE: Only reach here if mode actually changed (not first mount, not same mode)
        // Save current scroll positions before mode change
        this.saveScrollPositions();
        
        // Update previous mode and set mode changing flag
        // This ensures we only do scroll restoration ONCE per mode change
        this.previousMode = newMode;
        this.isModeChanging = true;
        
        // Use requestAnimationFrame to ensure DOM is ready
        // This ensures scroll restoration happens after DOM updates
        requestAnimationFrame(() => {
            setTimeout(() => {
                switch (newMode) {
                    case "both":
                        // Only restore scroll-to-cursor when switching TO "both" mode
                        this.restoreBothMode();
                        break;
                    case "editor":
                        // Only restore page scroll when switching TO "editor" mode
                        // NO scroll-to-cursor in editor mode to avoid interfering with editing
                        this.restoreEditorMode();
                        break;
                    case "preview":
                        // Only restore preview scroll when switching TO "preview" mode
                        this.restorePreviewMode();
                        break;
                }
            }, 0);
        });
    }
    
    /**
     * Setup scroll listeners for continuous scroll position tracking
     */
    setupScrollListeners(): () => void {
        const { textareaRef, editorRef, previewRef, effectiveMode } = this.config;
        
        const saveScrollPositions = () => this.saveScrollPositions();
        
        const editorElement = editorRef.current;
        const previewElement = previewRef.current;
        const textareaElement = textareaRef.current;
        
        // Add scroll listeners
        if (editorElement) {
            editorElement.addEventListener('scroll', saveScrollPositions, { passive: true });
        }
        
        // In "both" mode, also listen to textarea scroll
        if (effectiveMode === "both" && textareaElement) {
            textareaElement.addEventListener('scroll', saveScrollPositions, { passive: true });
        }
        
        if (previewElement) {
            previewElement.addEventListener('scroll', saveScrollPositions, { passive: true });
        }
        
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', saveScrollPositions, { passive: true });
        }
        
        // Return cleanup function
        return () => {
            if (editorElement) {
                editorElement.removeEventListener('scroll', saveScrollPositions);
            }
            if (effectiveMode === "both" && textareaElement) {
                textareaElement.removeEventListener('scroll', saveScrollPositions);
            }
            if (previewElement) {
                previewElement.removeEventListener('scroll', saveScrollPositions);
            }
            if (typeof window !== 'undefined') {
                window.removeEventListener('scroll', saveScrollPositions);
            }
        };
    }
    
    /**
     * Check if mode is currently changing
     */
    isChangingMode(): boolean {
        return this.isModeChanging;
    }
    
    /**
     * Get current scroll positions
     */
    getScrollPositions(): ScrollPositions {
        return { ...this.scrollPositions };
    }
    
    /**
     * Manually save scroll positions (useful before mode changes)
     */
    savePositions(): void {
        this.saveScrollPositions();
    }
}

