import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tibo Reset Watchdog — Experiment completed",
  description: "The Reset Watchdog experiment is complete. Read the outcome, lessons and historical reports, and explore the project on GitHub.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
