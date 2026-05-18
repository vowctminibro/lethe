import { LetheConfig, MemoryEvent, RecallResult } from './types';

export class NPC {
  private npcId: string;
  private config: LetheConfig;

  constructor(npcId: string, config: LetheConfig) {
    this.npcId = npcId;
    this.config = config;
  }

  private get memoryServiceUrl(): string {
    return this.config.memoryServiceUrl ?? 'http://localhost:3001';
  }

  async remember(playerWallet: string, event: MemoryEvent): Promise<{ ok: boolean; blobId: string }> {
    const response = await fetch(`${this.memoryServiceUrl}/npc/${this.npcId}/remember`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerWallet, event }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async recall(playerWallet: string): Promise<RecallResult> {
    const response = await fetch(`${this.memoryServiceUrl}/npc/${this.npcId}/recall/${playerWallet}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async forget(playerWallet: string): Promise<{ ok: boolean }> {
    const response = await fetch(`${this.memoryServiceUrl}/npc/${this.npcId}/forget/${playerWallet}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
}