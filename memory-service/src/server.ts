import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

dotenv.config();

const {
  LETHE_PACKAGE_ID,
  KHUN_TUM_NPC_ID,
  DEPLOYER_PRIVATE_KEY,
  PORT = '3001',
} = process.env as Record<string, string>;

if (!LETHE_PACKAGE_ID || !KHUN_TUM_NPC_ID || !DEPLOYER_PRIVATE_KEY) {
  console.error('Missing required env: LETHE_PACKAGE_ID, KHUN_TUM_NPC_ID, DEPLOYER_PRIVATE_KEY');
  process.exit(1);
}

// Init Sui testnet client
const client = new SuiJsonRpcClient({ url: 'https://fullnode.testnet.sui.io:443' });

// Init deployer keypair from suiprivkey1... string
const keypair = Ed25519Keypair.fromSecretKey(DEPLOYER_PRIVATE_KEY);
const address = keypair.getPublicKey().toSuiAddress();
console.log(`Lethe deployer: ${address}`);

// Validate NPC object exists on-chain at startup
async function validateNpc() {
  try {
    const { data } = await client.getObject({
      id: KHUN_TUM_NPC_ID,
      options: { showType: true, showOwner: true },
    });
    console.log(`Lethe service ready, NPC: ${KHUN_TUM_NPC_ID}`);
    console.log(`  NPC type: ${data?.type}`);
    console.log(`  Owner: ${JSON.stringify(data?.owner)}`);
  } catch (err) {
    console.error(`❌ NPC ${KHUN_TUM_NPC_ID} not found on-chain:`, err);
    process.exit(1);
  }
}
validateNpc();

// ─── Express app ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lethe-memory', npc: KHUN_TUM_NPC_ID });
});

/**
 * POST /npc/:id/remember
 * Body: { playerWallet: "0x...", event: { event: "...", metadata?: {...} } }
 * For Day 3: stub blob_id = "stub-${Date.now()}"
 * Real Walrus integration = Day 4
 */
app.post('/npc/:id/remember', async (req, res) => {
  try {
    const { id: npcId } = req.params;
    const { playerWallet, event } = req.body as {
      playerWallet: string;
      event: { event: string; metadata?: Record<string, unknown> };
    };
    if (!playerWallet || !event) {
      res.status(400).json({ error: 'Missing playerWallet or event' });
      return;
    }

    // Stub blob_id (Day 3 — Walrus Day 4)
    const blobId = `stub-${Date.now()}`;
    const blobIdBytes = Array.from(new TextEncoder().encode(blobId));

    // Build programmable transaction
    const tx = new Transaction();
    tx.moveCall({
      target: `${LETHE_PACKAGE_ID}::npc::add_memory`,
      arguments: [
        tx.object(KHUN_TUM_NPC_ID),
        tx.pure.vector('u8', blobIdBytes),
        tx.object('0x6'), // Sui system Clock
      ],
    });

    // Sign and submit
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: { showEffects: true, showObjectChanges: true },
    });

    const digest = result.digest;
    const status = result.effects?.status?.status ?? 'unknown';

    if (status !== 'success') {
      console.error('Tx failed:', JSON.stringify(result.effects));
      res.status(500).json({ error: 'Transaction failed on-chain', details: result.effects });
      return;
    }

    console.log(`[${npcId}] add_memory by ${playerWallet}: tx=${digest}`);
    res.json({ ok: true, blobId, txDigest: digest, suiObjectId: KHUN_TUM_NPC_ID });
  } catch (err) {
    console.error('remember error:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /npc/:id/recall/:wallet
 * Reads the shared NPC object's memory vector on-chain.
 */
app.get('/npc/:id/recall/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    const obj = await client.getObject({
      id: KHUN_TUM_NPC_ID,
      options: { showContent: true },
    });

    const content = obj.data?.content as Record<string, unknown> | undefined;
    if (!content) {
      res.status(404).json({ error: 'NPC object not found or has no content' });
      return;
    }

    // Parse memories vector from on-chain data
    const fields = content.fields as Record<string, unknown> | undefined;
    const memoriesRaw = fields?.memories as unknown[] | undefined;
    const memories: Array<{ player_address: string; blob_id: string; timestamp_ms: number }> =
      (memoriesRaw ?? []).map((m: unknown) => {
        const entry = m as Record<string, unknown>;
        const addrField = entry.fields as Record<string, unknown> | undefined;
        return {
          player_address: String(addrField?.player_address ?? entry.player_address ?? ''),
          blob_id: String(addrField?.blob_id ?? entry.blob_id ?? ''),
          timestamp_ms: Number(addrField?.timestamp_ms ?? entry.timestamp_ms ?? 0),
        };
      });

    // Normalize wallet addresses (lowercase compare)
    const normalizedWallet = wallet.toLowerCase();
    const filtered = memories.filter(
      (m) => m.player_address.toLowerCase() === normalizedWallet,
    );

    res.json({ events: filtered, blobId: 'stub', suiObjectId: KHUN_TUM_NPC_ID });
  } catch (err) {
    console.error('recall error:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * DELETE /npc/:id/forget/:wallet
 * Stub — requires Move contract update for on-chain deletion.
 */
app.delete('/npc/:id/forget/:wallet', (_req, res) => {
  res.json({ ok: true, note: 'forget not implemented on-chain yet — needs Move contract update' });
});

app.listen(Number(PORT), () => {
  console.log(`Lethe memory service running on http://localhost:${PORT}`);
});