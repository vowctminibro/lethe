"use client";

/**
 * Chat with Lethe — surface #1 of the hero flow (0:15–0:40).
 *
 * The reply streams token-by-token from the free LLM chain (Groq → Gemini),
 * grounded on recalled owned memories (lightweight RAG). After each user turn a
 * strict-JSON extraction pulls 0–2 durable facts; each one animates into the
 * memory rail as a pending chip, then confirms once its encrypted Walrus blob +
 * gasless on-chain add_entry land — with live Walrus/Suiscan links. Optional:
 * link any wallet read-only for on-chain flavor, or derive memories from the
 * signed-in address's real activity.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSuiClient } from "@mysten/dapp-kit";
import { Logo } from "@/src/components/Logo";
import { SignIn } from "@/src/components/SiteHeader";
import { MemoryRail, type RailEntry } from "@/src/components/MemoryRail";
import { useMemory, getOwnedMemory, MEMORY_ALLOWLISTED } from "@/src/lib/memory";
import { DEMO_MOCK, getMockOwnedMemory, useLetheAccount } from "@/src/lib/demo/mock";

type Msg = {
  role: "you" | "lethe";
  text: string;
  /** which model produced this reply, e.g. "groq/llama-3.3-70b-versatile" */
  provider?: string;
  /** true while tokens are still arriving */
  streaming?: boolean;
};

let railUid = 0;
const nextRailId = () => `rail-${++railUid}`;

