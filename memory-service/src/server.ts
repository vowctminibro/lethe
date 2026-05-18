import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

interface MemoryEvent {
  event: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

// In-memory store: key = "${npcId}:${playerWallet}", value = MemoryEvent[]
const memoryStore = new Map<string, MemoryEvent[]>();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lethe-memory' });
});

app.post('/npc/:id/remember', (req, res) => {
  const { id: npcId } = req.params;
  const { playerWallet, event } = req.body as { playerWallet: string; event: MemoryEvent };
  if (!playerWallet || !event) {
    res.status(400).json({ error: 'Missing playerWallet or event' });
    return;
  }
  const key = `${npcId}:${playerWallet}`;
  if (!memoryStore.has(key)) {
    memoryStore.set(key, []);
  }
  memoryStore.get(key)!.push(event);
  res.json({ ok: true, blobId: `stub-${Date.now()}` });
});

app.get('/npc/:id/recall/:wallet', (req, res) => {
  const { id: npcId, wallet } = req.params;
  const key = `${npcId}:${wallet}`;
  const events = memoryStore.get(key) || [];
  res.json({ events, blobId: 'stub', suiObjectId: 'stub' });
});

app.delete('/npc/:id/forget/:wallet', (req, res) => {
  const { id: npcId, wallet } = req.params;
  const key = `${npcId}:${wallet}`;
  memoryStore.delete(key);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Lethe memory service running on http://localhost:${PORT}`);
});