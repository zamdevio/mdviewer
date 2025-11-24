import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/toaster";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const cookieValue = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('_th='))
                    ?.split('=')[1] || 'light';
                  const theme = cookieValue === 'dark' ? 'dark' : 'light';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ThemeProvider>
          <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
            <Navbar />
            <main className="flex-1 pt-4 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full">
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
