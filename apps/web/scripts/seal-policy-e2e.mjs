// BLOCK 8 Phase 2 verification — the REAL memory_policy on testnet:
// encrypt under [original pkg][vault id][nonce] → owner decrypts via
// seal_approve(&Memory) → granted app decrypts → revoked app denied.
// Also settles two open questions empirically:
//   (a) upgraded package: encrypt/Session use ORIGINAL id, PTB targets LATEST
//   (b) can a NON-owner sender pass an address-OWNED object in the key
//       server's dry run? (decides the Pulse decrypt path)
// Run from apps/web: node scripts/seal-policy-e2e.mjs
import { readFileSync } from "node:fs";
import { SealClient, SessionKey } from "@mysten/seal";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { toHex, fromHex } from "@mysten/sui/utils";

const ORIGINAL_PKG = "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
const LATEST_PKG = "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c"; // v3
const VAULT_ID = "0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655";

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
const owner = Ed25519Keypair.fromSecretKey(SK);
const OWNER = owner.getPublicKey().toSuiAddress();

const suiClient = new SuiJsonRpcClient({ network: "testnet", url: getJsonRpcFullnodeUrl("testnet") });
const freshSeal = () => new SealClient({ suiClient, serverConfigs: KEY_SERVERS, verifyKeyServers: true });

const approveTx = async (idHex, target) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${target}::memory_policy::seal_approve`,
    arguments: [tx.pure.vector("u8", fromHex(idHex)), tx.object(VAULT_ID)],
  });
  return tx.build({ client: suiClient, onlyTransactionKind: true });
};

async function makeSession(kp, pkg) {
  const s = await SessionKey.create({
    address: kp.getPublicKey().toSuiAddress(),
    packageId: pkg,
    ttlMin: 10,
    suiClient,
  });
  const { signature } = await kp.signPersonalMessage(s.getPersonalMessage());
  await s.setPersonalMessageSignature(signature);
  return s;
}

// identity: [vault object id][nonce] (pkg prefix added by Seal)
const idHex = VAULT_ID.slice(2) + toHex(crypto.getRandomValues(new Uint8Array(8)));
const PLAINTEXT = "policy e2e — only the owner and granted apps may read this";

// [1] encrypt under ORIGINAL pkg namespace
console.log("[1] encrypt (namespace = ORIGINAL pkg, id = vault||nonce)…");
const { encryptedObject } = await freshSeal().encrypt({
  threshold: THRESHOLD,
  packageId: ORIGINAL_PKG,
  id: idHex,
  data: new TextEncoder().encode(PLAINTEXT),
});
console.log(`    ${encryptedObject.length} B ciphertext`);

// [2] owner decrypt — PTB target LATEST pkg (where memory_policy exists)
console.log("[2] owner decrypt (Session=ORIGINAL, PTB target=LATEST v3)…");
const ownerSession = await makeSession(owner, ORIGINAL_PKG);
const txBytes = await approveTx(idHex, LATEST_PKG);
const out = new TextDecoder().decode(
  await freshSeal().decrypt({ data: encryptedObject, sessionKey: ownerSession, txBytes }),
);
if (out !== PLAINTEXT) throw new Error("owner decrypt mismatch");
console.log("    owner decrypted OK ✓");

// [3] stranger (never granted) — must be denied
console.log("[3] stranger denied?…");
const app = Ed25519Keypair.generate();
const APP = app.getPublicKey().toSuiAddress();
const appSession = await makeSession(app, ORIGINAL_PKG);
let deniedBefore = false;
try {
  await freshSeal().decrypt({ data: encryptedObject, sessionKey: appSession, txBytes });
} catch (e) {
  deniedBefore = true;
  console.log(`    denied ✓ (${e.constructor.name})`);
}

// [4] grant the app on-chain, then the SAME app decrypts
console.log(`[4] grant ${APP.slice(0, 12)}… then app decrypt (owned-object dry-run test)…`);
const grantTx = new Transaction();
grantTx.moveCall({
  target: `${LATEST_PKG}::memory::grant`,
  arguments: [grantTx.object(VAULT_ID), grantTx.pure.address(APP)],
});
grantTx.setSender(OWNER);
const grantRes = await suiClient.signAndExecuteTransaction({ transaction: grantTx, signer: owner });
await suiClient.core.waitForTransaction({ digest: grantRes.digest });
console.log(`    granted (tx ${grantRes.digest.slice(0, 12)}…)`);

let grantedOk = false;
let grantedErr = null;
try {
  const out2 = new TextDecoder().decode(
    await freshSeal().decrypt({ data: encryptedObject, sessionKey: appSession, txBytes }),
  );
  grantedOk = out2 === PLAINTEXT;
  console.log(`    granted app decrypted OK ✓ — non-owner CAN pass owned vault in dry run`);
} catch (e) {
  grantedErr = `${e.constructor.name}: ${String(e.message).slice(0, 120)}`;
  console.log(`    granted app DENIED — owned-object dry-run blocks non-owner: ${grantedErr}`);
}

// [5] revoke, then the app must be denied again
console.log("[5] revoke then app denied?…");
const revokeTx = new Transaction();
revokeTx.moveCall({
  target: `${LATEST_PKG}::memory::revoke`,
  arguments: [revokeTx.object(VAULT_ID), revokeTx.pure.address(APP)],
});
revokeTx.setSender(OWNER);
const revokeRes = await suiClient.signAndExecuteTransaction({ transaction: revokeTx, signer: owner });
await suiClient.core.waitForTransaction({ digest: revokeRes.digest });
let deniedAfter = false;
try {
  await freshSeal().decrypt({ data: encryptedObject, sessionKey: appSession, txBytes });
} catch (e) {
  deniedAfter = true;
  console.log(`    denied after revoke ✓ (${e.constructor.name})`);
}

console.log("\n=== RESULTS ===");
console.log("owner round-trip:        PASS");
console.log("stranger denied:         " + (deniedBefore ? "PASS" : "FAIL"));
console.log("granted app decrypts:    " + (grantedOk ? "PASS (owned-object dry-run OK)" : `NO — ${grantedErr}`));
console.log("revoked app denied:      " + (deniedAfter ? "PASS" : "FAIL"));
if (!deniedBefore || !deniedAfter) throw new Error("policy gate FAILED");
console.log("\n=== SEAL POLICY E2E " + (grantedOk ? "FULLY GREEN" : "GREEN (owner path) — app path needs design note") + " ===");
