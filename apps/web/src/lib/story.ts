/**
 * Story orchestration layer.
 *
 * generateNextChapter() wires together:
 *   1. memory.extractMemoryFromText()  → StoryMemory
 *   2. memwal.withMemWal(AI)            → AI with persistent context
 *   3. minimax.generateChapterText()   → next chapter prose
 *   4. minimax.generateChapterImage()  → scene illustration
 *   5. walrus.uploadChapterBlob()       → store chapter on Walrus
 *   6. sui.mintStoryNFT()               → mint Sui Object NFT (Enoki gasless)
 */

import type { StoryMemory } from "./memory";

export interface Chapter {
  id: number;
  storyId: string;
  text: string;
  imageUrl: string;
  blobId: string;       // Walrus blob ID
  nftObjectId: string;   // Sui object ID of minted NFT
  createdAt: number;
}

/* ── TODO (Day 3): implement with real SDK calls ── */

export async function generateNextChapter(opts: {
  storyId: string;
  chapterId: number;
  userInput: string;      // reader's sentence that triggered generation
  memory: StoryMemory;
}): Promise<Chapter> {
  const { storyId, chapterId, userInput } = opts;

  console.info(`[Story] generateNextChapter ${chapterId} for story ${storyId}`);

  // Placeholder — real implementation:
  // const text = await generateChapterText(userInput, JSON.stringify(memory));
  // const imageUrl = await generateChapterImage(extractScenePrompt(memory));
  // const { blobId } = await uploadChapterBlob(text);
  // const nftObjectId = await mintStoryNFT(signer, blobId, chapterId);

  return {
    id: chapterId,
    storyId,
    text: "[AI-generated chapter placeholder]",
    imageUrl: "",
    blobId: "placeholder_blob",
    nftObjectId: "0x0",
    createdAt: Date.now(),
  };
}
