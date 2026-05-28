// Shared domain types for Lethe — AI storytelling on Sui.
// Imported by apps/web, apps/memory-service, and packages/sdk.

export type WorldTemplate =
  | 'fantasy'
  | 'scifi'
  | 'romance'
  | 'mystery'
  | 'slice-of-life';

export const WORLD_TEMPLATES: WorldTemplateMeta[] = [
  {
    id: 'fantasy',
    label: 'Fantasy',
    blurb: 'Swords, sorcery, and ancient chambers.',
    openingSeed: 'a torchlit stone chamber beneath a forgotten keep',
  },
  {
    id: 'scifi',
    label: 'Sci-fi',
    blurb: 'Deep space, AI, and the edge of known physics.',
    openingSeed: 'the observation deck of a drifting research station',
  },
  {
    id: 'romance',
    label: 'Romance',
    blurb: 'Slow glances and the weight of unsaid things.',
    openingSeed: 'a rain-streaked cafe window on an autumn evening',
  },
  {
    id: 'mystery',
    label: 'Mystery',
    blurb: 'A locked room and a question that will not rest.',
    openingSeed: 'a study where the clock has stopped at 3:14',
  },
  {
    id: 'slice-of-life',
    label: 'Slice-of-life',
    blurb: 'Small moments that quietly become everything.',
    openingSeed: 'a sunlit apartment on the first morning of a new job',
  },
];

export interface WorldTemplateMeta {
  id: WorldTemplate;
  label: string;
  blurb: string;
  /** Seed phrase folded into the opening-chapter generation prompt. */
  openingSeed: string;
}

export interface Chapter {
  index: number;
  /** Walrus blob id for the chapter prose. */
  textBlobId: string;
  /** Walrus blob id for the generated scene image. */
  imageBlobId: string;
  /** Short memory summary: characters introduced, location, key events. */
  summary: string;
  createdMs: number;
}

export interface Story {
  /** Sui object id of the Story NFT. */
  objectId: string;
  author: string;
  title: string;
  world: WorldTemplate;
  chapters: Chapter[];
  createdMs: number;
}

/** Structured memory carried across chapters for prompt context. */
export interface StoryMemory {
  characters: string[];
  locations: string[];
  /** Running plot beats, most recent last. */
  beats: string[];
}
