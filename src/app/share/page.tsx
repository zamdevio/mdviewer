import type { Metadata } from "next";
import ShareViewPage from "@/components/pages/share";

export const metadata: Metadata = {
  title: "Shared Markdown - MD Viewer",
  description: "View shared markdown content. Fork shared documents to your editor or copy the share link.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function SharePage() {
  return <ShareViewPage />;
}

