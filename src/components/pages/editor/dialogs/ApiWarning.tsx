import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { getApiConfigStatus } from "@/lib/config";
import { useEffect } from "react";

export function ApiWarningDialog({ show, onClose }: { show: boolean; onClose: () => void }) {
    // Handle Esc key to close
    useEffect(() => {
        if (!show) return;
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [show, onClose]);

    if (!show) return null;

    const apiStatus = getApiConfigStatus();
    if (apiStatus.isConfigured) return null;

    return (
        <Card className="p-6 bg-yellow-500/10 border-yellow-500/20 border-2">
            <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-yellow-600 dark:text-yellow-400 mb-2">
                        Share Feature Not Available
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        The share feature requires both <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">API_URL</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">FRONTEND_URL</code> to be configured in your <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">config.ts</code> file.
                    </p>
                    
                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="font-medium mb-2 text-foreground">What&apos;s Missing:</p>
                            <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                                {apiStatus.missingApiUrl && (
                                    <li><code className="bg-muted px-1 rounded text-xs">API_URL</code> is not set</li>
                                )}
                                {apiStatus.missingFrontendUrl && (
                                    <li><code className="bg-muted px-1 rounded text-xs">FRONTEND_URL</code> is not set</li>
                                )}
                            </ul>
                        </div>
                        
                        <div>
                            <p className="font-medium mb-2 text-foreground">Why This Happens:</p>
                            <p className="text-muted-foreground mb-3">
                                The share feature requires a Cloudflare Workers API backend to store and retrieve shared markdown content. Without proper configuration, sharing functionality will not work.
                            </p>
                        </div>
                        
                        <div>
                            <p className="font-medium mb-2 text-foreground">How to Resolve:</p>
                            <ol className="list-decimal list-inside space-y-2 ml-2 text-muted-foreground">
                                <li>
                                    <strong className="text-foreground">Deploy the Workers API:</strong> Check the <code className="bg-muted px-1 rounded text-xs">worker-api/README.md</code> file in the repository for detailed API deployment instructions
                                </li>
                                <li>
                                    <strong className="text-foreground">Set Environment Variables:</strong> Add the following to your <code className="bg-muted px-1 rounded text-xs">.env.local</code> file or deployment platform:
                                    <pre className="bg-muted/50 p-2 rounded mt-1 text-xs font-mono overflow-x-auto">
{`API_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com`}
                                    </pre>
                                </li>
                                <li>
                                    <strong className="text-foreground">For Cloudflare Pages:</strong> Add these as environment variables in your Pages project settings
                                </li>
                                <li>
                                    <strong className="text-foreground">Rebuild:</strong> After setting the variables, rebuild your application
                                </li>
                            </ol>
                        </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onClose}
                            className="w-full"
                        >
                            Got it, I&apos;ll configure it later
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
        </Card>
    );
}

