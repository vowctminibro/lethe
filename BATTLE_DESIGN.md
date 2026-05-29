# Battle — Design (foundation)

## Model chosen: community head-to-head vote

Two artworks go head-to-head; anyone can vote for A or B; votes are tallied
on-chain. Simplest viable, and the right one for this app:

1. **Multi-user & viral** — voting invites everyone (not just the two owners),
   which is the antimemetics multi-user hook; people share a battle to rally votes.
2. **Dead simple & robust** — a shared `Battle` object with two counters and a
   `vote` entry fun. No realtime, no matchmaking server, no combat math to balance.
3. **Composable with rarity** — rarity (already derived from on-chain `traits`) can
   seed pairings or weight later, without being the verdict.

**Rejected: rarity-based auto-resolve.** It needs no users (a script decides the
winner from trait weights), so it adds no social/multiplayer surface — the opposite
of viral. It also makes rarity deterministic-destiny, killing vote drama. Rarity
stays an input to matchmaking, not the judge.

## On-chain shape (foundation, this phase)
`lethe_battle::battle::Battle` (shared object):
- `id: UID`
- `artwork_a: address`, `artwork_b: address`  — the two Artwork object ids
- `votes_a: u64`, `votes_b: u64`
- `status: u8`  — 0 open, 1 closed
- `created_at_ms: u64`

Entry funs: `create_battle(artwork_a, artwork_b, created_at_ms)` (shares the object),
`vote(battle, side, _ctx)` (side 0=A,1=B; requires status open).

## Deliberately deferred (next session)
- One-vote-per-address dedup (foundation allows repeat votes — note, not bulletproof).
- Close/resolve + winner, leaderboard, battle pages/UI.
- Sponsored (gasless) voting via Enoki — same allowlist pattern as mint; the
  `::battle::vote` target must be added to the Enoki allowlist.
