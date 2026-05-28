import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Next.js 16.2.6 + React 19 regression: static prerender of routes throws
// "Cannot read properties of null (reading 'useContext')". Every Lethe page
// is dynamic anyway (zkLogin session, user-owned stories), so force-dynamic
// at the layout cascades to all routes and skips the broken static export.
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Lethe — Persistent AI storytelling on Sui",
  description:
    "Sign in with Google, pick a world, and write a story that remembers itself. Chapters live on Walrus; each story is a Sui NFT you own.",
  openGraph: {
    title: "Lethe — Persistent AI storytelling on Sui",
    description:
      "AI storytelling with on-chain memory. Your story, owned by you.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}