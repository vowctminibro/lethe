export interface LetheConfig {
  network: 'sui-testnet' | 'sui-mainnet';
  memoryServiceUrl?: string;  // default http://localhost:3001
}
export interface MemoryEvent {
  event: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}
export interface RecallResult {
  events: MemoryEvent[];
  blobId: string;
  suiObjectId: string;
}