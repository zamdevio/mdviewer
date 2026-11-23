import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { ModalShell } from "@/components/ui/modal-shell";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/storage";
import { getShowDefaultContent } from "@/lib/storage/helpers";

const ONBOARDING_KEY = "mdviewer_onboarding_default_content_v1";

function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return true;
  }
}

function markOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    // ignore quota / private mode
  }
}

/**
 * First visit only: confirm whether the editor should start with sample markdown.
 * Default is On (matches storage defaults). Later: Settings → Editor.
 */
export function FirstRunDefaultsDialog() {
  const [open, setOpen] = useState(false);
  const [showDefault, setShowDefault] = useState(true);

  useEffect(() => {
    if (hasCompletedOnboarding()) return;
    setShowDefault(getShowDefaultContent());
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const finish = (value: boolean) => {
    storage.updateSetting("showDefaultContent", value);
    markOnboardingDone();
    setOpen(false);
    // Nudge editor listeners that settings changed
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <ModalShell
      open={open}
      onClose={() => finish(showDefault)}
      title="Welcome to MDViewer"
      showTitle
    >
      <div className="flex items-start gap-3 pr-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/30">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Start the editor with example markdown so preview, Mermaid, and share are easy to try?
            You can change this anytime under{" "}
            <Link
              to="/settings"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => finish(showDefault)}
            >
              Settings → Editor → Show default content
            </Link>
            .
          </p>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Show default content</p>
              <p className="text-xs text-muted-foreground">Recommended for first run</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant={showDefault ? "default" : "outline"}
              onClick={() => setShowDefault((v) => !v)}
            >
              {showDefault ? "On" : "Off"}
            </Button>
          </div>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <Button type="button" className="w-full sm:flex-1" onClick={() => finish(showDefault)}>
              Continue
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => finish(true)}
            >
              Keep examples on
            </Button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
