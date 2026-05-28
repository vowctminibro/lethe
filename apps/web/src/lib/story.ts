/**
 * Story orchestrator — wires MemWal + MiniMax + Walrus + Sui
 * Hero flow: user types → AI generates → memory extracted →
 *           blob saved to Walrus → NFT updated on Sui
 */

import { generateChapterText, generateChapterImage } from './minimax'
import { uploadChapterBlob } from './walrus'
import { extractMemoryFromChapter, type StoryMemory } from './memory'

export interface Chapter {
  number: number
  text: string
  imageUrl: string
  blobId: string
  createdAt: number
}

export async function generateNextChapter(
  storyId: string,
  userInput: string,
  memory: StoryMemory
): Promise<{ chapter: Chapter; updatedMemory: StoryMemory }> {
  throw new Error('TODO: implement generateNextChapter')
}
