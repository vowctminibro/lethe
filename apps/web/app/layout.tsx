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
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400", "500", "600"],
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
