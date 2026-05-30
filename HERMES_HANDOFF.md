# Lethe — Hermes Hand-off (Enoki allowlist)
# Updated: 2026-05-30

Lethe = consumer app **create → own → battle** (art collectible, Walrus track).

## ✅ DONE — artwork mint allowlist (verified working)
- Target allowlisted: `0xea40338dececbdaacf834cbbdd54187cc73ff874944f81e9e815f253b813e1f1::artwork::mint`
- Network: testnet
- Verified 2026-05-30: gasless sponsored mint executed end-to-end (gas paid by
  Enoki sponsor `0x0dec…`, not the sender). `/api/sponsor` returns a sponsored tx,
  no allowlist/key error. Keys live in `apps/web/.env.local` (gitignored).

## 🔜 TODO — add the BATTLE VOTE target to the Enoki allowlist (next dispatch)

⚠️ The battle package was REPUBLISHED with per-address vote dedup, so the package
id changed. Allowlist ONLY the FINAL target below — the old `0x34df9a5a…` package
is superseded; do NOT allowlist it.

FINAL vote target (testnet, sandbox — same Enoki app as mint):

    0xd44a778db90f4623e3b652098ab5c127e0741575c4193561f3cad97d3ac069c5::battle::vote

Optionally also allowlist (for gasless battle creation by users):

    0xd44a778db90f4623e3b652098ab5c127e0741575c4193561f3cad97d3ac069c5::battle::create_battle

Steps: Enoki portal → Sponsored Transactions → add the target(s) → Save. Then in
`apps/web/.env.local` set `NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED=true` and restart.
Gasless voting then works with NO code change (same path as mint). The vote UI is
already wired and gated on that flag.

## Notes
- Account is in **sandbox** mode (testnet only). Upgrade plan for mainnet + higher limits.
- Auth Providers: Google client id already configured (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
- No CORS/domain setting needed (sponsor calls are server-side).
