import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Modern Markdown Viewer",
  description: "The page you're looking for doesn't exist. Return to the homepage or start writing markdown.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function NotFound() {
  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
      </div>

      <div className="text-center space-y-8 max-w-2xl">
        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-9xl sm:text-[12rem] font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-purple-600 dark:from-primary dark:via-blue-400 dark:to-purple-400 animate-gradient bg-[length:200%_auto] leading-none">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/" className="w-full sm:w-auto group">
            <Button 
              size="lg" 
              className="gap-2 shadow-lg shadow-primary/30 w-full sm:w-auto h-14 text-base font-semibold group-hover:shadow-xl group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300"
            >
              <Home className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
              Go Home
            </Button>
          </Link>
          <Link href="/editor" className="w-full sm:w-auto group">
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2 w-full sm:w-auto h-14 text-base font-semibold group-hover:scale-105 group-hover:border-primary/50 transition-all duration-300 backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Start Writing
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            You might be looking for:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/" className="text-primary hover:underline transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/editor" className="text-primary hover:underline transition-colors">
              Editor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

