import type { Metadata } from "next";
import HomePage from "@/components/pages/home";

export const metadata: Metadata = {
  title: "Modern Markdown Viewer - Premium Markdown Experience",
  description: "Experience your documentation like never before. A premium, high-performance Markdown viewer built for the modern web with GitHub-style rendering.",
};

export default function Home() {
  return <HomePage />;
}
