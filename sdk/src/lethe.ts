import { LetheConfig } from './types';
import { NPC } from './npc';

export class Lethe {
  private config: LetheConfig;

  constructor(config: LetheConfig) {
    this.config = {
      ...config,
      memoryServiceUrl: config.memoryServiceUrl ?? 'http://localhost:3001',
    };
  }

  npc(id: string): NPC {
    return new NPC(id, this.config);
  }
}

export { LetheConfig, MemoryEvent, RecallResult } from './types';