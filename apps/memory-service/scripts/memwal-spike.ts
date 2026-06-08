/**
 * MemWal spike — de-risk #1 for the Lethe re-aim.
 *
 * Proves the full owned-portable-memory loop against the LIVE staging relayer:
 *   1. create (or reuse) a MemWalAccount on Sui testnet   — user OWNS it
 *   2. generate + grant a delegate key (= an app's read access)
 *   3. remember() a crypto memory   — server embeds → SEAL encrypts → Walrus → store
 *   4. recall() it back semantically — server search → Walrus download → decrypt
 *   5. revoke the delegate key       — remove_delegate_key
 *   6. recall() again               — should now FAIL (revoke = forget)
 *
 * Run: cd apps/memory-service && node --experimental-strip-types scripts/memwal-spike.ts
 *   (NOTE: `tsx` fails to resolve the @mysten/memwal exports map; use node's
 *    native TS stripping instead. Node >= 22.)
 *
 * Env (apps/memory-service/.env):
 *   DEPLOYER_PRIVATE_KEY=suiprivkey1...   (funded testnet wallet — the "user")
 *   MEMWAL_RELAYER_URL=https://relayer.staging.memwal.ai   (optional; defaulted)
 *
 * Discovered live (2026-06-08) from the staging relayer + testnet chain:
 *   relayer    https://relayer.staging.memwal.ai   (/health -> status ok)
 *   packageId  0xcf6ad755a1cdff7217865c796778fabe5aa399cb0cf2eba986f4b582047229c6
 *   registryId 0xe80f2feec1c139616a86c9f71210152e2a7ca552b20841f2e192f99f75864437
 *
 * VERDICT (2026-06-08):
 *   ✅ ON-CHAIN plane works: createAccount / reuse, addDelegateKey (grant),
 *      removeDelegateKey (revoke) all execute as real testnet txs. MemWal has a
 *      NATIVE access-control API — we do NOT need to hand-roll SEAL for grant/revoke.
 *   ✅ MemWalAccount is a SHARED object — find it via the AccountCreated event,
 *      NOT getOwnedObjects.
 *   ❌ DATA plane (remember/recall) BLOCKED: published SDK @mysten/memwal@0.0.2,
 *      but both relayers require minSupportedSdk.typescript = 0.0.4 (not on npm).
 *      The relayer deprecated the `x-delegate-key` credential the 0.0.2 SDK sends
 *      and now answers HTTP 426 (Upgrade Required) on /api/remember. Data-plane
 *      auth moved to `x-seal-session` (relayer-managed SEAL) or manual-mode
 *      (`@mysten/memwal/manual` -> MemWalManual, send no decrypt credential).
 *      -> Unblock path: wait for 0.0.4, or drive MemWalManual + @mysten/seal directly.
 */
import 'dotenv/config';
import { MemWal } from '@mysten/memwal';
import { createAccount, addDelegateKey, removeDelegateKey, generateDelegateKey } from '@mysten/memwal/account';
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const RELAYER = process.env.MEMWAL_RELAYER_URL ?? 'https://relayer.staging.memwal.ai';
const PACKAGE_ID = process.env.MEMWAL_PACKAGE_ID ?? '0xcf6ad755a1cdff7217865c796778fabe5aa399cb0cf2eba986f4b582047229c6';
const REGISTRY_ID = process.env.MEMWAL_REGISTRY_ID ?? '0xe80f2feec1c139616a86c9f71210152e2a7ca552b20841f2e192f99f75864437';
const NETWORK = 'testnet' as const;
const NAMESPACE = 'lethe-spike';

const SUI_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!SUI_PRIVATE_KEY) {
  console.error('Missing DEPLOYER_PRIVATE_KEY in apps/memory-service/.env (a funded testnet suiprivkey1...)');
  process.exit(1);
}

const client = new SuiJsonRpcClient({ network: NETWORK, url: getJsonRpcFullnodeUrl(NETWORK) });
const owner = Ed25519Keypair.fromSecretKey(SUI_PRIVATE_KEY).getPublicKey().toSuiAddress();

const tx = { packageId: PACKAGE_ID, suiPrivateKey: SUI_PRIVATE_KEY, suiNetwork: NETWORK, suiClient: client } as const;

/**
 * Find an existing MemWalAccount for `owner` (each address can have only one).
 * NOTE: MemWalAccount is a *shared* object, so `getOwnedObjects` never returns
 * it — look it up via the `AccountCreated` event whose `owner` matches us.
 */
