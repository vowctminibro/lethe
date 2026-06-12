/**
 * SealProvider — true end-to-end encryption via Mysten Seal.
 *
 * Extends ManualProvider so grant/revoke/forget and the gasless plumbing are
 * IDENTICAL; only the crypto plane changes:
 *  - remember: Seal-encrypt CLIENT-SIDE under [original pkg][vault id][nonce]
 *    → POST ciphertext to /api/memory/store (pure Walrus passthrough — the
 *    server never sees plaintext) → gasless add_entry, same as manual.
 *  - recall: read blob refs on-chain → fetch ciphertext from the public
 *    Walrus aggregator (browser-direct, CORS open) → Seal-decrypt with the
 *    cached SessionKey after memory_policy::seal_approve clears on the key
 *    servers. Legacy AES blobs (pre-Seal entries) are detected by parse and
 *    routed through the existing server recall — old vaults stay readable.
 *
 * Selected via NEXT_PUBLIC_MEMORY_PROVIDER=seal (default stays manual).
 */

import { ManualProvider, type ManualProviderDeps } from "./manual-provider";
import type { RecallHit, BlobRef, MemoryEntry, RememberResult } from "./types";
import { getOwnedMemory } from "./chain";
import { sealEncrypt, parseSealBlob, sealDecryptBatch } from "./seal";
import { getSealSession, type SignPersonalMessageFn } from "./seal-session";
import { scoreEntry } from "./retrieval";
import { ensureVault } from "./gasless";
import { buildAddEntryTx } from "./chain";
import { executeGasless } from "./gasless";
import { toBase64 } from "@mysten/sui/utils";

const AGGREGATOR_URL =
  process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ?? "https://aggregator.walrus-testnet.walrus.space";

export interface SealProviderDeps extends ManualProviderDeps {
  /** Personal-message signer for the per-session decrypt key (zkLogin/keypair). */
  signPersonalMessage: SignPersonalMessageFn;
}

export class SealProvider extends ManualProvider {
  #sealDeps: SealProviderDeps;
  #ns: string;

  constructor(deps: SealProviderDeps) {
    super(deps);
    this.#sealDeps = deps;
    this.#ns = deps.namespace ?? "lethe";
  }

  override async remember(entry: MemoryEntry): Promise<RememberResult> {
    const { vaultId } = await ensureVault(this.#sealDeps);
    const createdAtMs = Date.now();

    // Client-side Seal encryption — plaintext never leaves the browser.
    const payload = JSON.stringify({ text: entry.text.trim(), kind: entry.kind, createdAtMs });
    const ciphertext = await sealEncrypt(this.#sealDeps.client, vaultId, payload);

    // Server is a dumb pipe to Walrus here.
    const res = await fetch("/api/memory/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ciphertextB64: toBase64(ciphertext) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string })?.error ?? "Walrus store failed");
    }
    const { blobId } = (await res.json()) as { blobId: string };

    const ref: BlobRef = { blobId, namespace: this.#ns, kind: entry.kind, createdAtMs };
    const { digest, gasOwner } = await executeGasless(
      this.#sealDeps,
      buildAddEntryTx({ memoryId: vaultId, ref }),
    );
    return { ...ref, memoryId: vaultId, digest, gasOwner };
  }

  override async recall(query: string, opts?: { limit?: number }): Promise<RecallHit[]> {
    const memory = await getOwnedMemory(this.#sealDeps.client, this.#sealDeps.ownerAddress);
    if (!memory || memory.entries.length === 0) return [];

    // Fetch every referenced blob straight from the public aggregator.
    const fetched = await Promise.allSettled(
      memory.entries.map(async (ref) => {
        const res = await fetch(`${AGGREGATOR_URL}/v1/blobs/${encodeURIComponent(ref.blobId)}`);
        if (!res.ok) throw new Error(`aggregator ${res.status}`);
        return { ref, bytes: new Uint8Array(await res.arrayBuffer()) };
      }),
    );
    const blobs = fetched
      .filter((s) => s.status === "fulfilled")
      .map((s) => (s as PromiseFulfilledResult<{ ref: BlobRef; bytes: Uint8Array }>).value);

    // Partition: Seal blobs decrypt here; legacy AES blobs go to the server path.
    const sealBlobs: { ref: BlobRef; bytes: Uint8Array; id: string }[] = [];
    const legacyRefs: BlobRef[] = [];
    for (const b of blobs) {
      const parsed = parseSealBlob(b.bytes);
      if (parsed) sealBlobs.push({ ...b, id: parsed.id });
      else legacyRefs.push(b.ref);
    }

    const hits: RecallHit[] = [];

    if (sealBlobs.length > 0) {
      const session = await getSealSession(
        this.#sealDeps.client,
        this.#sealDeps.ownerAddress,
        this.#sealDeps.signPersonalMessage,
      );
      const texts = await sealDecryptBatch(
        this.#sealDeps.client,
        session,
        memory.objectId,
        sealBlobs.map((b) => ({ bytes: b.bytes, id: b.id })),
      );
      texts.forEach((plaintext, i) => {
        if (plaintext === null) return;
        const { ref } = sealBlobs[i];
        let text = plaintext;
        try {
          const parsed = JSON.parse(plaintext);
          if (parsed && typeof parsed.text === "string") text = parsed.text;
        } catch {
          /* raw text blob */
        }
        hits.push({
          text,
          blobId: ref.blobId,
          namespace: ref.namespace,
          kind: ref.kind,
          createdAtMs: ref.createdAtMs,
          score: scoreEntry(query, `${text} ${ref.kind.replace(/-/g, " ")}`),
        });
      });
    }

    if (legacyRefs.length > 0) {
      try {
        const res = await fetch("/api/memory/recall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ownerAddress: this.#sealDeps.ownerAddress,
            query,
            refs: legacyRefs,
          }),
        });
        if (res.ok) {
          const { hits: legacyHits } = (await res.json()) as { hits: RecallHit[] };
          hits.push(...legacyHits);
        }
      } catch {
        /* legacy plane down — seal entries still answer */
      }
    }

    const sorted = query.trim()
      ? hits.sort((a, b) => b.score - a.score || b.createdAtMs - a.createdAtMs)
      : hits.sort((a, b) => b.createdAtMs - a.createdAtMs);
    const n = opts?.limit && opts.limit > 0 ? opts.limit : sorted.length;
    return sorted.slice(0, n);
  }
}
