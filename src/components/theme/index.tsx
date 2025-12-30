"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Wait for component to mount and theme to be resolved from cookie
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    // Don't render until we know the actual theme from cookie
    if (!mounted || !theme) {
        // Return empty space to prevent layout shift, but don't show default icon
        return (
            <div className="h-9 w-9" />
        )
    }

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        
        // Sync to localStorage (mdviewer_settings)
        try {
            const settings = localStorage.getItem('mdviewer_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                parsed.theme = newTheme;
                localStorage.setItem('mdviewer_settings', JSON.stringify(parsed));
            } else {
                // Create new settings if doesn't exist
                localStorage.setItem('mdviewer_settings', JSON.stringify({
                    showDefaultContent: false,
                    theme: newTheme,
                    keyboardShortcuts: true,
                    autoSave: true,
                }));
            }
            // Trigger storage event
            window.dispatchEvent(new Event('storage'));
        } catch (e) {
            // Ignore errors
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-9 w-9 rounded-full"
            title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
            {theme === "dark" ? (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
