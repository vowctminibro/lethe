import Link from "next/link";
import { WORLD_TEMPLATES } from "@lethe/shared";

export default function PlayPage() {
  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-inkdim hover:text-ink transition">
        ← back
      </Link>

      <header className="mt-8 mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Pick your world</h1>
        <p className="text-inkdim mt-2">
          The AI writes Chapter 1 in the world you choose. You steer the rest.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WORLD_TEMPLATES.map((w) => (
          <button
            key={w.id}
            className="text-left p-5 rounded-lg border border-border bg-panel hover:border-accent transition group"
          >
            <div className="font-semibold text-lg group-hover:text-accent-soft transition">
              {w.label}
            </div>
            <p className="text-sm text-inkdim mt-1">{w.blurb}</p>
          </button>
        ))}
      </div>

      <p className="text-xs text-inkdim mt-10">
        Day 3: selecting a world mints the Story NFT and generates Chapter 1.
      </p>
    </main>
  );
}
