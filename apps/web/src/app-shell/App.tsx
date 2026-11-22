import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
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

export function App() {
  return (
    <>
      <ServiceWorkerRegister />
      <GlobalKeyboardShortcuts />
      <ThemeProvider>
        <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20 selection:text-primary m-0">
          <Navbar />
          <main className="flex-1 pt-0 sm:pt-4 pb-16 px-4 sm:px-8 max-w-7xl mx-auto w-full m-0">
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
        <Toaster />
        <PWAInstallPrompt />
        <UpdatePrompt />
      </ThemeProvider>
    </>
  );
}
