// BLOCK 8 Phase 1 spike — prove Seal encrypt → seal_approve → decrypt
// round-trips on testnet. Throwaway policy package (contracts/seal_spike,
// owner-only) — superseded by memory_policy in Phase 2.
// Run from apps/web: node scripts/seal-spike.mjs
import { readFileSync } from "node:fs";
import { SealClient, SessionKey, EncryptedObject } from "@mysten/seal";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { toHex, fromHex } from "@mysten/sui/utils";

// Throwaway spike policy (entry fun seal_approve: sender == deployer).
const SPIKE_PKG = "0x6e79e87b4df03871b088e9eb1dce4db9720e7ca92c72a0f1bafefe8e5972b97b";

// Verified testnet decentralized key server (seal-docs.wal.app/Pricing) —
// committee-mode (3-of-5 internally), one entry at weight 1, threshold 1.
const KEY_SERVERS = [
  {
    objectId: "0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98",
    aggregatorUrl: "https://seal-aggregator-testnet.mystenlabs.com",
    weight: 1,
  },
];
const THRESHOLD = 1;

const msEnv = readFileSync(new URL("../../memory-service/.env", import.meta.url), "utf8");
const SK = msEnv.match(/^DEPLOYER_PRIVATE_KEY=(.+)$/m)?.[1]?.trim();
const kp = Ed25519Keypair.fromSecretKey(SK);
const ADDR = kp.getPublicKey().toSuiAddress();

const suiClient = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });
const seal = new SealClient({ suiClient, serverConfigs: KEY_SERVERS, verifyKeyServers: true });

// [1] encrypt
const PLAINTEXT = `lethe seal spike — ${ADDR.slice(0, 10)} — the river forgets, we don't`;
const idBytes = crypto.getRandomValues(new Uint8Array(16));
const id = toHex(idBytes);
console.log("[1] encrypting", JSON.stringify(PLAINTEXT));
const { encryptedObject } = await seal.encrypt({
  threshold: THRESHOLD,
  packageId: SPIKE_PKG,
  id,
  data: new TextEncoder().encode(PLAINTEXT),
});
const parsed = EncryptedObject.parse(encryptedObject);
console.log(`    encrypted: ${encryptedObject.length} B · id=${parsed.id.slice(0, 18)}… · services=${parsed.services.length}`);

// [2] session key signed by the user (deployer keypair stands in for zkLogin)
console.log("[2] SessionKey create + personal-message signature…");
const sessionKey = await SessionKey.create({
  address: ADDR,
  packageId: SPIKE_PKG,
  ttlMin: 10,
  suiClient,
});
const { signature } = await kp.signPersonalMessage(sessionKey.getPersonalMessage());
await sessionKey.setPersonalMessageSignature(signature);
console.log("    session key initialized (ttl 10 min)");

// [3] seal_approve PTB + decrypt via key server
console.log("[3] decrypt via seal_approve dry-run on key servers…");
const tx = new Transaction();
tx.moveCall({
  target: `${SPIKE_PKG}::seal_spike::seal_approve`,
  arguments: [tx.pure.vector("u8", fromHex(id))],
});
const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
const decrypted = await seal.decrypt({ data: encryptedObject, sessionKey, txBytes });
const out = new TextDecoder().decode(decrypted);
console.log("    decrypted:", JSON.stringify(out));

// [4] negative check: a stranger's session key must be denied
console.log("[4] negative: random keypair should be rejected by the policy…");
const stranger = Ed25519Keypair.generate();
const strangerSession = await SessionKey.create({
  address: stranger.getPublicKey().toSuiAddress(),
  packageId: SPIKE_PKG,
  ttlMin: 10,
  suiClient,
});
const sSig = await stranger.signPersonalMessage(strangerSession.getPersonalMessage());
await strangerSession.setPersonalMessageSignature(sSig.signature);
// Fresh client — the first decrypt cached the derived keys, which would let
// ANY session "decrypt" locally without ever consulting the key servers.
const sealFresh = new SealClient({ suiClient, serverConfigs: KEY_SERVERS, verifyKeyServers: true });
let denied = false;
try {
  await sealFresh.decrypt({ data: encryptedObject, sessionKey: strangerSession, txBytes });
} catch (e) {
  denied = true;
  console.log(`    denied as expected (${e.constructor.name}: ${String(e.message).slice(0, 80)})`);
}

if (out !== PLAINTEXT) throw new Error("MISMATCH: decrypted != original");
if (!denied) throw new Error("POLICY HOLE: stranger decrypted successfully");
console.log("\n=== SEAL SPIKE GATE PASSED — round-trip + policy denial on testnet ===");
