import Link from "next/link";

export default function LibraryPage() {
  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-12">
      <Link href="/" className="text-sm text-inkdim hover:text-ink transition">
        ← back
      </Link>

      <header className="mt-8 mb-10">
        <h1 className="text-3xl font-bold tracking-tight">My library</h1>
        <p className="text-inkdim mt-2">
          Stories you own, resolved from your Sui Story NFTs.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-border p-12 text-center">
        <p className="text-inkdim">No stories yet.</p>
        <Link
          href="/play"
          className="inline-block mt-4 h-10 px-5 rounded-md bg-accent text-white font-semibold leading-10 hover:bg-accent-soft transition"
        >
          Start a story
        </Link>
      </div>

      <p className="text-xs text-inkdim mt-10">
        Day 3: lists Story NFTs owned by the signed-in zkLogin address.
      </p>
    </main>
  );
}
