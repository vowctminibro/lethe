// @lethe/sdk — client SDK for Lethe storytelling ops.
// Thin wrapper over the memory-service sidecar HTTP API (Walrus blob
// upload/read + Sui Story-NFT mint/extend). Public surface is frozen for
// the hero flow; implementations land Day 3+ as the service routes settle.

import type {
  Story,
  Chapter,
  WorldTemplate,
  StoryMemory,
} from '@lethe/shared';

export type { Story, Chapter, WorldTemplate, StoryMemory };

export interface LetheConfig {
  /** Base URL of the memory-service sidecar (default http://localhost:3001). */
  serviceUrl?: string;
}

export interface CreateStoryInput {
  title: string;
  world: WorldTemplate;
  /** zkLogin-derived Sui address of the author. */
  authorAddress: string;
}

export interface AddChapterInput {
  storyObjectId: string;
  /** Free-text player action that drives the next chapter. */
  action: string;
}

export class Lethe {
  private readonly serviceUrl: string;

  constructor(config: LetheConfig = {}) {
    this.serviceUrl = config.serviceUrl ?? 'http://localhost:3001';
  }

  /** Mint a Story NFT + generate + store its opening chapter. */
  async createStory(_input: CreateStoryInput): Promise<Story> {
    throw new Error('@lethe/sdk: createStory not implemented (Day 3)');
  }

  /** Generate the next chapter from a player action, store it on Walrus,
   *  append it to the Story NFT. */
  async addChapter(_input: AddChapterInput): Promise<Chapter> {
    throw new Error('@lethe/sdk: addChapter not implemented (Day 3)');
  }

  /** Read a Story (Sui object + Walrus-resolved chapters). */
  async getStory(_objectId: string): Promise<Story> {
    throw new Error('@lethe/sdk: getStory not implemented (Day 3)');
  }

  /** List all Stories authored by an address. */
  async listStories(_authorAddress: string): Promise<Story[]> {
    throw new Error('@lethe/sdk: listStories not implemented (Day 3)');
  }
}

export function lethe(config?: LetheConfig): Lethe {
  return new Lethe(config);
}
