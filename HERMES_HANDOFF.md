# Hermes Handoff — Day 2

Last updated: 2026-05-18

## TASK 3 — lethesdk.vercel.app
Status: USER ACTION REQUIRED
Vercel token not found in environment (.env, .vercelrc, .config/vercel, ~/Projects/delta-site/.vercel all checked — none have a Vercel auth token).
**Action needed:** Vow manually deploys at vercel.com/new — project name "lethesdk", deploy Next.js boilerplate.
Project URL target: `https://lethesdk.vercel.app`
After deploy: save project ID + URL to this file.

## TASK 1 — MemWal SDK
Status: ✅ DONE
File: research/memwal-verified.md
Package: `@mysten-incubation/memwal`
Install: `npm install @mysten-incubation/memwal @mysten/sui @mysten/seal @mysten/walrus`
Note: blocker B2 CLOSED

## TASK 2 — @lethe_ai X handle
Status: ✅ TAKEN (stranger's grab since 2016)
Screenshot: ~/lethe_ai_account_check.png
**Alternatives suggested:**
1. @letheai (no underscore)
2. @lethe_ai_vow (explicit)
3. @thelethedotai (brandable)

## TASK 4 — Walrus testnet endpoints
Status: ✅ DONE
File: research/walrus-endpoints.md
Publisher (testnet): `https://publisher.walrus-testnet.walrus.space/v1/blobs`
Aggregator (testnet): `https://aggregator.walrus-testnet.walrus.space/v1/blobs`
Source: 5+ independent references (SealTrust API docs, Flutter integration, OneTube project, Mysten X)

## TASK 5 — OnlyFins patterns
Status: ✅ DONE
File: research/onlyfins-patterns.md
Key patterns: TS SDK upload, Post object stores blob_id, writeFilesFlow user wallet flow, Seal+ViewerToken auth gate
