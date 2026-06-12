const ORIGINAL_PKG = "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";
const CURRENT_PKG = "0x0c79fd944a51153e4d668a4f53a280fe5d0ab6d4db0a572a2f85c11ac5fc2f6c";
const EXAMPLE_VAULT = "0x47374a34a1a0c8cf606f30efa716b8106ad5f3a2677957c8e897282bae527655";
const EXAMPLE_BLOB = "GbB45iJxmH5F8Si_78GG_macC6WeLS64jXjx7x852Eg";

export default function DocsConcepts() {
  return (
    <>
      <h1>Concepts</h1>

      <h2>Memory</h2>
      <p>
        A memory is one durable fact (&ldquo;sizes positions by volatility, never by
        conviction&rdquo;) with a kind (trading-style, holding, market-view, preference, fact) and
        a timestamp. Facts are extracted from chat or derived from your on-chain activity — and
        only saved when you confirm.
      </p>

      <h2>The vault object</h2>
      <p>
        Your vault is a <code>memory::Memory</code> object on Sui, owned by your address. It holds
        the list of blob references and the list of authorized app addresses. The Move package:
      </p>
      <ul>
        <li>
          current (v3): <a href={`https://suiscan.xyz/testnet/object/${CURRENT_PKG}`}><code>{CURRENT_PKG}</code></a>
        </li>
        <li>
          original / defining id (types use this): <a href={`https://suiscan.xyz/testnet/object/${ORIGINAL_PKG}`}><code>{ORIGINAL_PKG}</code></a>
        </li>
        <li>
          a real vault to inspect: <a href={`https://suiscan.xyz/testnet/object/${EXAMPLE_VAULT}`}><code>{EXAMPLE_VAULT.slice(0, 20)}…</code></a>
        </li>
      </ul>
      <p>
        Writes (<code>add_entry</code>, <code>remove_entry</code>, <code>grant</code>,{" "}
        <code>revoke</code>) are owner-only — machine-checked, not just tested (see Security).
        All writes are gasless through Enoki sponsorship.
      </p>

      <h2>Grant / revoke</h2>
      <p>
        Granting an app appends its address to the vault&rsquo;s <code>authorized</code> vector;
        revoking removes it. Both are owner-only transactions you can verify on Suiscan. Apps read
        through a grant-gated path: revoked means zero entries, immediately.
      </p>

      <h2>Walrus blobs</h2>
      <p>
        Each memory&rsquo;s ciphertext lives on Walrus, fetchable from any public aggregator —
        storage is verifiable, not a claim. Example (ciphertext, as it should be):{" "}
        <a href={`https://aggregator.walrus-testnet.walrus.space/v1/blobs/${EXAMPLE_BLOB}`}>
          <code>{EXAMPLE_BLOB}</code>
        </a>
        . Forgetting an entry removes the on-chain reference; the orphaned ciphertext on Walrus
        stays undecryptable.
      </p>

      <h2>Seal identity format</h2>
      <p>
        Blobs are encrypted under the identity <code>[package id][vault object id][nonce]</code>{" "}
        using Seal threshold encryption. The package id namespace is the ORIGINAL package id;
        decryption requires the key-server committee to dry-run{" "}
        <code>memory_policy::seal_approve</code> and see the caller as the vault owner or a
        currently-granted app for that exact vault. Wrong vault prefix → denied, revoked app →
        denied.
      </p>
    </>
  );
}
