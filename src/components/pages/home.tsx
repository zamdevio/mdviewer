"use client";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  Code, 
  FileText, 
  Zap, 
  Github, 
  Sparkles, 
  Rocket, 
  Globe, 
  Eye,
  Palette,
  Download,
  Share2,
  Lock,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow delay-500" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] gap-12 sm:gap-16 px-4 sm:px-6 py-20">
        {/* Hero Section */}
        <section className="text-center space-y-8 max-w-5xl w-full">
          {/* Badge */}
          <div 
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            } border-transparent bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 backdrop-blur-sm`}
          >
            <Sparkles className="w-3 h-3 animate-spin-slow" />
            v1.0.0 Now Available
          </div>

          {/* Main Heading */}
          <h1 
            className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-tight transition-all duration-1000 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Markdown,
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-purple-600 dark:from-primary dark:via-blue-400 dark:to-purple-400 animate-gradient bg-[length:200%_auto]">
              Reimagined.
            </span>
          </h1>

          {/* Description */}
          <p 
            className={`text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Experience your documentation like never before. A premium, high-performance Markdown viewer built for the modern web.
          </p>

          {/* CTA Buttons */}
          <div 
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 transition-all duration-1000 delay-300 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link href="/editor" className="w-full sm:w-auto group">
              <Button 
                size="lg" 
                className="gap-2 shadow-lg shadow-primary/30 w-full sm:w-auto h-14 text-base font-semibold group-hover:shadow-xl group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Writing <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </Button>
            </Link>
            <Link href="https://github.com/zamdevio/markdown" target="_blank" className="w-full sm:w-auto group">
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2 w-full sm:w-auto h-14 text-base font-semibold group-hover:scale-105 group-hover:border-primary/50 transition-all duration-300 backdrop-blur-sm"
              >
                <Github className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                View on GitHub
              </Button>
            </Link>
          </div>

        </section>

        {/* Key Features Showcase */}
        <section 
          className={`grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="flex flex-col items-center gap-3 group">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 dark:from-primary/10 dark:to-blue-500/10 p-5 backdrop-blur-sm border border-primary/30 dark:border-primary/20 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
              <FileText className="w-10 h-10 text-primary animate-float" />
            </div>
            <span className="text-sm font-medium text-foreground">Markdown</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-500/10 dark:to-cyan-500/10 p-5 backdrop-blur-sm border border-blue-500/30 dark:border-blue-500/20 group-hover:scale-110 group-hover:-rotate-3 shadow-lg">
              <Eye className="w-10 h-10 text-blue-500 animate-float delay-200" />
            </div>
            <span className="text-sm font-medium text-foreground">Live Preview</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 p-5 backdrop-blur-sm border border-purple-500/30 dark:border-purple-500/20 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
              <Palette className="w-10 h-10 text-purple-500 animate-float delay-400" />
            </div>
            <span className="text-sm font-medium text-foreground">GitHub Style</span>
          </div>
          
          <div className="flex flex-col items-center gap-3 group">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/10 dark:to-teal-500/10 p-5 backdrop-blur-sm border border-emerald-500/30 dark:border-emerald-500/20 group-hover:scale-110 group-hover:-rotate-3 shadow-lg">
              <Code className="w-10 h-10 text-emerald-500 animate-float delay-600" />
            </div>
            <span className="text-sm font-medium text-foreground">Syntax Highlight</span>
          </div>
        </section>

        {/* Features Grid */}
        <section 
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl transition-all duration-1000 delay-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/10 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 group relative overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="p-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-2">Lightning Fast</CardTitle>
              <CardDescription className="text-base">
                Built on Next.js 16 for instant page loads and seamless navigation.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/10 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 group relative overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="p-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
              <CardTitle className="text-2xl mb-2">Beautiful Typography</CardTitle>
              <CardDescription className="text-base">
                Optimized reading experience with carefully selected fonts and spacing.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card to-purple-500/5 border-purple-500/10 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 group relative overflow-hidden backdrop-blur-sm sm:col-span-2 md:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative z-10">
              <div className="p-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Code className="w-8 h-8 text-purple-500" />
              </div>
              <CardTitle className="text-2xl mb-2">Syntax Highlighting</CardTitle>
              <CardDescription className="text-base">
                Rich code block support with automatic language detection and themes.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Additional Feature Cards */}
        <section 
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl transition-all duration-1000 delay-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <Card className="bg-gradient-to-br from-card/50 to-background border-border/50 hover:border-primary/50 hover:scale-[1.02] transition-all duration-500 group backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover:rotate-6 transition-transform duration-300">
                  <Rocket className="w-6 h-6 text-emerald-500" />
                </div>
                <CardTitle className="text-xl">Real-time Preview</CardTitle>
              </div>
              <CardDescription>
                See your markdown render instantly as you type. No delay, no waiting.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-gradient-to-br from-card/50 to-background border-border/50 hover:border-primary/50 hover:scale-[1.02] transition-all duration-500 group backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 group-hover:rotate-6 transition-transform duration-300">
                  <Palette className="w-6 h-6 text-orange-500" />
                </div>
                <CardTitle className="text-xl">GitHub Style</CardTitle>
              </div>
              <CardDescription>
                Matches GitHub's markdown rendering exactly. Familiar and beautiful.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Stats Section */}
        <section 
          className={`w-full max-w-5xl transition-all duration-1000 delay-900 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 group">
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Fast</div>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 group">
              <div className="inline-flex p-3 rounded-xl bg-blue-500/10 mb-3 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">0ms</div>
              <div className="text-sm text-muted-foreground">Delay</div>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 group">
              <div className="inline-flex p-3 rounded-xl bg-purple-500/10 mb-3 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">GitHub</div>
              <div className="text-sm text-muted-foreground">Compatible</div>
            </div>

            <div className="text-center p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 group">
              <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 mb-3 group-hover:scale-110 transition-transform">
                <Lock className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Private</div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section 
          className={`w-full max-w-5xl transition-all duration-1000 delay-1100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 dark:from-primary dark:to-blue-400">
              Perfect For
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you're writing documentation, creating notes, or sharing content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/10 hover:scale-105 transition-all duration-500 group">
              <CardHeader>
                <div className="p-3 w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform">
                  <FileText className="w-7 h-7 text-blue-500" />
                </div>
                <CardTitle className="text-xl mb-2">Documentation</CardTitle>
                <CardDescription>
                  Write and preview technical documentation with ease. Perfect for READMEs and guides.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-card to-purple-500/5 border-purple-500/10 hover:scale-105 transition-all duration-500 group">
              <CardHeader>
                <div className="p-3 w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform">
                  <Download className="w-7 h-7 text-purple-500" />
                </div>
                <CardTitle className="text-xl mb-2">Auto-Save</CardTitle>
                <CardDescription>
                  Your work is automatically saved to local storage. Never lose your progress.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/10 hover:scale-105 transition-all duration-500 group">
              <CardHeader>
                <div className="p-3 w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:rotate-6 transition-transform">
                  <Share2 className="w-7 h-7 text-emerald-500" />
                </div>
                <CardTitle className="text-xl mb-2">Share & Export</CardTitle>
                <CardDescription>
                  Copy, export, or share your markdown. Works seamlessly with all platforms.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Final CTA Section */}
        <section 
          className={`w-full max-w-3xl text-center transition-all duration-1000 delay-1300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="p-12 rounded-3xl bg-gradient-to-br from-card/80 to-primary/5 border border-primary/20 backdrop-blur-sm shadow-2xl">
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Start writing beautiful markdown right now. No signup required, completely free.
            </p>
            <Link href="/editor" className="inline-block group">
              <Button 
                size="lg" 
                className="gap-2 shadow-lg shadow-primary/30 h-14 text-base font-semibold group-hover:shadow-xl group-hover:shadow-primary/40 group-hover:scale-105 transition-all duration-300"
              >
                <Rocket className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                Launch Editor
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}