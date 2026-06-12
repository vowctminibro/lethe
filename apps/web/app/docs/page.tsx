import Link from "next/link";

export default function DocsOverview() {
  return (
    <>
      <h1>Lethe</h1>
      <p>
        Lethe is user-owned memory for AI agents. What an agent learns about you is encrypted in
        your browser, stored as blobs on Walrus, and referenced by a Sui object you own. Any app
        you authorize can use it; revoke the grant and it stops — live, enforced on-chain.
      </p>
      <p className="dim">
        Live on Sui testnet today at{" "}
        <a href="https://lethe-gold.vercel.app">lethe-gold.vercel.app</a>. Built solo for Sui
        Overflow 2026, Walrus track.
      </p>

      <h2>Quickstart — the whole loop in two minutes</h2>
      <ol>
        <li>
          <Link href="/">Sign in with Google</Link> — zkLogin creates your address, an
          Enoki-sponsored transaction mints your memory vault. No wallet, no gas, no seed phrase.
        </li>
        <li>
          In <Link href="/chat">/chat</Link>, press <em>Analyze my on-chain activity</em> — Lethe
          reads your real Sui history and suggests trait cards. Nothing saves until you press
          Save.
        </li>
        <li>
          Tell it something durable (&ldquo;I never trade with leverage&rdquo;) — watch the fact
          settle into the memory rail with live Walrus and Suiscan links.
        </li>
        <li>
          Open <Link href="/memory">/memory</Link> — every entry, the apps you&rsquo;ve
          authorized, per-entry forget, and export. This is the ownership surface.
        </li>
        <li>
          Grant <Link href="/pulse">Pulse</Link> (a second, visually distinct app) — it greets you
          already knowing your style, from the same vault.
        </li>
        <li>Revoke Pulse on /memory, reload /pulse — it knows nothing. That is the product.</li>
      </ol>

      <h2>What makes it different</h2>
      <ul>
        <li>Memory is an owned Sui object, not a row in someone&rsquo;s database.</li>
        <li>
          Seal threshold encryption end-to-end: Lethe&rsquo;s servers cannot read your memories
          (see <Link href="/docs/security">Security</Link>).
        </li>
        <li>Model-independent: switch the answering model mid-chat; memory follows you.</li>
        <li>
          Export and leave any day — <em>we lock you in with value, not custody</em>.
        </li>
      </ul>

      <p className="dim">
        Next: <Link href="/docs/concepts">Concepts</Link> ·{" "}
        <Link href="/docs/sdk">SDK</Link> · <Link href="/docs/security">Security</Link>
      </p>
    </>
  );
}
