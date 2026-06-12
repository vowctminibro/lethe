export default function DocsSecurity() {
  return (
    <>
      <h1>Security</h1>

      <h2>Seal threshold encryption</h2>
      <p>
        Memories are encrypted in your browser with{" "}
        <a href="https://seal-docs.wal.app">Seal</a> — Mysten infrastructure, like Walrus and
        zkLogin. Decryption keys are released by a decentralized committee of key servers, and
        only after the committee dry-runs our on-chain policy{" "}
        <code>memory_policy::seal_approve</code> and it approves the caller. Lethe runs none of
        the key servers.
      </p>

      <h2>What servers can and cannot see</h2>
      <ul>
        <li>
          <strong>Cannot:</strong> read your memories. The store route pins ciphertext to Walrus;
          plaintext and key material never reach a Lethe server in Seal mode. Decryption happens
          in your browser under a session key you sign.
        </li>
        <li>
          <strong>Can:</strong> see the chat messages you send to the LLM during a conversation
          (that is how any hosted model works), your address, and your vault&rsquo;s public
          on-chain metadata (entry count, authorized apps — visible to everyone on Suiscan).
        </li>
        <li>
          <strong>Honest caveat:</strong> entries written before the Seal upgrade (legacy mode)
          were encrypted server-side with AES; those remain readable by the legacy path until
          re-written. New entries are Seal-encrypted end-to-end. A <code>manual</code> provider
          flag keeps the legacy mode available as a fallback.
        </li>
      </ul>

      <h2>Formally verified — 19/19</h2>
      <p>
        The vault&rsquo;s invariants are machine-checked with{" "}
        <a href="https://github.com/asymptotic-code/sui-prover">sui-prover</a>: owner-only writes,
        append/remove exactness (universal quantification, not sampling), grant/revoke never touch
        the log, fresh vaults start empty — and <strong>I5, deny-universality</strong>:{" "}
        <code>seal_approve</code> provably aborts for every sender that is neither the vault owner
        nor currently granted, for all identities. Reproduce:
      </p>
      <pre>
        <code>{`brew install asymptotic-code/sui-prover/sui-prover
cd contracts/memory_specs && sui-prover   # 19/19`}</code>
      </pre>

      <h2>Revoke = the key servers stop approving</h2>
      <p>
        Revocation is not a soft delete. The policy reads the live{" "}
        <code>authorized</code> vector on-chain at decryption time, so the moment your revoke
        transaction lands, the committee stops releasing keys for that app — by proof (I5), not by
        promise.
      </p>

      <h2>Known limits, stated plainly</h2>
      <ul>
        <li>
          Third-party apps read through a server-mediated grant gate today; independent app
          decrypt sessions need the grant state in a shared object (key servers reject owned-object
          dry-runs for non-owner senders) — that registry is on the roadmap.
        </li>
        <li>Message size is not concealed by encryption; entry counts are public on-chain.</li>
        <li>Testnet infrastructure (public Walrus publisher/aggregator) has no SLA.</li>
      </ul>
    </>
  );
}
