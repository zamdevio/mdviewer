import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 py-16">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold tracking-tight">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Button asChild className="w-full sm:w-auto group">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full sm:w-auto group">
          <Link to="/editor">
            <FileText className="w-4 h-4 mr-2" />
            Editor
          </Link>
        </Button>
      </div>
      <Link
        to="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to home
      </Link>
    </div>
  );
}
