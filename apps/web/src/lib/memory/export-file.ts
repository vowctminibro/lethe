/**
 * Shared memory export — the SAME client-side JSON download /memory has always
 * shipped, extracted verbatim so /chat can reuse it without forking logic. The
 * owner's entries are already decrypted client-side (Seal); this just shapes the
 * file and triggers the download. No behavior change from the original
 * /memory exportMemory().
 */
export interface ExportEntry {
  text: string;
  kind: string;
  createdAtMs: number;
  blobId: string;
}

export function exportMemoryFile(args: {
  address: string;
  vaultId: string;
  entries: ExportEntry[];
}): { name: string; count: number } {
  const agg = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL ?? "";
  const payload = {
    note: "Exported from Lethe — your memory, your file.",
    exportedAt: new Date().toISOString(),
    owner: args.address,
    vaultId: args.vaultId,
    vaultUrl: `https://suiscan.xyz/testnet/object/${args.vaultId}`,
    entries: args.entries.map((h) => ({
      text: h.text,
      kind: h.kind,
      createdAtMs: h.createdAtMs,
      blobId: h.blobId,
      walrusUrl: `${agg}/v1/blobs/${encodeURIComponent(h.blobId)}`,
      suiscanObjectUrl: `https://suiscan.xyz/testnet/object/${args.vaultId}`,
    })),
  };
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const name = `lethe-memory-${args.address.slice(2, 8)}-${date}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
  return { name, count: args.entries.length };
}