export default function ChatPage() {
  const account = useLetheAccount();
  const client = useSuiClient();
  const memory = useMemory();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [rail, setRail] = useState<RailEntry[]>([]);
  const [railLoading, setRailLoading] = useState(false);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [linkedWallet, setLinkedWallet] = useState<{ address: string; lines: string[] } | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "lethe",
      text: "Hey — I'm Lethe. Tell me about your crypto style (e.g. \"I'm a momentum trader and I hate leverage\") and I'll remember it on Walrus, owned by you. Or let me read your on-chain activity and learn from what you've actually done.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  // Compact digest of every owned memory, kept in context for the whole chat.
  const digestRef = useRef<string[]>([]);
  // One personalized greeting per page load, and only before the user types.
  const greetedRef = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, rail]);

  // ── returning user: replace the canned opener with a woven greeting ──────
  const streamGreeting = useCallback(async (context: string[]) => {
    if (greetedRef.current || context.length === 0) return;
    greetedRef.current = true;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greet: true, context }),
      });
      if (!res.ok || !res.body) return; // keep the default opener
      const provider = res.headers.get("x-provider") ?? undefined;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        const sofar = text;
        // Only ever rewrite the untouched opener — bail if the user typed.
        setMsgs((m) =>
          m.length === 1 && m[0].role === "lethe"
            ? [{ role: "lethe", text: sofar, provider, streaming: true }]
            : m,
        );
      }
      setMsgs((m) =>
        m.length === 1 && m[0].role === "lethe" ? [{ ...m[0], streaming: false }] : m,
      );
    } catch {
      /* greeting is sugar — the default opener stands */
    }
  }, []);

  // ── seed the rail from the on-chain vault ────────────────────────────────
  const loadRail = useCallback(async () => {
    if (!account || !memory) return;
    setRailLoading(true);
    try {
      const owned = DEMO_MOCK ? getMockOwnedMemory() : await getOwnedMemory(client, account.address);
      setVaultId(owned?.objectId ?? null);
      if (owned && owned.entries.length > 0) {
        // recall("") decrypts everything; map to confirmed chips, newest first.
        const hits = await memory.recall("");
        const newestFirst = hits.slice().sort((a, b) => b.createdAtMs - a.createdAtMs);
        // Digest stays in the system prompt for the whole conversation.
        digestRef.current = newestFirst.slice(0, 12).map((h) => h.text.slice(0, 160));
        setRail(
          newestFirst.map((h) => ({
            id: `chain-${h.blobId}`,
            kind: h.kind,
            summary: h.text,
            status: "confirmed" as const,
            createdAtMs: h.createdAtMs,
            blobId: h.blobId,
          })),
        );
        // Returning user: greet personally instead of the canned opener.
        void streamGreeting(digestRef.current);
      } else {
        setRail([]);
      }
    } catch {
      // Rail is auxiliary — chat must keep working even if Walrus reads hiccup.
      setRail([]);
    } finally {
      setRailLoading(false);
    }
  }, [account, memory, client, streamGreeting]);

  useEffect(() => {
    void loadRail();
  }, [loadRail]);

  // ── persist one extracted fact: pending chip → walrus+chain → confirmed ──
  async function persistFact(fact: { text: string; kind: string }) {
    if (!memory) return;
    const id = nextRailId();
    setRail((r) => [
      { id, kind: fact.kind, summary: fact.text, status: "pending", createdAtMs: Date.now() },
      ...r,
    ]);
    try {
      const res = await memory.remember({ text: fact.text, kind: fact.kind });
      setRail((r) =>
        r.map((e) =>
          e.id === id
            ? { ...e, status: "confirmed" as const, blobId: res.blobId, digest: res.digest, createdAtMs: res.createdAtMs }
            : e,
        ),
      );
      setVaultId((v) => v ?? res.memoryId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "write failed";
      setRail((r) => r.map((e) => (e.id === id ? { ...e, status: "failed" as const, error: msg } : e)));
    }
  }

  // ── one chat turn: recall → stream reply → extract → persist ─────────────
  async function send() {
    const text = input.trim();
    if (!text || !memory || busy) return;
    setInput("");
    const history = [...msgs, { role: "you" as const, text }];
    setMsgs(history);
    setBusy(true);

    try {
      // 1) RAG: most-relevant recall first, then the load-time digest fills
      // the rest — memories stay in context for the whole conversation.
      let context: string[] = [];
      try {
        const hits = await memory.recall(text, { limit: 5 });
        context = hits.map((h) => h.text);
      } catch {
        /* recall is enrichment — stream the reply regardless */
      }
      context = [...new Set([...context, ...digestRef.current])].slice(0, 12);

      // 2) Stream the reply token-by-token into a growing bubble.
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          walletContext: linkedWallet?.lines ?? [],
          messages: history.map((m) => ({
            role: m.role === "you" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? "chat failed");
      }
      const provider = res.headers.get("x-provider") ?? undefined;

      setMsgs((m) => [...m, { role: "lethe", text: "", provider, streaming: true }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        const sofar = reply;
        setMsgs((m) => {
          const out = [...m];
          out[out.length - 1] = { ...out[out.length - 1], text: sofar };
          return out;
        });
      }
      setMsgs((m) => {
        const out = [...m];
        out[out.length - 1] = { ...out[out.length - 1], streaming: false };
        return out;
      });

      // 3) Extraction step: 0–2 durable facts → rail chips → Walrus + chain.
      try {
        const ex = await fetch("/api/chat/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user: text, reply, context }),
        });
        if (ex.ok) {
          const { facts } = (await ex.json()) as { facts: { text: string; kind: string }[] };
          await Promise.all(facts.map((f) => persistFact(f)));
        }
      } catch {
        /* extraction is best-effort; the conversation already succeeded */
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setMsgs((m) => [
        ...m.filter((x) => !(x.streaming && !x.text)),
        { role: "lethe", text: `Hmm — ${msg}. Give it another try in a moment.` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  // ── derive memories from the signed-in address's real on-chain activity ──
  async function analyze() {
    if (!account || !memory || analyzing || busy) return;
    setAnalyzing(true);
    setMsgs((m) => [
      ...m,
      { role: "you", text: "Analyze my on-chain activity" },
      { role: "lethe", text: "Reading your activity on Sui — coins held, transaction history, protocols you've touched…" },
    ]);
    try {
      const res = await fetch("/api/onchain/derive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: account.address }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? "on-chain analysis failed");
      }
      const { entries, provider } = (await res.json()) as {
        entries: { text: string; kind: string }[];
        provider: string;
      };

      setMsgs((m) => [
        ...m,
        {
          role: "lethe",
          provider,
          text: `Here's what I learned from your on-chain activity — you didn't tell me any of this:\n${entries
            .map((e) => `• ${e.text}`)
            .join("\n")}\n\nSaving these to your owned memory — watch the rail.`,
        },
      ]);
      await Promise.all(entries.map((e) => persistFact(e)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setMsgs((m) => [...m, { role: "lethe", text: `Hmm — ${msg}.` }]);
    } finally {
      setAnalyzing(false);
    }
  }

  // ── link any wallet read-only for context flavor ──────────────────────────
  async function linkWallet() {
    const addr = walletInput.trim();
    if (!/^0x[0-9a-fA-F]{1,64}$/.test(addr) || walletBusy) return;
    setWalletBusy(true);
    try {
      const res = await fetch("/api/onchain/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? "couldn't read that wallet");
      }
      const { lines } = (await res.json()) as { lines: string[] };
      setLinkedWallet({ address: addr, lines });
      setWalletOpen(false);
      setWalletInput("");
      setMsgs((m) => [
        ...m,
        {
          role: "lethe",
          text: `Linked ${addr.slice(0, 8)}…${addr.slice(-4)} (read-only). I'll keep its holdings and activity in mind as we talk.`,
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "couldn't read that wallet";
      setMsgs((m) => [...m, { role: "lethe", text: `Hmm — ${msg}.` }]);
    } finally {
      setWalletBusy(false);
    }
  }

  const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <main className="h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
        <div className="max-w-6xl mx-auto w-full px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <Link href="/memory" className="text-sm whitespace-nowrap hover:opacity-70 transition" style={{ color: "var(--text-dim)" }}>
              Your Memory →
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {DEMO_MOCK && (
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded border uppercase tracking-wide" style={{ borderColor: "var(--accent-h)", color: "var(--accent-h)" }}>
                demo mock
              </span>
            )}
            <SignIn />
          </div>
        </div>
      </header>

      {!MEMORY_ALLOWLISTED && account && !DEMO_MOCK && (
        <div className="max-w-6xl mx-auto w-full px-6 pt-3 shrink-0">
          <p className="text-xs rounded-md border px-3 py-2" style={{ borderColor: "var(--accent-h)", color: "var(--text-dim)" }}>
            Gasless writes need the memory Move targets on the Enoki allowlist. Until then, remembering may fail at the
            sponsor step (read/recall still works).
          </p>
        </div>
      )}

      <div className="flex-1 min-h-0 max-w-6xl mx-auto w-full px-6 py-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-5">
        {/* ── chat column ── */}
        <div className="flex flex-col min-h-0 rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-4">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "you" ? "self-end max-w-[80%]" : "self-start max-w-[85%]"}>
                <div
                  className="rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed"
                  style={
                    m.role === "you"
                      ? { background: "var(--text)", color: "var(--accent)" }
                      : { background: "var(--bg)", border: "1px solid var(--border)" }
                  }
                >
                  {m.text}
                  {m.streaming && (
                    <span className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom animate-pulse" style={{ background: "var(--text-dim)" }} />
                  )}
                </div>
                {m.provider && !m.streaming && (
                  <div className="mt-1 text-[10px]" style={{ color: "var(--text-dim)" }} title="The free LLM that produced this reply">
                    via {m.provider}
                  </div>
                )}
              </div>
            ))}
            {(analyzing || (busy && msgs[msgs.length - 1]?.role === "you")) && (
              <div className="self-start rounded-2xl px-4 py-3 border" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="lethe-shimmer h-3 w-36 rounded" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t shrink-0 px-5 py-4" style={{ borderColor: "var(--border)" }}>
            {!account ? (
              <div className="text-sm text-center py-1" style={{ color: "var(--text-dim)" }}>
                Sign in with Google above to start your owned memory.
              </div>
            ) : (
              <>
                <div className="mb-2.5 flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={analyze}
                    disabled={analyzing || busy}
                    className="text-xs px-3 py-1.5 rounded-full border hover:opacity-80 transition disabled:opacity-50"
                    style={{ borderColor: "var(--accent-h)", color: "var(--text-dim)" }}
                    title="Lethe reads your real Sui activity and remembers what it learns"
                  >
                    {analyzing ? "Analyzing on-chain…" : "Analyze my on-chain activity"}
                  </button>

                  {linkedWallet ? (
                    <span className="text-[11px] flex items-center gap-2" style={{ color: "var(--text-dim)" }}>
                      wallet {short(linkedWallet.address)} linked · read-only
                      <button onClick={() => setLinkedWallet(null)} className="underline hover:opacity-70">
                        unlink
                      </button>
                    </span>
                  ) : walletOpen ? (
                    <span className="flex items-center gap-1.5">
                      <input
                        value={walletInput}
                        onChange={(e) => setWalletInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && linkWallet()}
                        placeholder="0x… wallet to link (read-only)"
                        autoFocus
                        className="h-8 px-2.5 rounded-md text-xs outline-none w-64"
                        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                      />
                      <button
                        onClick={linkWallet}
                        disabled={walletBusy || !/^0x[0-9a-fA-F]{1,64}$/.test(walletInput.trim())}
                        className="text-xs px-2.5 h-8 rounded-md border disabled:opacity-50"
                        style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
                      >
                        {walletBusy ? "Reading…" : "Link"}
                      </button>
                      <button onClick={() => setWalletOpen(false)} className="text-xs underline" style={{ color: "var(--text-dim)" }}>
                        cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setWalletOpen(true)}
                      className="text-[11px] underline decoration-dotted underline-offset-2 hover:opacity-70 transition"
                      style={{ color: "var(--text-dim)" }}
                      title="Give Lethe read-only sight of any wallet's holdings for context"
                    >
                      Link a wallet (read-only)
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Tell Lethe about your crypto style…"
                    disabled={busy}
                    className="flex-1 h-11 px-4 rounded-xl text-sm outline-none"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                  <button
                    onClick={send}
                    disabled={busy || !input.trim()}
                    className="h-11 px-5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                    style={{ background: "var(--text)", color: "var(--accent)" }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── memory rail ── */}
        <div className="hidden lg:flex flex-col min-h-0">
          <MemoryRail entries={rail} vaultId={vaultId} loading={railLoading} />
        </div>
      </div>
    </main>
  );
}
