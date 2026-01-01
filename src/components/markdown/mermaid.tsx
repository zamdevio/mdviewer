"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, Copy, Download, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { onStorageChange, getSettings } from "@/lib/storage";
import { toast } from "sonner";

// Track mermaid initialization per theme to allow theme switching
const mermaidInitializedThemes = new Set<string>();

/**
 * Helper function to get Mermaid theme config
 */
function getMermaidThemeConfig(theme: 'dark' | 'default') {
    if (theme === 'dark') {
        return {
            primaryColor: '#58a6ff',
            primaryTextColor: '#c9d1d9',
            primaryBorderColor: '#58a6ff',
            lineColor: '#58a6ff',
            secondaryColor: '#1f6feb',
            tertiaryColor: '#161b22',
            background: '#0d1117',
            mainBkg: '#0d1117',
            secondBkg: '#161b22',
            textColor: '#c9d1d9',
            border1: '#30363d',
            border2: '#21262d',
            arrowheadColor: '#58a6ff',
            clusterBkg: '#161b22',
            clusterBorder: '#30363d',
            defaultLinkColor: '#58a6ff',
            titleColor: '#c9d1d9',
            edgeLabelBackground: '#161b22',
            actorBorder: '#58a6ff',
            actorBkg: '#0d1117',
            actorTextColor: '#c9d1d9',
            actorLineColor: '#58a6ff',
            signalColor: '#c9d1d9',
            signalTextColor: '#c9d1d9',
            labelBoxBkgColor: '#161b22',
            labelBoxBorderColor: '#58a6ff',
            labelTextColor: '#c9d1d9',
            loopTextColor: '#c9d1d9',
            noteBorderColor: '#58a6ff',
            noteBkgColor: '#161b22',
            noteTextColor: '#c9d1d9',
            activationBorderColor: '#58a6ff',
            activationBkgColor: '#1f6feb',
            sequenceNumberColor: '#0d1117',
        };
    }
    return undefined; // Use default theme
}

/**
 * Helper function to enhance SVG line visibility
 */
function enhanceSvgLines(svgElement: SVGElement | null, isDark: boolean) {
    if (!svgElement || !isDark) return;
    
    const paths = svgElement.querySelectorAll('path, line, polyline');
    paths.forEach((path) => {
        const element = path as SVGElement;
        const currentStroke = element.getAttribute('stroke');
        if (!currentStroke || currentStroke === '#333' || currentStroke === '#000000') {
            element.setAttribute('stroke', '#58a6ff');
        }
        const strokeWidth = element.getAttribute('stroke-width');
        if (!strokeWidth || parseFloat(strokeWidth) < 2) {
            element.setAttribute('stroke-width', '2');
        }
    });
}

/**
 * Mermaid Diagram Component
 * 
 * HANDLING FLOW:
 * 1. MarkdownViewer receives markdown content
 * 2. ReactMarkdown parses with remark-gfm plugin
 * 3. Code component handler checks className for "language-mermaid"
 * 4. If detected, returns <MarkdownMermaid code={codeString} />
 * 5. MarkdownMermaid component:
 *    a. Uses useTheme to detect current theme (dark/light)
 *    b. Dynamically imports mermaid library
 *    c. Renders BOTH themes simultaneously:
 *       - Primary: Current theme (shown immediately, loaded first)
 *       - Secondary: Other theme (loaded in background, ready for instant switch)
 *    d. Initializes mermaid with theme-specific config (once per theme)
 *    e. Generates unique diagram IDs for each theme
 *    f. Renders SVG for both themes using mermaid.render()
 *    g. Shows/hides based on current theme (instant theme switching, no re-render)
 * 6. When theme changes, just swaps visibility (instant, no re-render needed)
 */
