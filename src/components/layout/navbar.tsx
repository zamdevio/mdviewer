"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme"
import { Button } from "@/components/ui/button"
import { FileText, Menu, X } from "lucide-react"
import { useState } from "react"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-4">
            <nav className="relative flex items-center justify-between w-full max-w-5xl px-4 sm:px-6 py-3 bg-background/70 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400">
                        MDViewer
                    </span>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Home
                    </Link>
                    <Link href="/editor" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        Editor
                    </Link>
                    <Link href="https://github.com/zamdevio" target="_blank" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                        GitHub
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <ThemeToggle />
                    <Link href="/editor">
                        <Button variant="default" size="sm">
                            Get Started
                        </Button>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden items-center gap-2">
                    <ThemeToggle />
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl flex flex-col gap-4 md:hidden animate-fade-in">
                        <Link
                            href="/"
                            className="text-sm font-medium p-2 hover:bg-accent rounded-lg transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/editor"
                            className="text-sm font-medium p-2 hover:bg-accent rounded-lg transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            Editor
                        </Link>
                        <Link
                            href="https://github.com/zamdevio"
                            target="_blank"
                            className="text-sm font-medium p-2 hover:bg-accent rounded-lg transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            GitHub
                        </Link>
                        <Link href="/editor" onClick={() => setIsOpen(false)}>
                            <Button className="w-full">Get Started</Button>
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    )
}
