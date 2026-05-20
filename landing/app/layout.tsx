import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Lethe — Persistent memory for Sui games",
  description:
    "Your NPCs remember every player. 3 lines of code. Backed by Walrus. Built for Sui game devs.",
  openGraph: {
    title: "Lethe — Persistent memory for Sui games",
    description: "NPCs that remember every player. 3 lines of code.",
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