/**
 * Responsive Design Hook
 * 
 * Provides responsive utilities for dynamic UI/UX adjustments based on screen size
 */

import { useState, useEffect } from 'react';

export interface ResponsiveInfo {
    isMobile: boolean;
    isDesktop: boolean;
}

export function usePlatform(): ResponsiveInfo {
    const [responsive, setResponsive] = useState<ResponsiveInfo>(() => {
        if (typeof window === 'undefined') {
            return {
                isMobile: false,
                isDesktop: true,
            };
        }

        const isMobileDevice = window.innerWidth < 768;
        const isDesktopDevice = window.innerWidth >= 768;

        return {
            isMobile: isMobileDevice,
            isDesktop: isDesktopDevice,
        };
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setResponsive({
                isMobile: window.innerWidth < 768,
                isDesktop: window.innerWidth >= 768,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return responsive;
}

