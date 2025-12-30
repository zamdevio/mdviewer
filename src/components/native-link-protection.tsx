"use client"

import { useEffect } from 'react'

/**
 * Link Protection Component
 * 
 * Prevents link previews, context menus, and long-press behaviors
 * (No-op for web platform)
 */
export function NativeLinkProtection() {
  useEffect(() => {
    // No-op for web platform
    return

    // Prevent context menu (right-click / long-press)
    const preventContextMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Note: We don't prevent touchstart/touchend to allow clicks to work
    // Long press is prevented via contextmenu event below

    // Prevent text selection on links and buttons
    const preventSelection = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' || target.closest('a') || target.closest('button') || target.closest('[role="button"]')) {
        e.preventDefault()
        return false
      }
    }

    // Prevent drag on links (can trigger preview)
    const preventDrag = (e: DragEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' || target.closest('a')) {
        e.preventDefault()
        return false
      }
    }

    // Add event listeners
    // contextmenu prevents long-press menus (but allows clicks)
    document.addEventListener('contextmenu', preventContextMenu, { passive: false, capture: true })
    // selectstart prevents text selection on long press (but allows clicks)
    document.addEventListener('selectstart', preventSelection, { passive: false, capture: true })
    // dragstart prevents drag-to-preview (but allows clicks)
    document.addEventListener('dragstart', preventDrag, { passive: false, capture: true })

    // Also prevent on window level
    window.addEventListener('contextmenu', preventContextMenu, { passive: false, capture: true })

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu, { capture: true })
      document.removeEventListener('selectstart', preventSelection, { capture: true })
      document.removeEventListener('dragstart', preventDrag, { capture: true })
      window.removeEventListener('contextmenu', preventContextMenu, { capture: true })
    }
  }, [])

  return null
}

