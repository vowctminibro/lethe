import type { Metadata } from "next";

// Per-page <title> for the client pulse page → "Lethe — Pulse".
export const metadata: Metadata = { title: "Pulse" };

export default function PulseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
