import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getApiConfigStatus } from "@/lib/config";
import { ModalShell } from "@/components/ui/modal-shell";

export function ApiWarningDialog({ show, onClose }: { show: boolean; onClose: () => void }) {
    const apiStatus = getApiConfigStatus();
    if (apiStatus.isConfigured) return null;

    return (
        <ModalShell open={show} onClose={onClose} title="Share feature not available">
            <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-yellow-600 dark:text-yellow-400 mb-1">
                        Share Feature Not Available
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Sharing needs both{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                            VITE_API_URL
                        </code>{" "}
                        and{" "}
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                            VITE_FRONTEND_URL
                        </code>{" "}
                        at build time.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-3">
                        {apiStatus.missingApiUrl && (
                            <li>
                                <code className="bg-muted px-1 rounded text-xs">API_URL</code> is
                                not set
                            </li>
                        )}
                        {apiStatus.missingFrontendUrl && (
                            <li>
                                <code className="bg-muted px-1 rounded text-xs">FRONTEND_URL</code>{" "}
                                is not set
                            </li>
                        )}
                    </ul>
                    <p className="text-xs text-muted-foreground mb-4">
                        Deploy <code className="bg-muted px-1 rounded text-xs">apps/worker</code>,
                        set env from <code className="bg-muted px-1 rounded text-xs">.env.example</code>
                        , then rebuild the web app. Local editing still works offline.
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button asChild variant="outline" size="sm" className="w-full">
                            <Link to="/settings" onClick={onClose}>
                                Open settings
                            </Link>
                        </Button>
                        <Button variant="default" size="sm" onClick={onClose} className="w-full">
                            Got it
                        </Button>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0 flex-shrink-0"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </ModalShell>
    );
}
