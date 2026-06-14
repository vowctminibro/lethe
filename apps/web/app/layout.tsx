import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

export const dynamic = "force-dynamic";

// "Letterpress on water" — Fraunces carries the voice (italic + optical
// sizing), Instrument Sans does the reading, IBM Plex Mono stamps every
// on-chain id. See BRAND.md "Visual identity".
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
});
// Variable axis (not fixed instances) so body can sit at a true 450 — the
// Block 16 "raise the floor" weight that fixes thin/sleepy reading text.
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
});

const TITLE = "Lethe — Memory you own";
const DESCRIPTION =
  "Lethe is user-owned memory for AI agents — stored on Walrus, anchored on Sui, portable across every app.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lethe-gold.vercel.app"),
  // Template lets client pages set a short name → "Lethe — Docs", etc.
  title: { default: TITLE, template: "Lethe — %s" },
  description: DESCRIPTION,
  // Favicon set is auto-served from app/icon.svg (SVG), app/favicon.ico (16/32/48),
  // and app/apple-icon.png (180) — all generated from the brand monogram.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "https://lethe-gold.vercel.app",
    siteName: "Lethe",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lethe — Memory you own" }],
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
      className={`${fraunces.variable} ${instrument.variable} ${plexMono.variable}`}
    >
      <body className="min-h-screen antialiased bg-[var(--bg)] text-[var(--text)]">
        {/* Block 13: arm the scroll-reveal hidden state pre-paint, ONLY when JS
            is on and motion is allowed — so no-JS / reduced-motion render the
            content visible with no flash and no layout shift. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('reveal-ready')}catch(e){}",
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
