"use client";

import { useEffect, useRef } from "react";
import 'katex/dist/katex.min.css';

/**
 * Math/LaTeX Component
 * Renders inline and block math using KaTeX
 */
export function MarkdownMath({ 
    children, 
    inline = false 
}: { 
    children: string; 
    inline?: boolean;
}) {
    const mathRef = useRef<HTMLSpanElement | HTMLDivElement>(null);

    useEffect(() => {
        if (!mathRef.current) return;

        const renderMath = async () => {
            try {
                const katex = (await import('katex')).default;
                
                if (inline) {
                    katex.render(children, mathRef.current as HTMLSpanElement, {
                        throwOnError: false,
                        displayMode: false,
                    });
                } else {
                    katex.render(children, mathRef.current as HTMLDivElement, {
                        throwOnError: false,
                        displayMode: true,
                    });
                }
            } catch (err) {
                console.error('KaTeX rendering error:', err);
                if (mathRef.current) {
                    mathRef.current.textContent = children;
                }
            }
        };

        renderMath();
    }, [children, inline]);

    if (inline) {
        return <span ref={mathRef as React.RefObject<HTMLSpanElement>} className="math-inline" />;
    }

    return (
        <div className="my-4 overflow-x-auto">
            <div ref={mathRef as React.RefObject<HTMLDivElement>} className="math-block" />
        </div>
    );
}

