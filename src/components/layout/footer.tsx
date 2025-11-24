"use client"

import Link from "next/link"
import { FileText } from "lucide-react"

export function Footer() {
    return (
        <footer className="relative z-50 flex items-center justify-center p-4 mt-12">
            <div className="relative flex items-center justify-between w-full max-w-5xl px-4 sm:px-6 py-3 bg-background/70 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400">
                        MDViewer
                    </span>
                </Link>

                <div className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} MDViewer. Built with ❤️
                </div>
            </div>
        </footer>
    )
}

