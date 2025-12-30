"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Toaster() {
    const { resolvedTheme } = useTheme();
    const [position, setPosition] = useState<"bottom-center" | "bottom-right">("bottom-right");
    
    useEffect(() => {
        const updatePosition = () => {
            // sm screens (< 640px): bottom-right
            // md+ screens (>= 768px): bottom-center
            if (window.innerWidth >= 768) {
                setPosition("bottom-center");
            } else {
                setPosition("bottom-right");
            }
        };
        
        // Set initial position
        updatePosition();
        
        // Update on resize
        window.addEventListener("resize", updatePosition);
        return () => window.removeEventListener("resize", updatePosition);
    }, []);
    
    return (
        <SonnerToaster 
            position={position}
            richColors 
            theme={resolvedTheme as "light" | "dark" | undefined}
        />
    );
}

