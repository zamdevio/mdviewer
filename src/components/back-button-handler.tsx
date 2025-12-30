"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Global back button handler
 * 
 * Handles back button presses with priority:
 * 1. Close any open dialogs/modals
 * 2. Close navbar if open
 * 3. Navigate back in history
 * 4. Exit app if on home page (native only)
 */
// Helper function to check for open dialogs
function hasOpenDialog(): boolean {
    // Check for dialogs by looking for fixed overlays with backdrop blur or black background
    const dialogs = document.querySelectorAll('div.fixed.inset-0');
    for (const dialog of Array.from(dialogs)) {
      const styles = window.getComputedStyle(dialog);
      if (styles.display !== 'none' && styles.zIndex !== 'auto') {
        // Check if it has backdrop styling (backdrop-blur, bg-black, etc.)
        const hasBackdrop = dialog.classList.contains('backdrop-blur') || 
                           dialog.classList.contains('bg-black') ||
                           styles.backgroundColor.includes('rgba(0, 0, 0') ||
                           styles.backdropFilter !== 'none';
        if (hasBackdrop) {
          return true;
        }
      }
    }
  return false;
}

// Helper function to close open dialog
function closeDialog(): boolean {
    const dialogs = document.querySelectorAll('div.fixed.inset-0');
    for (const dialog of Array.from(dialogs)) {
      const styles = window.getComputedStyle(dialog);
      if (styles.display !== 'none' && styles.zIndex !== 'auto') {
        const hasBackdrop = dialog.classList.contains('backdrop-blur') || 
                           dialog.classList.contains('bg-black') ||
                           styles.backgroundColor.includes('rgba(0, 0, 0') ||
                           styles.backdropFilter !== 'none';
        if (hasBackdrop) {
          // Try to find close button (X icon or Cancel/Close text)
          const allButtons = dialog.querySelectorAll('button');
          for (const button of Array.from(allButtons)) {
            const text = button.textContent?.toLowerCase() || '';
            const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
            const hasXIcon = button.querySelector('svg')?.classList.toString().includes('X') || false;
            
            if (text.includes('cancel') || text.includes('close') || 
                ariaLabel.includes('close') || ariaLabel.includes('cancel') ||
                hasXIcon) {
              (button as HTMLElement).click();
              return true;
            }
          }
          
          // Click backdrop as last resort
          (dialog as HTMLElement).click();
          return true;
        }
      }
    }
  return false;
}

// Helper function to close navbar
function closeNavbar(): boolean {
    const navbar = document.querySelector('nav');
    if (navbar) {
      const mobileMenu = navbar.querySelector('[class*="absolute"], [class*="fixed"]');
      if (mobileMenu) {
        const isMenuOpen = window.getComputedStyle(mobileMenu).display !== 'none';
        if (isMenuOpen) {
          // Find toggle button (has Menu or X icon)
          const toggleButtons = navbar.querySelectorAll('button');
          for (const button of Array.from(toggleButtons)) {
            const svg = button.querySelector('svg');
            if (svg) {
              const svgClasses = svg.classList.toString();
              if (svgClasses.includes('X') || svgClasses.includes('Menu')) {
                (button as HTMLElement).click();
                return true;
              }
            }
          }
        }
      }
  }
  return false;
}

export function BackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Web: Use browser back button (popstate event)
    const handlePopState = (event: PopStateEvent) => {
      // Check if we should close dialogs/navbar instead of navigating
      if (hasOpenDialog()) {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
        closeDialog();
        return;
      }
      
      if (closeNavbar()) {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [router, pathname]);

  return null;
}

