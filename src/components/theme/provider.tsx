"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: Omit<ThemeProviderProps, 'defaultTheme' | 'enableSystem'>) {
    // Read theme from localStorage (mdviewer_settings) first, then cookie, or use light as default
    let defaultTheme: "light" | "dark" = "light";
    if (typeof document !== "undefined") {
        try {
            // Try localStorage first (mdviewer_settings)
            const settings = localStorage.getItem('mdviewer_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                if (parsed.theme && (parsed.theme === 'dark' || parsed.theme === 'light')) {
                    defaultTheme = parsed.theme;
                }
            }
        } catch (e) {
            // Fallback to cookie
            try {
                const cookieValue = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('_th='))
                    ?.split('=')[1] || 'light';
                defaultTheme = cookieValue === 'dark' ? 'dark' : 'light';
            } catch {
                defaultTheme = 'light';
            }
        }
    }

    return (
        <NextThemesProvider
            {...props}
            attribute="class"
            defaultTheme={defaultTheme}
            enableSystem={false}
            storageKey="_th"
            disableTransitionOnChange
        >
            {children}
        </NextThemesProvider>
    )
}
