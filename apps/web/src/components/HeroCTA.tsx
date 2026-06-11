"use client";

/**
 * Landing hero CTA — owns the 0:00–0:15 hero beat.
 *
 * Signed out: one button, "Sign in with Google" (zkLogin — no wallet, no gas).
 * First session: the vault is minted gasless and the moment is celebrated with
 * live Suiscan links ("your memory now exists on Sui"). Returning users get a
 * quiet "vault live" line. All states reserve the same vertical space so the
 * hero never shifts.
 */

import Link from "next/link";
import { useConnectWallet, useWallets } from "@mysten/dapp-kit";
import { isGoogleWallet } from "@mysten/enoki";
import { isEnokiConfigured } from "@/src/lib/enoki";
import { useVaultBirth } from "@/src/lib/memory/vault";
import { useLetheAccount } from "@/src/lib/demo/mock";

const SUISCAN_OBJ = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
const SUISCAN_TX = (d: string) => `https://suiscan.xyz/testnet/tx/${d}`;
const short = (s: string) => `${s.slice(0, 8)}…${s.slice(-4)}`;

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="h-12 px-6 rounded-md font-semibold grid place-items-center hover:opacity-90 transition shadow-sm"
      style={{ background: "var(--text)", color: "var(--accent)", fontFamily: "var(--font-sans)" }}
    >
      {children}
    </Link>
  );
}

export function HeroCTA() {
  const account = useLetheAccount();
  const wallets = useWallets();
  const { mutate: connect, isPending } = useConnectWallet();
  const vault = useVaultBirth();
  const google = wallets.find((w) => isGoogleWallet(w));

  return (
    <div className="flex flex-col items-center gap-3 min-h-[120px] justify-start">
      {!account && (
        <>
          {google ? (
            <button
              onClick={() => connect({ wallet: google })}
              disabled={isPending}
              className="h-12 px-7 rounded-md text-base font-semibold hover:opacity-90 transition shadow-sm disabled:opacity-60"
              style={{ background: "var(--text)", color: "var(--accent)", fontFamily: "var(--font-sans)" }}
            >
              {isPending ? "Connecting…" : "Sign in with Google"}
            </button>
          ) : isEnokiConfigured() ? (
            <button
              disabled
              className="h-12 px-7 rounded-md text-base font-semibold opacity-60 shadow-sm"
              style={{ background: "var(--text)", color: "var(--accent)", fontFamily: "var(--font-sans)" }}
            >
              Sign in with Google
            </button>
          ) : (
            <span
              className="h-12 px-7 rounded-md grid place-items-center text-sm border"
              style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
              title="Sign-in disabled: set NEXT_PUBLIC_ENOKI_API_KEY + NEXT_PUBLIC_GOOGLE_CLIENT_ID"
            >
              Sign in to start
            </span>
          )}
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            zkLogin · no wallet, no seed phrase, no gas
          </span>
        </>
      )}

      {account && (vault.phase === "checking" || vault.phase === "creating") && (
        <div
          className="rounded-xl border px-6 py-4 flex flex-col items-center gap-2 w-full max-w-md"
          style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
        >
          <div className="lethe-shimmer h-4 w-56 rounded" />
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            {vault.phase === "creating"
              ? "Minting your memory vault on Sui — gasless, owned by you…"
              : "Looking up your vault on Sui…"}
          </span>
        </div>
      )}

      {account && vault.phase === "born" && (
        <div
          className="lethe-card-in rounded-xl border px-6 py-4 flex flex-col items-center gap-2 w-full max-w-md shadow-sm"
          style={{ borderColor: "var(--accent)", background: "var(--bg-panel)" }}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
            Memory vault created on Sui
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-dim)" }}>
            <a className="underline" href={SUISCAN_OBJ(vault.vaultId)} target="_blank" rel="noreferrer">
              vault {short(vault.vaultId)} ↗
            </a>
            {vault.digest && (
              <a className="underline" href={SUISCAN_TX(vault.digest)} target="_blank" rel="noreferrer">
                creation tx ↗
              </a>
            )}
            <span>gas paid by sponsor</span>
          </div>
          <div className="mt-1">
            <PrimaryLink href="/chat">Start your memory →</PrimaryLink>
          </div>
        </div>
      )}

      {account && vault.phase === "ready" && (
        <>
          <PrimaryLink href="/chat">Open Lethe →</PrimaryLink>
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            Vault live on Sui ·{" "}
            <a className="underline" href={SUISCAN_OBJ(vault.vaultId)} target="_blank" rel="noreferrer">
              {short(vault.vaultId)} ↗
            </a>
          </span>
        </>
      )}

      {account && vault.phase === "error" && (
        <div
          className="rounded-xl border px-6 py-4 flex flex-col items-center gap-2 w-full max-w-md"
          style={{ borderColor: "var(--accent-h)", background: "var(--bg-panel)" }}
        >
          <span className="text-sm">Couldn&apos;t set up your vault: {vault.message}</span>
          <button onClick={vault.retry} className="text-xs underline" style={{ color: "var(--text-dim)" }}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
