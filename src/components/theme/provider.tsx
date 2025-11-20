"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: Omit<ThemeProviderProps, 'defaultTheme' | 'enableSystem'>) {
    // Read theme from cookie or use light as default
    let defaultTheme: "light" | "dark" = "light";
    if (typeof document !== "undefined") {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('_th='))
            ?.split('=')[1] || 'light';
        defaultTheme = cookieValue === 'dark' ? 'dark' : 'light';
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
