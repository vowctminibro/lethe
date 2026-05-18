/**
 * Walrus smoke test — store then fetch a blob.
 * Run: pnpm tsx scripts/walrus-smoke.ts
 */
import 'dotenv/config';
import { storeBlob, fetchBlob } from '../src/walrus.js';

async function main() {
  const content = { test: 'lethe-day4', ts: Date.now() };
  console.log('Storing:', JSON.stringify(content));

  const { blobId, suiObjectId, alreadyCertified } = await storeBlob(content);
  console.log('BlobId:', blobId);
  console.log('SuiObjectId:', suiObjectId);
  console.log('AlreadyCertified:', alreadyCertified);

  const fetched = await fetchBlob(blobId);
  console.log('Fetched:', JSON.stringify(fetched));

  const match = JSON.stringify(fetched) === JSON.stringify(content);
  console.log('Match:', match ? '✅ YES' : '❌ NO');

  if (!match) {
    console.error('SMOKE FAILED — content mismatch');
    process.exit(1);
  }

  console.log('✅ Walrus smoke test passed');
}

main().catch((err) => {
  console.error('SMOKE FAILED:', err);
  process.exit(1);
});
