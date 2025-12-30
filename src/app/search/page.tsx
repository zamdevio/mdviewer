import type { Metadata } from "next";
import SearchPage from "@/components/pages/search";

export const metadata: Metadata = {
  title: "Search Shared Content - MD Viewer",
  description: "Search and find shared markdown content by ID or URL. View and fork shared markdown documents.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function Search() {
  return <SearchPage />;
}

