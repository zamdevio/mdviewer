import type { Metadata } from "next";
import SharesPage from "@/components/pages/shares";

export const metadata: Metadata = {
  title: "Shared Links - MD Viewer",
  description: "View and manage your shared markdown links. Open, copy, or delete shared links.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function Shares() {
  return <SharesPage />;
}