async function findExistingAccount(): Promise<string | null> {
  const res = await client.queryEvents({
    query: { MoveEventType: `${PACKAGE_ID}::account::AccountCreated` },
    limit: 50,
    order: 'descending',
  });
  for (const e of res.data) {
    const pj = e.parsedJson as { account_id: string; owner: string } | undefined;
    if (pj?.owner === owner) return pj.account_id;
  }
  return null;
}

async function main() {
  console.log('=== MemWal spike (Lethe re-aim de-risk #1) ===');
  console.log('relayer  ', RELAYER);
  console.log('owner    ', owner);

  // 0. relayer reachable?
  const memwalHealth = await MemWal.create({ key: '00'.repeat(32), accountId: '0x0', serverUrl: RELAYER, namespace: NAMESPACE })
    .health()
    .then((h) => h, (e) => ({ status: 'unreachable', error: String(e) }));
  console.log('health   ', JSON.stringify(memwalHealth));

  // 1. own: create (or reuse) a MemWalAccount on Sui
  let accountId = await findExistingAccount();
  if (accountId) {
    console.log('\n[1] reuse existing MemWalAccount:', accountId);
  } else {
    console.log('\n[1] creating MemWalAccount on testnet...');
    const acc = await createAccount({ ...tx, registryId: REGISTRY_ID });
    accountId = acc.accountId;
    console.log('    created:', accountId, 'tx:', acc.digest);
  }

  // 2. grant: generate + add a delegate key (= app #1 read access)
  console.log('\n[2] generating + granting a delegate key...');
  const delegate = await generateDelegateKey();
  const grant = await addDelegateKey({ ...tx, accountId, publicKey: delegate.publicKey, label: 'lethe-spike-app' });
  console.log('    granted key', grant.publicKey.slice(0, 16) + '…', 'tx:', grant.digest);

  // 3. remember: write a crypto memory (server-side embed → SEAL → Walrus → store)
  const memwal = MemWal.create({ key: delegate.privateKey, accountId, serverUrl: RELAYER, namespace: NAMESPACE });
  const memory = 'I am a momentum trader, I hate leverage, and I am bullish on SUI.';
  console.log('\n[3] remember:', memory);
  const remembered = await memwal.remember(memory);
  console.log('    stored -> blob_id:', remembered.blob_id, 'ns:', remembered.namespace);

  // 4. recall: semantic query back (the portability proof — any app with access reads this)
  console.log('\n[4] recall: "what is my trading style?"');
  const recalled = await memwal.recall('what is my trading style?');
  console.log('    results:', recalled.total);
  for (const m of recalled.results) console.log('     •', m.text, '(distance', m.distance.toFixed(4) + ')');
  const readBack = recalled.results.length > 0;
  console.log('    READ-BACK:', readBack ? '✅ YES' : '❌ NO');

  // 5. revoke: remove the delegate key (= forget / cut app access)
  console.log('\n[5] revoke: removing the delegate key...');
  const revoke = await removeDelegateKey({ ...tx, accountId, publicKey: delegate.publicKey });
  console.log('    revoked, tx:', revoke.digest);

  // 6. recall again — should now fail (no access)
  console.log('\n[6] recall after revoke (expect failure)...');
  await new Promise((r) => setTimeout(r, 3000)); // let chain state settle
  const afterRevoke = await memwal
    .recall('what is my trading style?')
    .then((r) => ({ ok: true, total: r.total }), (e) => ({ ok: false, error: String(e) }));
  console.log('    after revoke:', JSON.stringify(afterRevoke));
  const revokeWorks = !afterRevoke.ok || (afterRevoke as { total: number }).total === 0;
  console.log('    REVOKE-ENFORCED:', revokeWorks ? '✅ YES' : '❌ NO (still readable)');

  console.log('\n=== SPIKE SUMMARY ===');
  console.log('store+read:', readBack ? '✅' : '❌', '| grant/revoke API:', '✅ (addDelegateKey/removeDelegateKey)', '| revoke enforced:', revokeWorks ? '✅' : '❌');
}

main().catch((err) => {
  console.error('\n❌ SPIKE FAILED:', err?.message ?? err);
  if (err?.stack) console.error(err.stack.split('\n').slice(1, 4).join('\n'));
  process.exit(1);
});
