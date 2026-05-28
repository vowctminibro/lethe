/**
 * Memory schema — structured extraction from story chapters
 * Dual-memory architecture: compact summary + structured + vector (via MemWal)
 * Reference: HEMA benchmark (87% recall vs 41% naive)
 */

import { z } from 'zod'

export const CharacterSchema = z.object({
  name: z.string(),
  description: z.string(),
  relationships: z.array(z.string()).default([]),
  firstAppearance: z.number(),
})

export const LocationSchema = z.object({
  name: z.string(),
  description: z.string(),
  firstAppearance: z.number(),
})

export const PlotThreadSchema = z.object({
  summary: z.string(),
  status: z.enum(['open', 'resolved', 'abandoned']),
  introducedIn: z.number(),
})

export const DecisionSchema = z.object({
  chapterNumber: z.number(),
  description: z.string(),
  consequences: z.array(z.string()).default([]),
})

export const StoryMemorySchema = z.object({
  storyId: z.string(),
  compactSummary: z.string(),
  characters: z.array(CharacterSchema),
  locations: z.array(LocationSchema),
  plotThreads: z.array(PlotThreadSchema),
  decisions: z.array(DecisionSchema),
})

export type StoryMemory = z.infer<typeof StoryMemorySchema>
export type Character = z.infer<typeof CharacterSchema>
export type Location = z.infer<typeof LocationSchema>
export type PlotThread = z.infer<typeof PlotThreadSchema>
export type Decision = z.infer<typeof DecisionSchema>

export async function extractMemoryFromChapter(
  chapterText: string,
  existingMemory: StoryMemory
): Promise<StoryMemory> {
  throw new Error('TODO: implement extractMemoryFromChapter')
}
