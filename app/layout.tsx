import type { Metadata } from "next";
import "./globals.css";
import "./portal.css";

export const metadata: Metadata = {
  title: {
    default: "PintuEvent",
    template: "%s | PintuEvent",
  },
  description:
    "Temukan, beli, dan kelola tiket event favoritmu dalam satu platform.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: {
      url: "/pintuevent-favicon.png",
      type: "image/png",
    },
    shortcut: "/pintuevent-favicon.png",
    apple: "/pintuevent-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
