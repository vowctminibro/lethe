# @lethe/sdk

Read Lethe memory vaults from your app — "Continue with Lethe": warm-start your users with
memory they already own, instead of starting them from zero.

**Status: in-repo, not on npm yet.** Install via the workspace:

```bash
git clone https://github.com/vowctminibro/lethe && cd lethe
pnpm install
cd packages/sdk && pnpm example   # runs against a real testnet vault
```

## Read a vault in ~10 lines

```js
import { LetheClient, GrantDeniedError } from "@lethe/sdk";

const lethe = new LetheClient(); // testnet defaults
const vault = await lethe.getVaultByOwner("0x4bf2…8077");
console.log(vault.entries.length, "memories ·", vault.authorized.length, "apps granted");

try {
  const { entries } = await lethe.requestReadAsGrantee({ ownerAddress: vault.owner });
  console.log(entries.map((e) => e.text)); // decrypted, grant-gated
} catch (e) {
  if (e instanceof GrantDeniedError) console.log("user revoked — you know nothing");
}
```

## What it wraps (honest scope)

- `getVaultByOwner(address)` / `listEntries(vaultId)` — the vault's **public on-chain
  metadata** (blob refs, authorized apps), read from a Sui fullnode. Verifiable by anyone
  on Suiscan.
- `requestReadAsGrantee({ ownerAddress })` — **decrypted entries through the
  server-mediated grant gate**, the exact pattern the Pulse demo app runs in production:
  the serving endpoint checks the vault's live `authorized` list on-chain and returns 403
  the moment a grant is revoked.

## Why server-mediated (read this before integrating)

Seal key servers evaluate decryption policies by dry-running them on-chain — and dry-runs
reject address-owned objects for senders that don't own them. A third-party app therefore
**cannot yet run its own decrypt session** against a user's owned vault; today decryption
happens either in the owner's browser session or through a grant-enforcing endpoint like
the one this SDK calls. Independent app decrypt sessions arrive with the shared-registry
policy on the roadmap. The grant/revoke enforcement itself is already on-chain and
machine-verified (sui-prover, 19/19, including deny-universality of `seal_approve`).

## License

Apache-2.0.
