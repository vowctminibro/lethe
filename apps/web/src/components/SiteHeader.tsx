"use client";

import Link from "next/link";
import {
  useCurrentAccount,
  useConnectWallet,
  useWallets,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { isGoogleWallet } from "@mysten/enoki";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const NAV: { href: string; label: string; key: string }[] = [
  { href: "/create", label: "Create", key: "create" },
  { href: "/me", label: "Collection", key: "me" },
  { href: "/battle", label: "Battle", key: "battle" },
  { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
];

export function SignIn() {
  const account = useCurrentAccount();
  const wallets = useWallets();
  const { mutate: connect, isPending } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  const google = wallets.find((w) => isGoogleWallet(w));
  // Slush is auto-detected via wallet-standard (extension) — secondary option.
  const slush = wallets.find((w) => /slush/i.test(w.name) && !isGoogleWallet(w));

  if (account) {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-dim)" }}>
        <span className="hidden sm:inline">{short(account.address)}</span>
        <button onClick={() => disconnect()} className="underline hover:opacity-70">sign out</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {google ? (
        // Primary, hero path: Google zkLogin (no wallet, no gas).
        <button
          onClick={() => connect({ wallet: google })}
          disabled={isPending}
          className="h-9 px-4 rounded-md text-sm font-semibold disabled:opacity-50"
          style={{ background: "var(--text)", color: "var(--accent)" }}
        >
          {isPending ? "Connecting…" : "Sign in with Google"}
        </button>
      ) : (
        <span className="text-xs" style={{ color: "var(--text-dim)" }} title="Set NEXT_PUBLIC_ENOKI_API_KEY">
          sign-in offline
        </span>
      )}
      {slush && (
        // Secondary, subordinate: connect an existing Slush wallet.
        <button
          onClick={() => connect({ wallet: slush })}
          disabled={isPending}
          className="text-xs underline hover:opacity-70 disabled:opacity-50"
          style={{ color: "var(--text-dim)" }}
        >
          Connect Slush
        </button>
      )}
    </div>
  );
}

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="max-w-5xl mx-auto w-full px-6 py-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <Link href="/" className="font-display text-xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          lethe
        </Link>
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className="transition hover:opacity-100"
              style={{
                color: active === n.key ? "var(--text)" : "var(--text-dim)",
                fontWeight: active === n.key ? 600 : 400,
                opacity: active === n.key ? 1 : 0.8,
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <SignIn />
    </header>
  );
}
