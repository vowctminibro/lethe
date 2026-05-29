# Lethe Hero Flow — ~80 seconds

Concept: **create → own** an AI art collectible. Curated traits → one locked
style → MiniMax generates → stored on Walrus → minted as a Sui NFT, gasless.
(Battle/leaderboard is a separate, later phase — teased only.)

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

## 1:00–1:20  View ownership
The piece appears in **My collection** (`/me`), its image fetched live from the
Walrus aggregator by `blobId`. A link opens the object/tx on Sui Explorer, where
the embedded `blobId` is visible on-chain. Ownership is real and provable.

## 1:20+  Loop (teaser only)
"Your collectible is ready to battle." → battle/leaderboard ships next.

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
