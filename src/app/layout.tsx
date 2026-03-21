import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Review — AI-Powered PR Review",
  description: "Code review that organizes diffs, detects moved code, and flags potential bugs.",
};

export const viewport: Viewport = {
  themeColor: "#141414",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ colorScheme: "dark", height: "100%" }}>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
