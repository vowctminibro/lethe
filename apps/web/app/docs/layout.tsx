import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/src/components/Logo";

export const metadata: Metadata = {
  title: "Docs",
  description: "What Lethe is, how the memory vault works, the SDK, and the security model.",
};

const NAV = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/concepts", label: "Concepts" },
  { href: "/docs/sdk", label: "SDK" },
  { href: "/docs/security", label: "Security" },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
        <div className="max-w-5xl mx-auto w-full px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="lethe-id uppercase" style={{ color: "var(--text-dim)" }}>docs</span>
          </div>
          <nav className="flex items-center gap-4 text-sm" style={{ color: "var(--text-dim)" }}>
            <Link href="/chat" className="hover:opacity-70 transition">Open Lethe →</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-6 py-10 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-10">
        <nav className="md:sticky md:top-10 self-start flex md:flex-col gap-3 md:gap-2 flex-wrap">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm hover:opacity-70 transition"
              style={{ color: "var(--text-dim)" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <article className="lethe-docs min-w-0">{children}</article>
      </div>
    </main>
  );
}
