/**
 * Walrus — decentralized blob storage for story chapters
 * Endpoints from .env (testnet publisher + aggregator)
 * Reference: research/audit-v2.md TASK 2
 */

const PUBLISHER_URL = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL
const AGGREGATOR_URL = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL

export interface ChapterBlob {
  blobId: string
  size: number
  uploadedAt: number
}

export async function uploadChapterBlob(content: string): Promise<ChapterBlob> {
  if (!PUBLISHER_URL) throw new Error('Missing NEXT_PUBLIC_WALRUS_PUBLISHER_URL')
  // TODO Day 3: HTTP PUT to publisher with content body
  throw new Error('TODO: implement uploadChapterBlob')
}

export async function retrieveChapterBlob(blobId: string): Promise<string> {
  if (!AGGREGATOR_URL) throw new Error('Missing NEXT_PUBLIC_WALRUS_AGGREGATOR_URL')
  // TODO Day 3: HTTP GET from aggregator
  throw new Error('TODO: implement retrieveChapterBlob')
}
