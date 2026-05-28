import Link from "next/link";

// Next.js 16.2.6 regression: the internal /_not-found page fails to
// prerender against React 19 ("Cannot read properties of null").
// force-dynamic skips the failing static export step.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-sm flex flex-col items-center text-center gap-5">
        <span className="text-xs text-accent-soft uppercase tracking-widest">
          404 — lost the thread
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          That page isn&apos;t in this story.
        </h1>
        <Link
          href="/"
          className="mt-3 h-11 px-5 inline-flex items-center rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent-soft transition"
        >
          Back to start →
        </Link>
      </div>
    </main>
  );
}
