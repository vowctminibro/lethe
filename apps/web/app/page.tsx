import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-accent grid place-items-center font-bold text-white">
            λ
          </div>
          <span className="font-semibold text-lg">Lethe</span>
          <span className="text-xs text-inkdim ml-2 px-2 py-0.5 rounded border border-border">
            Sui Overflow 2026
          </span>
        </div>
        <Link
          href="/library"
          className="text-sm text-inkdim hover:text-ink transition"
        >
          My library
        </Link>
      </nav>

      <section className="flex-1 max-w-3xl mx-auto w-full px-6 flex flex-col items-center justify-center text-center gap-8 py-20">
        <div className="inline-flex items-center gap-2 text-xs text-accent-soft">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          Persistent AI storytelling
        </div>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
          Write a story that
          <br />
          remembers itself.
        </h1>
        <p className="text-inkdim text-lg max-w-xl">
          Pick a world. The AI writes the opening; you steer what happens next.
          Every chapter is stored on Walrus and your story becomes a Sui NFT you
          own — no wallet, no seed phrase.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/play"
            className="h-12 px-6 rounded-md bg-accent text-white font-semibold grid place-items-center hover:bg-accent-soft transition"
          >
            Sign in with Google
          </Link>
          <span className="text-xs text-inkdim">
            zkLogin creates your Sui address invisibly
          </span>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto w-full px-6 py-8 text-xs text-inkdim flex items-center justify-between border-t border-border">
        <span>Lethe — Walrus track, Sui Overflow 2026</span>
        <a
          href="https://github.com/vowctminibro/lethe"
          className="hover:text-ink transition"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
