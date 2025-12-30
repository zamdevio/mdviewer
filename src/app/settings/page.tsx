import type { Metadata } from "next";
import SettingsPage from "@/components/pages/settings";

export const metadata: Metadata = {
  title: "Settings - MD Viewer",
  description: "Customize your MD Viewer experience. Manage theme, privacy settings, and backup your data.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function Settings() {
  return <SettingsPage />;
}

