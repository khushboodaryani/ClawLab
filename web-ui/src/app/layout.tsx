import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClawLab — Your Local AI Developer Agent",
  description:
    "ClawLab is a personal AI agent that runs locally on your machine, executes code, manages your terminal, browses the web, and integrates with WhatsApp, Telegram, and more.",
  keywords: ["AI agent", "local AI", "developer tool", "ClawLab", "terminal AI", "WhatsApp AI", "Telegram bot"],
  authors: [{ name: "ClawLab Inc." }],
  openGraph: {
    title: "ClawLab — Your Local AI Developer Agent",
    description: "The AI that actually does things. Runs locally, integrates with any chat app.",
    type: "website",
    url: "https://clawlab.ai",
    siteName: "ClawLab",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClawLab — Your Local AI Developer Agent",
    description: "Local AI agent. Any chat app. Full system access. Private by default.",
  },
  themeColor: "#060608",
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
