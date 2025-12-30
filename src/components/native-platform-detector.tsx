"use client";

import { useEffect } from 'react';

/**
 * Platform Detector
 * 
 * Sets data attribute on body for CSS targeting platforms
 */
export function NativePlatformDetector() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Always set to web platform
    document.body.setAttribute('data-platform', 'web');
  }, []);

  return null;
}

