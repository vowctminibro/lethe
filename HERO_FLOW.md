# Lethe Hero Flow — ~90 seconds

Concept: **create → own → battle** an AI art collectible. Curated traits → one
locked style → MiniMax generates → stored on Walrus → minted as a Sui NFT, gasless
→ enter it into community battles → climb the leaderboard → loop.

> Status (2026-05-30): create→own LIVE (gasless mint verified end-to-end, images
> load-bearing on Walrus). Battle + leaderboard built on published Move modules
> with real seeded on-chain battles; per-address vote dedup enforced on chain.
> Gasless voting is fully wired and one Enoki allow-list flip away
> (`NEXT_PUBLIC_BATTLE_VOTE_ALLOWLISTED`); tallies shown are live on-chain. Only
> the browser zkLogin Google redirect remains to be exercised in a real browser.

## 0:00–0:15  Sign in
User opens the app and clicks **Sign in with Google**.
Enoki zkLogin generates their Sui address — no wallet, no seed phrase, no popup.

## 0:15–0:40  Pick traits + Generate
No prompt box. User picks from a curated menu — Species / Color / Accessory /
Background. The app assembles a LOCKED prompt (one fixed base style + the chosen
fragments) and MiniMax returns a collectible in seconds, in the collection's
consistent style. Up to 2 regenerates with the same traits if a result looks off.
Rarity (derived from trait weights) is shown.

## 0:40–1:00  Mint & own (gasless)
User clicks **Mint & own**:
1. The image bytes are uploaded to **Walrus** → `blobId` (the image lives on
   Walrus, not in the app).
2. A Sui mint tx (`lethe::artwork::mint`) embeds that `blobId` on-chain and is
   sponsored via **Enoki** — the user pays no gas.

## 1:00–1:15  View ownership
The piece appears in **My collection** (`/me`), image fetched live from Walrus by
`blobId`; a link opens it on Sui Explorer with the `blobId` visible on-chain.

## 1:15–1:35  Battle
On **/battle**, two collectibles go head-to-head with a live on-chain vote tally
(one vote per address, enforced in the Move contract). The user votes for a side
(gasless, sponsored via Enoki — same path as mint); the bar updates and reconciles
with chain. They can also pit two of their own pieces into a new battle.

## 1:35–1:50  Leaderboard → loop
**/leaderboard** ranks collectibles by battle wins (then votes, then rarity) — the
viral, multi-user surface. Seeing a piece climb pulls the user back to **create**
another and enter it. create → own → battle → climb → create again.

---

## Loop is navigable
Shared top-nav (Create · Collection · Battle · Leaderboard) on every page — a
judge can walk the full create → own → battle → leaderboard loop with no dead ends.

---

## Architecture (locked)
- **Identity:** zkLogin via Enoki (Google sign-in, no wallet).
- **Generation:** MiniMax `image-01`, ONE locked style, traits-only (no free text).
- **Storage (load-bearing):** Walrus blob — `image_blob_id` embedded in the NFT.
- **Ownership:** Sui Move NFT `lethe::artwork::Artwork`.
- **Gasless:** Enoki sponsored transactions (mint target on the sponsorship allowlist).

## IN the hero flow (ship bulletproof)
1. Enoki Google sign-in
2. Curated trait menu (no prompt box) + locked-prompt generation
3. MiniMax image generation (+ up to 2 regens)
4. Walrus upload + retrieve (render from aggregator)
5. Sui NFT mint, gasless via Enoki
6. My collection view + Sui Explorer link

## NOT in this phase
- Battle / leaderboard (next prompt)
- Marketplace / trading
- Seal encryption (public collectibles)
- Storytelling / chapters / memory (removed in the pivot)
