import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "briefing-note-ai",
  description:
    "Convert handwritten company briefing notes into structured Markdown for job hunting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
