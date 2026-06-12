export default function DocsSdk() {
  return (
    <>
      <h1>SDK — &ldquo;Continue with Lethe&rdquo;</h1>
      <p>
        Apps integrate Lethe to warm-start their users with memory the user already owns: your
        new trading app doesn&rsquo;t start from zero — it asks for a grant and already knows the
        user is a no-leverage momentum trader. <code>@lethe/sdk</code> wraps the same paths the
        Pulse demo runs in production.
      </p>
      <p className="dim">
        Status: in-repo, not on npm yet. Install from the workspace —{" "}
        <a href="https://github.com/vowctminibro/lethe/tree/main/packages/sdk">
          packages/sdk on GitHub
        </a>
        .
      </p>

      <h2>Read a vault in ~10 lines</h2>
      <pre>
        <code>{`import { LetheClient, GrantDeniedError } from "@lethe/sdk";

const lethe = new LetheClient(); // testnet defaults
const vault = await lethe.getVaultByOwner("0x4bf2…8077");
console.log(vault.entries.length, "memories ·", vault.authorized.length, "apps granted");

try {
  const { entries } = await lethe.requestReadAsGrantee({ ownerAddress: vault.owner });
  console.log(entries.map((e) => e.text)); // decrypted, grant-gated
} catch (e) {
  if (e instanceof GrantDeniedError) console.log("user revoked — you know nothing");
}`}</code>
      </pre>
      <p>
        Runnable version: <code>cd packages/sdk &amp;&amp; pnpm example</code> — it reads a real
        testnet vault and prints live Suiscan/Walrus links.
      </p>

      <h2>Surface</h2>
      <ul>
        <li>
          <code>getVaultByOwner(address)</code> / <code>listEntries(vaultId)</code> — the
          vault&rsquo;s public on-chain metadata (entry refs, authorized apps), straight from a
          fullnode.
        </li>
        <li>
          <code>requestReadAsGrantee(&#123; ownerAddress &#125;)</code> — decrypted entries
          through the server-mediated grant gate; throws <code>GrantDeniedError</code> on a
          revoked or never-given grant (HTTP 403), enforced against the live on-chain list.
        </li>
      </ul>

      <h2>Why server-mediated today</h2>
      <p>
        Seal key servers evaluate decryption policies by dry-running them on-chain, and dry-runs
        reject address-owned objects for senders that don&rsquo;t own them — so a third-party app
        cannot yet run its own decrypt session against a user&rsquo;s owned vault. Today
        decryption happens in the owner&rsquo;s browser session or through a grant-enforcing
        endpoint like the one this SDK calls. Independent app decrypt sessions arrive with the
        shared-registry policy — roadmap. The grant/revoke enforcement itself is already on-chain
        and machine-verified (19/19, including deny-universality of <code>seal_approve</code>).
      </p>
    </>
  );
}