export function MarkdownMermaid({ code }: { code: string }) {
    const [isLoadingPrimary, setIsLoadingPrimary] = useState(true);
    const [isLoadingSecondary, setIsLoadingSecondary] = useState(true);
    const [errorPrimary, setErrorPrimary] = useState<string | null>(null);
    const [errorSecondary, setErrorSecondary] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const mermaidRefDark = useRef<HTMLDivElement>(null);
    const mermaidRefLight = useRef<HTMLDivElement>(null);
    const diagramIdDarkRef = useRef<string | null>(null);
    const diagramIdLightRef = useRef<string | null>(null);
    const { resolvedTheme } = useTheme();
    
    // State to track theme from storage (for real-time updates)
    const [storageTheme, setStorageTheme] = useState<'dark' | 'light' | 'system' | null>(null);
    const [mounted, setMounted] = useState(false);
    // State to track current theme for immediate updates
    const [currentIsDarkMode, setCurrentIsDarkMode] = useState(false);
    // Debounced code to prevent excessive re-renders while typing
    const [debouncedCode, setDebouncedCode] = useState(code);
    
    // Debounce code updates
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCode(code);
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [code]);
    
    // Listen to storage changes for real-time theme updates

    useEffect(() => {
        setMounted(true);
        
        // Get initial theme from storage
        const settings = getSettings();
        if (settings?.theme) {
            setStorageTheme(settings.theme);
        }
        
        // Listen for storage changes
        const unsubscribe = onStorageChange((key) => {
            // Only react to settings changes
            if (key === 'mdviewer_settings' || key === null) {
                const updatedSettings = getSettings();
                if (updatedSettings?.theme) {
                    setStorageTheme(updatedSettings.theme);
                }
            }
        });
        
        return unsubscribe;
    }, []);
    
    // Determine current theme - check DOM class first (most reliable), then storage, then resolvedTheme
    const getCurrentTheme = useCallback((): 'dark' | 'default' => {
        if (!mounted || typeof document === 'undefined') {
            // During SSR or initial mount, default to light
            return 'default';
        }
        
        // Check DOM class first (most reliable - next-themes applies 'dark' class)
        const hasDarkClass = document.documentElement.classList.contains('dark');
        
        // If storage theme is explicitly set, use it (unless it's 'system')
        if (storageTheme === 'dark') return 'dark';
        if (storageTheme === 'light') return 'default';
        
        // If storage theme is 'system' or null, use DOM class (most accurate)
        if (storageTheme === 'system' || storageTheme === null) {
            return hasDarkClass ? 'dark' : 'default';
        }
        
        // Final fallback to resolvedTheme from next-themes
        return resolvedTheme === 'dark' ? 'dark' : 'default';
    }, [mounted, storageTheme, resolvedTheme]);
    
    // Update theme state immediately when it changes (for instant swapping)
    useEffect(() => {
        if (!mounted) return;
        
        const updateTheme = () => {
            const theme = getCurrentTheme();
            const isDark = theme === 'dark';
            setCurrentIsDarkMode(isDark);
        };
        
        // Update immediately
        updateTheme();
        
        // Watch for DOM class changes (instant theme switching)
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        
        // Also watch for storage changes
        const unsubscribe = onStorageChange((key) => {
            if (key === 'mdviewer_settings' || key === null) {
                updateTheme();
            }
        });
        
        return () => {
            observer.disconnect();
            unsubscribe();
        };
    }, [mounted, storageTheme, resolvedTheme, getCurrentTheme]);
    
    const isDarkMode = currentIsDarkMode;
    const primaryTheme = isDarkMode ? 'dark' : 'default';
    const secondaryTheme = isDarkMode ? 'default' : 'dark';
    
    // Copy Mermaid code to clipboard
    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success('Mermaid code copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
            toast.error('Failed to copy code');
        }
    };
    
    // Save SVG as file
    const handleSaveSVG = () => {
        try {
            const activeRef = isDarkMode ? mermaidRefDark : mermaidRefLight;
            const svgElement = activeRef.current?.querySelector('svg');
            if (!svgElement) {
                toast.error('No diagram to save');
                return;
            }
            
            const svgContent = svgElement.outerHTML;
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `mermaid-diagram-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setSaved(true);
            toast.success('Diagram saved as SVG');
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('Failed to save SVG:', err);
            toast.error('Failed to save diagram');
        }
    };

    // Render primary theme (current theme) - loads first
    useEffect(() => {
        if (!debouncedCode || debouncedCode.trim() === '') {
            setIsLoadingPrimary(false);
            return;
        }

        const renderPrimary = async () => {
            const ref = isDarkMode ? mermaidRefDark : mermaidRefLight;
            if (!ref.current) return;

            try {
                setIsLoadingPrimary(true);
                setErrorPrimary(null);

                // Dynamically import mermaid library
                const mermaid = (await import('mermaid')).default;
                
                // Initialize mermaid for primary theme (if not already initialized)
                // IMPORTANT: mermaid.initialize() is global, so we need to set it before each render
                // We'll re-initialize with the correct theme before rendering each diagram
                const themeKey = `mermaid-${primaryTheme}`;
                if (!mermaidInitializedThemes.has(themeKey)) {
                    mermaidInitializedThemes.add(themeKey);
                }
                
                // Always re-initialize with the correct theme before rendering
                // This ensures the diagram uses the right theme even if another was initialized
                mermaid.initialize({
                    startOnLoad: false,
                    theme: primaryTheme,
                    securityLevel: 'loose',
                    flowchart: {
                        useMaxWidth: true,
                        htmlLabels: true,
                        curve: 'basis',
                    },
                    themeVariables: getMermaidThemeConfig(primaryTheme),
                });

                // Generate unique ID for this diagram
                const id = `mermaid-${primaryTheme}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                if (isDarkMode) {
                    diagramIdDarkRef.current = id;
                } else {
                    diagramIdLightRef.current = id;
                }
                
                // Render the diagram to SVG
                const { svg } = await mermaid.render(id, debouncedCode.trim());
                
                // Insert the rendered SVG into DOM
                if (ref.current) {
                    ref.current.innerHTML = svg;
                    
                    // Enhance line visibility
                    const svgElement = ref.current.querySelector('svg');
                    enhanceSvgLines(svgElement, isDarkMode);
                    
                    setIsLoadingPrimary(false);
                }
            } catch (err) {
                console.error('Mermaid primary rendering error:', err);
                setErrorPrimary(err instanceof Error ? err.message : 'Failed to render Mermaid diagram');
                setIsLoadingPrimary(false);
            }
        };

        renderPrimary();
    }, [debouncedCode, primaryTheme, isDarkMode, storageTheme]); // Re-render when code changes or theme changes (including storage)

    // Render secondary theme (other theme) - loads in background
    useEffect(() => {
        if (!debouncedCode || debouncedCode.trim() === '') {
            setIsLoadingSecondary(false);
            return;
        }

        // Wait a bit before loading secondary to prioritize primary
        const timeoutId = setTimeout(() => {
            const renderSecondary = async () => {
                const ref = isDarkMode ? mermaidRefLight : mermaidRefDark;
                if (!ref.current) return;

                try {
                    setIsLoadingSecondary(true);
                    setErrorSecondary(null);

                    // Dynamically import mermaid library
                    const mermaid = (await import('mermaid')).default;
                    
                    // Initialize mermaid for secondary theme (if not already initialized)
                    // IMPORTANT: Always re-initialize with the correct theme before rendering
                    const themeKey = `mermaid-${secondaryTheme}`;
                    if (!mermaidInitializedThemes.has(themeKey)) {
                        mermaidInitializedThemes.add(themeKey);
                    }
                    
                    // Always re-initialize with the correct theme before rendering
                    // This ensures the diagram uses the right theme even if another was initialized
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: secondaryTheme,
                        securityLevel: 'loose',
                        flowchart: {
                            useMaxWidth: true,
                            htmlLabels: true,
                            curve: 'basis',
                        },
                        themeVariables: getMermaidThemeConfig(secondaryTheme),
                    });

                    // Generate unique ID for this diagram
                    const id = `mermaid-${secondaryTheme}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                    if (isDarkMode) {
                        diagramIdLightRef.current = id;
                    } else {
                        diagramIdDarkRef.current = id;
                    }
                    
                    // Render the diagram to SVG
                    const { svg } = await mermaid.render(id, debouncedCode.trim());
                    
                    // Insert the rendered SVG into DOM (hidden)
                    if (ref.current) {
                        ref.current.innerHTML = svg;
                        
                        // Enhance line visibility
                        const svgElement = ref.current.querySelector('svg');
                        enhanceSvgLines(svgElement, !isDarkMode);
                        
                        setIsLoadingSecondary(false);
                    }
                } catch (err) {
                    console.error('Mermaid secondary rendering error:', err);
                    setErrorSecondary(err instanceof Error ? err.message : 'Failed to render Mermaid diagram');
                    setIsLoadingSecondary(false);
                }
            };

            renderSecondary();
        }, 100); // Small delay to prioritize primary theme

        return () => clearTimeout(timeoutId);
    }, [debouncedCode, secondaryTheme, isDarkMode, storageTheme]); // Re-render when code changes or theme changes (including storage)


    // Show error if both fail
    if (errorPrimary && errorSecondary) {
        return (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500/20 my-4">
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">Mermaid diagram error: {errorPrimary}</p>
                </div>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                    {code}
                </pre>
            </Card>
        );
    }

    const isLoading = isLoadingPrimary || (isLoadingSecondary && !isDarkMode && isLoadingPrimary);
    const showDark = isDarkMode;
    const showLight = !isDarkMode;
    
    // Check if we have a rendered diagram
    const hasRenderedDiagram = (isDarkMode && mermaidRefDark.current?.innerHTML) || 
                                (!isDarkMode && mermaidRefLight.current?.innerHTML);

    return (
        <div className="my-4 relative group">
            {/* Action buttons - Copy code and Save SVG */}
            {hasRenderedDiagram && !isLoading && (
                <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyCode}
                        className="h-8 px-2 bg-background/80 backdrop-blur-sm border"
                        title="Copy Mermaid code"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveSVG}
                        className="h-8 px-2 bg-background/80 backdrop-blur-sm border"
                        title="Save as SVG"
                    >
                        {saved ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            )}
            
            {isLoading && (
                <div className="flex items-center justify-center p-8 absolute inset-0 z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
            )}
            {/* Dark theme diagram */}
            <div
                ref={mermaidRefDark}
                className="mermaid-container flex items-center justify-center overflow-auto"
                style={{ 
                    minHeight: (isLoading && !hasRenderedDiagram) ? '100px' : 'auto',
                    display: showDark ? 'flex' : 'none' // Instant theme switching via display
                }}
                data-mermaid-theme="dark"
                aria-hidden={!showDark}
            />
            {/* Light theme diagram */}
            <div
                ref={mermaidRefLight}
                className="mermaid-container flex items-center justify-center overflow-auto"
                style={{ 
                    minHeight: (isLoading && !hasRenderedDiagram) ? '100px' : 'auto',
                    display: showLight ? 'flex' : 'none' // Instant theme switching via display
                }}
                data-mermaid-theme="default"
                aria-hidden={!showLight}
            />
        </div>
    );
}
