import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { GlobalKeyboardShortcuts } from "@/components/layout/global-keyboard-shortcuts";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { PWAInstallPrompt } from "@/components/pwa/install-prompt";
import { UpdatePrompt } from "@/components/pwa/update-prompt";
import { Loader2 } from "lucide-react";

const HomePage = lazy(() => import("@/components/pages/home"));
const EditorPage = lazy(() => import("@/components/pages/editor"));
const FilesPage = lazy(() => import("@/components/pages/files"));
const SearchPage = lazy(() => import("@/components/pages/search"));
const SharesPage = lazy(() => import("@/components/pages/shares"));
const SharePage = lazy(() => import("@/components/pages/share"));
const SettingsPage = lazy(() => import("@/components/pages/settings"));
const NotFoundPage = lazy(() =>
  import("@/routes/NotFound").then((m) => ({ default: m.NotFoundPage })),
);

function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  );
}

function AppShell() {
  const pathname = useLocation().pathname;
  const wide = pathname.startsWith("/editor");

  return (
    <div className="m-0 flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main
        className={`m-0 w-full flex-1 px-4 pb-8 pt-0 sm:px-8 sm:pb-12 sm:pt-4 ${
          wide ? "max-w-[90rem] mx-auto" : "mx-auto max-w-7xl"
        }`}
      >
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/shares" element={<SharesPage />} />
            <Route path="/share" element={<SharePage />} />
            <Route path="/share/:id" element={<SharePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <>
      <ServiceWorkerRegister />
      <GlobalKeyboardShortcuts />
      <ThemeProvider>
        <AppShell />
        <Toaster />
        <PWAInstallPrompt />
        <UpdatePrompt />
      </ThemeProvider>
    </>
  );
}
