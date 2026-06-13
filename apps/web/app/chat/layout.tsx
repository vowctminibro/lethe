import type { Metadata } from "next";

// Per-page <title> for the client chat page → "Lethe — Chat".
export const metadata: Metadata = { title: "Chat" };

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
