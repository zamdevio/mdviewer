import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/toaster";
import { NativeLinkProtection } from "@/components/native-link-protection";
import { DeepLinkHandler } from "@/components/deep-link-handler";
import { GlobalKeyboardShortcuts } from "@/components/global-keyboard-shortcuts";
import { BackButtonHandler } from "@/components/back-button-handler";
import { NativePlatformDetector } from "@/components/native-platform-detector";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Modern Markdown Viewer",
  description: "A premium markdown viewing experience",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-title" content="MDViewer" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // First try to read from localStorage (mdviewer_settings)
                  let theme = 'light';
                  try {
                    const settings = localStorage.getItem('mdviewer_settings');
                    if (settings) {
                      const parsed = JSON.parse(settings);
                      if (parsed.theme && (parsed.theme === 'dark' || parsed.theme === 'light')) {
                        theme = parsed.theme;
                      }
                    }
                  } catch (e) {
                    // Fallback to cookie
                  const cookieValue = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('_th='))
                      ?.split('=')[1];
                    if (cookieValue === 'dark' || cookieValue === 'light') {
                      theme = cookieValue;
                    }
                  }
                  
                  // Apply theme immediately to prevent FOUC
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                  
                  // Sync to cookie for next-themes compatibility
                  document.cookie = '_th=' + theme + '; path=/; max-age=31536000; SameSite=Lax';
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen m-0 p-0`}>
        <NativeLinkProtection />
        <DeepLinkHandler />
        <GlobalKeyboardShortcuts />
        <BackButtonHandler />
        <NativePlatformDetector />
        <ThemeProvider>
          <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20 selection:text-primary m-0">
            <Navbar />
            <main className="flex-1 pt-0 sm:pt-4 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full m-0">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
