/**
 * Memory schema + extraction for persistent story state.
 *
 * The MemWal layer tracks: characters, locations, plot threads, and key
 * decisions made by the reader. These are extracted from each chapter via
 * a MiniMax LLM call and stored in a JSON schema on Sui.
 *
 * Schema design (Day 2 locked):
 *   Character: { id, name, description, aliases[], traits[] }
 *   Location:  { id, name, description, mood, linkedCharacterIds[] }
 *   PlotThread:{ id, description, status: "active"|"resolved"|"abandoned", beats[] }
 *   Decision:  { id, chapterId, summary, consequence, charactersAffected[] }
 *   StoryMemory: { characters[], locations[], plotThreads[], decisions[] }
 */

/* ── Schema types ── */

export interface Character {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  traits: string[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  mood: string;
  linkedCharacterIds: string[];
}

export interface PlotThread {
  id: string;
  description: string;
  status: "active" | "resolved" | "abandoned";
  beats: string[];
}

export interface Decision {
  id: string;
  chapterId: number;
  summary: string;
  consequence: string;
  charactersAffected: string[];
}

export interface StoryMemory {
  characters: Character[];
  locations: Location[];
  plotThreads: PlotThread[];
  decisions: Decision[];
}

/* ── Default empty memory ── */
export function emptyMemory(): StoryMemory {
  return { characters: [], locations: [], plotThreads: [], decisions: [] };
}

/* ── Extraction ──
   Uses a MiniMax LLM call to extract structured memory from raw chapter text.
   TODO (Day 3): prompt MiniMax with a JSON schema + few-shot examples.
   The result is stored in MemWal and passed as context to each new generation.
*/
export async function extractMemoryFromText(
  chapterText: string,
): Promise<StoryMemory> {
  // ── placeholder — replace with MiniMax structured output ──
  console.info(`[Memory] would extract memory from ${chapterText.length} chars`);
  return emptyMemory();
}
