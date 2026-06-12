// @lethe/sdk example — "Continue with Lethe" in ~30 lines.
// Reads a real testnet vault three ways: by owner, by id, and through the
// server-mediated grant gate (the same path the Pulse demo app runs).
// Run from packages/sdk:  pnpm install && pnpm example
import { LetheClient, GrantDeniedError } from "../src/index.ts";

// The Lethe dev wallet — a vault with real entries (see docs/concepts).
const OWNER = "0x4bf22d697cacb24e23037e804157896ddfaaf7a3d86940df777c1ad31a868077";

const lethe = new LetheClient(); // testnet + live app defaults

// [1] public on-chain metadata — anyone can verify this on Suiscan
const vault = await lethe.getVaultByOwner(OWNER);
if (!vault) throw new Error("no vault for this owner");
console.log(`[1] vault ${vault.objectId}`);
console.log(`    entries: ${vault.entries.length} · authorized apps: ${vault.authorized.length}`);
console.log(`    verify: ${vault.suiscanUrl}`);

// [2] same vault by object id
const byId = await lethe.listEntries(vault.objectId);
console.log(`[2] listEntries: ${byId.entries.length} refs · newest kind "${byId.entries.at(-1)?.kind}"`);
console.log(`    first blob (ciphertext on Walrus): ${byId.entries[0]?.walrusUrl}`);

// [3] decrypted read through the grant gate — works only while the serving
// app's address is on the vault's authorized list; revoke and it 403s.
try {
  const { entries } = await lethe.requestReadAsGrantee({ ownerAddress: OWNER });
  const readable = entries.filter((e) => e.text);
  console.log(`[3] grant-gated read: ${entries.length} entries (${readable.length} server-readable)`);
  for (const e of readable.slice(0, 3)) console.log(`    - [${e.kind}] ${e.text.slice(0, 70)}`);
} catch (e) {
  if (e instanceof GrantDeniedError) {
    console.log(`[3] grant-gated read: DENIED — ${e.message} (this IS the product working)`);
  } else throw e;
}

console.log("\nok — @lethe/sdk example complete");
