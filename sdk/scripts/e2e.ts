/**
 * SDK e2e test — first real Sui+Walrus end-to-end run.
 * Run: cd sdk && pnpm tsx scripts/e2e.ts
 */
import { Lethe } from '../src/lethe.js';

const memoryServiceUrl = 'http://localhost:3001';

async function run() {
  const lethe = new Lethe({ network: 'sui-testnet', memoryServiceUrl });
  const npc = lethe.npc('khun-tum');
  const wallet = '0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077';

  const testEvent = `SDK e2e test event ${Date.now()}`;

  console.log('Storing event via SDK...');
  const result = await npc.remember(wallet, { event: testEvent });
  console.log('✓ remembered:', JSON.stringify(result));

  console.log('\nRecalling memories...');
  const memories = await npc.recall(wallet);
  console.log('✓ recalled:', memories.events.length, 'events');
  console.log('Latest:', JSON.stringify(memories.events[memories.events.length - 1], null, 2));

  // Verify latest contains our event
  const latest = memories.events[memories.events.length - 1];
  const hasContent = latest && 'content' in latest && latest.content;
  const eventMatches = hasContent && (latest.content as any).event === testEvent;

  if (eventMatches) {
    console.log('\n✅ SDK e2e PASSED — hero flow verified end-to-end');
  } else {
    console.log('\n⚠️  Event content mismatch — check recall output above');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('SDK e2e FAILED:', err);
  process.exit(1);
});