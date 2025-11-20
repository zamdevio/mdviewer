import type { Metadata } from "next";
import EditorPage from "@/components/pages/editor";

export const metadata: Metadata = {
  title: "Markdown Editor - Live Preview Editor",
  description: "Real-time markdown editor with GitHub-style preview. See your markdown render instantly as you type.",
};

export default function Editor() {
  return <EditorPage />;
}