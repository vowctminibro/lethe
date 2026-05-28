# Lethe Hero Flow — 90 seconds

## 0:00–0:15  Landing
User opens lethesdk.vercel.app
Click "Sign in with Google" → Enoki zkLogin generates Sui address
No wallet popup, no seed phrase

## 0:15–0:30  Pick your world
5 templates: Fantasy / Sci-fi / Romance / Slice-of-life / Custom (later)
Click Fantasy

## 0:30–1:00  Chapter 1 auto-generates
Opening paragraph + AI image
Loads <30 sec
User reads, types: "I look around the chamber"

## 1:00–1:30  Chapter 2 generates
AI extends story + new image
MemWal memory layer extracts characters/locations/decisions
Walrus stores chapter blob (invisible to user)
Sui Object NFT minted for story (sponsored gas via Enoki, invisible)

## 1:30–1:45  Story timeline
Visual tree: 2 chapters growing
"Continue Chapter 3?" CTA

## Architecture decisions (Day 2 locked)
- zkLogin via Enoki ($69/mo, sponsored tx included)
- Memory via MemWal + Vercel AI SDK middleware
- Storage: Walrus blobs (no Seal encryption v1 — NFT ownership = access proof)
- Generation: MiniMax (image-01 + text)
- Identity/Ownership: Sui Object NFT

## Features IN hero flow (ship bulletproof)
1. Enoki Google sign-in
2. Template selection (5 worlds)
3. AI text generation (MiniMax + MemWal context)
4. AI image generation (MiniMax)
5. Walrus blob upload + retrieve
6. Sui Object NFT mint (Enoki sponsored)
7. Story timeline UI
8. Resume after close + reopen

## Features NOT in hero flow (skip)
- Voice narration (Day 18+)
- Seal encryption (v2 roadmap)
- Self-hosted MemWal relayer (v2 roadmap)
- Multi-user collab (cut)
- Mobile native (web only)
- Marketplace (cut)
- Edit previous chapters (cut v1)

## Decision rule
Visible in 90 sec + bulletproof? → ship
Visible but risky? → don't ship
Not visible? → don't ship