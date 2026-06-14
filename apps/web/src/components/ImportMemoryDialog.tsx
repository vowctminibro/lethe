"use client";

/**
 * Import memory from another AI — the SAME paste-extract-remember flow /memory
 * has shipped since Block 9, extracted verbatim into a shared component so /chat
 * can open the identical modal. No behavior change: paste → /api/memory/import-
 * extract (nothing stored server-side) → each durable fact runs the normal
 * gasless remember({ kind: "imported" }) loop, Seal-encrypted on Walrus.
 *
 * The parent owns visibility (open/onClose) and the post-import effect
 * (onImported → toast + reload) so /memory and /chat can react their own way.
 */

import { useState } from "react";
import { useMemory } from "@/src/lib/memory";

type ImportState =
  | { phase: "idle" }
  | { phase: "extracting" }
  | { phase: "writing"; done: number; total: number }
  | { phase: "error"; message: string };

export function ImportMemoryDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const memory = useMemory();
  const [importText, setImportText] = useState("");
  const [importState, setImportState] = useState<ImportState>({ phase: "idle" });
  const busy = importState.phase === "extracting" || importState.phase === "writing";

  async function runImport() {
    const text = importText.trim();
    if (!memory || !text || busy) return;
    setImportState({ phase: "extracting" });
    try {
      const res = await fetch("/api/memory/import-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err?.error ?? "extraction failed");
      }
      const { facts } = (await res.json()) as { facts: { text: string }[] };
      if (facts.length === 0) {
        setImportState({ phase: "error", message: "No durable facts found in that paste — try the full answer from your other AI." });
        return;
      }
      setImportState({ phase: "writing", done: 0, total: facts.length });
      let done = 0;
      for (const f of facts) {
        // Sequential on purpose: each write is a gasless tx on the same vault.
        await memory.remember({ text: f.text, kind: "imported" });
        done++;
        setImportState({ phase: "writing", done, total: facts.length });
      }
      setImportText("");
      setImportState({ phase: "idle" });
      onImported(done);
      onClose();
    } catch (e) {
      setImportState({ phase: "error", message: e instanceof Error ? e.message : "import failed" });
    }
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 lethe-overlay-in"
      style={{ background: "rgba(10, 22, 40, 0.45)" }}
      onClick={() => !busy && onClose()}
    >
      <div
        data-testid="import-dialog"
        className="w-full max-w-lg rounded border p-5"
        style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Import memory from another AI
        </h3>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Ask ChatGPT (or any assistant): <em>&ldquo;What do you remember about me?&rdquo;</em>{" "}
          — then paste the answer here. Each durable fact becomes a Seal-encrypted memory on
          Walrus, owned by you, tagged <code className="lethe-id">imported</code>.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value.slice(0, 8000))}
          placeholder="Paste here — up to 8,000 characters…"
          rows={8}
          autoFocus
          className="mt-3 w-full rounded border p-3 text-sm outline-none resize-y"
          style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="lethe-id" style={{ color: "var(--text-dim)" }}>{importText.length}/8000</span>
          {importState.phase === "error" && (
            <span className="text-xs" style={{ color: "#C0564A" }}>{importState.message}</span>
          )}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="h-9 px-4 rounded text-sm border disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
          >
            Cancel
          </button>
          <button
            data-testid="import-run"
            onClick={runImport}
            disabled={!importText.trim() || busy}
            className="h-9 px-4 rounded text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            {importState.phase === "extracting"
              ? "Reading…"
              : importState.phase === "writing"
                ? `Encrypting ${importState.done}/${importState.total}…`
                : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
