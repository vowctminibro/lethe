# LETHE HERO FLOW — 90 seconds

The single demo path. Everything in scope serves this flow; everything
else is cut. See the decision rule at the bottom.

---

## Timeline

**0:00–0:15 — Landing → "Sign in with Google"**
- zkLogin generates a Sui address (invisible)
- No wallet popup, no seed phrase

**0:15–0:30 — "Pick your world"**
- 5 starter templates: Fantasy / Sci-fi / Romance / Mystery / Slice-of-life
- User clicks Fantasy

**0:30–0:60 — Chapter 1 auto-generates**
- Opening paragraph + scene image + narration audio
- Loads in <30 sec

**0:60–1:15 — User types "I look around the chamber"**
- AI generates next paragraph + new image
- Memory: character names extracted, location noted
- Chapter saved to Walrus (invisible)
- Sui Object NFT minted (invisible)

**1:15–1:30 — Story timeline (2 chapters, growing tree)**
- "Continue Chapter 3?" call to action
- Demonstrates persistence

---

## Features IN the hero flow (must ship bulletproof)

1. zkLogin Google sign-in
2. Story template selection
3. AI text generation (MiniMax)
4. AI image generation (MiniMax)
5. Walrus blob upload + retrieval
6. Sui Object NFT mint
7. Story timeline visualization
8. Resume after close + reopen

---

## Features NOT in the hero flow (skip)

1. Voice narration (nice-to-have, Day 15+)
2. Multi-user collaboration (cut)
3. Mobile native app (web only)
4. Token economy (skip)
5. Marketplace / browse others (cut)
6. Custom world creation (use templates)
7. Edit previous chapters (cut for v1)
8. Story sharing / export (Day 18+ if time)

---

## Decision rule

For every "should I add feature X?" question:
- Visible in 90-sec flow + bulletproof? → ship
- Visible but risky? → don't ship
- Not visible? → don't ship
