import type { Metadata } from "next";
import FilesPage from "@/components/pages/files";

export const metadata: Metadata = {
  title: "Saved Files - MD Viewer",
  description: "View and manage your saved markdown files. Load files back to the editor or delete them.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function Files() {
  return <FilesPage />;
}

