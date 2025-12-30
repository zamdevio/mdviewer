"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Deep Link Handler Component
 * 
 * Handles deep links for the app (web only):
 * - https://your-domain.com/editor - Opens editor
 * - https://your-domain.com/share?id=abc123 - Opens shared content
 */
export function DeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    // Handle URL-based deep links on web
    if (typeof window === 'undefined') return

    try {
      const urlObj = new URL(window.location.href)
      
      // Handle https:// scheme
      if (urlObj.protocol === 'https:' || urlObj.protocol === 'http:') {
        if (urlObj.pathname === '/editor' || urlObj.pathname.startsWith('/editor/')) {
          router.push('/editor')
        } else if (urlObj.pathname.startsWith('/share')) {
          // Extract share ID from query params or path
          const shareId = urlObj.searchParams.get('id') || urlObj.pathname.split('/').pop()
          if (shareId) {
            router.push(`/share?id=${shareId}`)
          } else {
            router.push('/share')
          }
        }
      }
    } catch (error) {
      console.error('Error handling deep link:', error)
    }
  }, [router])

  return null
}

