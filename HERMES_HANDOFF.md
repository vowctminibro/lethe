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
For gasless community voting, add this move-call target on the SAME Enoki app
(testnet, sandbox):

    0x34df9a5a764e7c15cbdbd3782a262066cba0002c40a18d4e00f5b48928e10172::battle::vote

Optionally also allowlist (if you want gasless battle creation too):

    0x34df9a5a764e7c15cbdbd3782a262066cba0002c40a18d4e00f5b48928e10172::battle::create_battle

Steps in the Enoki portal: Sponsored Transactions → add the target(s) above →
Save. Same procedure as the mint target. Battle voting code wiring lands next
session; this only needs the portal allowlist add.

## Notes
- Account is in **sandbox** mode (testnet only). Upgrade plan for mainnet + higher limits.
- Auth Providers: Google client id already configured (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
- No CORS/domain setting needed (sponsor calls are server-side).
