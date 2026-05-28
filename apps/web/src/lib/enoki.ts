/**
 * Enoki — zkLogin + sponsored transactions wrapper
 * Decision (Day 2): paid Enoki over raw zkLogin for hackathon velocity
 * Docs: https://docs.enoki.mystenlabs.com
 */

import { EnokiFlow } from '@mysten/enoki'

const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export function getEnokiFlow() {
  if (!ENOKI_API_KEY) throw new Error('Missing NEXT_PUBLIC_ENOKI_API_KEY')
  // TODO Day 3: instantiate EnokiFlow with Google OAuth + Sui testnet
  // Reference: research/audit-v2.md TASK 3
  throw new Error('TODO: implement Enoki flow per audit-v2.md')
}

export async function signInWithGoogle(): Promise<{ address: string }> {
  // TODO Day 3: trigger Google OAuth -> Enoki -> Sui address
  throw new Error('TODO: implement signInWithGoogle')
}

export async function sponsoredMintStoryNFT(
  ownerAddress: string,
  storyMetadata: { title: string; chapterBlobIds: string[] }
): Promise<{ digest: string; objectId: string }> {
  // TODO Day 3: sponsored tx via Enoki for first-mint UX (gasless)
  throw new Error('TODO: implement sponsoredMintStoryNFT')
}
