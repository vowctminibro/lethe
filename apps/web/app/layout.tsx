import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

export const dynamic = "force-dynamic";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["300", "400", "500", "600"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

const TITLE = "Lethe — AI art collectibles on Sui";
const DESCRIPTION =
  "Create your own AI art collectible on Sui. One Google login — no wallet, no gas. Stored on Walrus.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // Favicon + apple-icon are auto-served from app/icon.svg and app/apple-icon.svg.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1A3A4A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen antialiased bg-[var(--bg)] text-[var(--text)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
