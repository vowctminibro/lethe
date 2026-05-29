/**
 * generate.ts — controlled artwork generation.
 *
 * Server-side (used by /api/generate). Single path: trait selection ->
 * assembled locked prompt -> MiniMax image. No free user text ever reaches
 * the model.
 */

import { assemblePrompt, computeRarity, type Rarity, type TraitSelection } from "./traits";
import { generateImage } from "./minimax";

export interface GeneratedArtwork {
  prompt: string;
  rarity: Rarity;
  imageBytes: Uint8Array;
  mime: string;
}

export async function generateArtwork(
  traits: TraitSelection,
  opts: { seed?: number } = {},
): Promise<GeneratedArtwork> {
  const prompt = assemblePrompt(traits);
  const rarity = computeRarity(traits);
  const { bytes } = await generateImage(prompt, { aspectRatio: "1:1", seed: opts.seed });
  return { prompt, rarity, imageBytes: bytes, mime: "image/jpeg" };
}
