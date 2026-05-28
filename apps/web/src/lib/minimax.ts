/**
 * MiniMax — text + image generation
 * Reuse from EP project (Δ Delta)
 * Models: image-01, abab-6.5s for chat
 */

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID

export interface ChapterGeneration {
  text: string
  imageUrl: string
}

export async function generateChapterText(
  prompt: string,
  memoryContext: string
): Promise<string> {
  if (!MINIMAX_API_KEY) throw new Error('Missing MINIMAX_API_KEY')
  throw new Error('TODO: implement generateChapterText')
}

export async function generateChapterImage(sceneDescription: string): Promise<string> {
  if (!MINIMAX_API_KEY) throw new Error('Missing MINIMAX_API_KEY')
  throw new Error('TODO: implement generateChapterImage')
}
