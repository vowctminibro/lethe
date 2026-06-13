import type { Metadata } from "next";

// Per-page <title> for the client memory page → "Lethe — Your Memory".
export const metadata: Metadata = { title: "Your Memory" };

export default function MemoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
