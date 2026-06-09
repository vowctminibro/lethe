"use client";

/**
 * Chat with Lethe — surface #1 of the hero flow (0:15–0:40).
 *
 * The user talks crypto; each stated fact is remembered (encrypted → Walrus →
 * referenced on their owned Sui Memory object, gasless). Asking a question
 * recalls from that same memory. This is the end-to-end loop: state facts →
 * reload → recall pulls them back from Walrus.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Logo } from "@/src/components/Logo";
import { SignIn } from "@/src/components/SiteHeader";
import { useMemory, MEMORY_ALLOWLISTED } from "@/src/lib/memory";

type Msg = {
  role: "you" | "lethe";
  text: string;
  // optional proof chips shown under a "lethe" ack
  proof?: { blobId: string; memoryId: string; digest: string; gasOwner: string | null };
};

const QUESTION_RE = /^(what|whats|how|who|when|where|which|why|do|does|is|are|tell me|remind)/i;

/** Crude kind tagger so entries carry a semantic label in the verifiable view. */
function classifyKind(text: string): string {
  const t = text.toLowerCase();
  if (/(momentum|swing|scalp|leverage|trader|trade|risk)/.test(t)) return "trading-style";
  if (/(bullish|bearish|long|short)/.test(t)) return "market-view";
  if (/(hold|holding|aped|bought|sold|bag|stack|position)/.test(t)) return "holding";
  if (/(hate|love|like|prefer|favorite|avoid)/.test(t)) return "preference";
  return "fact";
}

const SUISCAN = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
const SUISCAN_TX = (d: string) => `https://suiscan.xyz/testnet/tx/${d}`;
const short = (s: string) => (s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s);

export default function ChatPage() {
  const account = useCurrentAccount();
  const memory = useMemory();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "lethe",
      text: "Hey — I'm Lethe. Tell me about your crypto style (e.g. \"I'm a momentum trader and I hate leverage\") and I'll remember it on Walrus, owned by you. Ask me \"what's my style?\" to recall.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text || !memory || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "you", text }]);
    setBusy(true);

    try {
      if (QUESTION_RE.test(text)) {
        const hits = await memory.recall(text, { limit: 5 });
        if (hits.length === 0) {
          setMsgs((m) => [
            ...m,
            { role: "lethe", text: "I don't have anything on that yet. Tell me a few things about how you trade." },
          ]);
        } else {
          const lines = hits.map((h) => `• ${h.text}`).join("\n");
          setMsgs((m) => [
            ...m,
            { role: "lethe", text: `Here's what I remember about you:\n${lines}` },
          ]);
        }
      } else {
        const kind = classifyKind(text);
        const r = await memory.remember({ text, kind });
        setMsgs((m) => [
          ...m,
          {
            role: "lethe",
            text: `Got it — remembered as "${kind}". It's encrypted on Walrus and referenced on your own Memory object on Sui.`,
            proof: { blobId: r.blobId, memoryId: r.memoryId, digest: r.digest, gasOwner: r.gasOwner },
          },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setMsgs((m) => [...m, { role: "lethe", text: `⚠️ ${msg}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header className="border-b" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <Link href="/memory" className="text-sm underline" style={{ color: "var(--text-dim)" }}>
              Your Memory →
            </Link>
          </div>
          <SignIn />
        </div>
      </header>

      {!MEMORY_ALLOWLISTED && account && (
        <div className="max-w-3xl mx-auto w-full px-6 pt-3">
          <p className="text-xs rounded-md border px-3 py-2" style={{ borderColor: "var(--accent-h)", color: "var(--text-dim)" }}>
            Gasless writes need the memory Move targets on the Enoki allowlist. Until then, remembering may fail at the
            sponsor step (read/recall still works).
          </p>
        </div>
      )}

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-4 overflow-y-auto">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "you" ? "self-end max-w-[80%]" : "self-start max-w-[85%]"}>
            <div
              className="rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
              style={
                m.role === "you"
                  ? { background: "var(--text)", color: "var(--accent)" }
                  : { background: "var(--bg-panel)", border: "1px solid var(--border)" }
              }
            >
              {m.text}
            </div>
            {m.proof && (
              <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]" style={{ color: "var(--text-dim)" }}>
                <a className="underline" href={`${process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL}/v1/blobs/${m.proof.blobId}`} target="_blank" rel="noreferrer">
                  Walrus blob {short(m.proof.blobId)} ↗
                </a>
                <a className="underline" href={SUISCAN(m.proof.memoryId)} target="_blank" rel="noreferrer">
                  Memory object {short(m.proof.memoryId)} ↗
                </a>
                <a className="underline" href={SUISCAN_TX(m.proof.digest)} target="_blank" rel="noreferrer">
                  tx {short(m.proof.digest)} ↗
                </a>
                {m.proof.gasOwner && <span title={m.proof.gasOwner}>· gasless ✓</span>}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="self-start text-sm" style={{ color: "var(--text-dim)" }}>
            Lethe is thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto w-full px-6 py-4">
          {!account ? (
            <div className="text-sm text-center" style={{ color: "var(--text-dim)" }}>
              Sign in with Google above to start your owned memory.
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Tell Lethe about your crypto style…"
                disabled={busy}
                className="flex-1 h-11 px-4 rounded-md text-sm outline-none"
                style={{ background: "var(--bg-panel)", border: "1px solid var(--border)", color: "var(--text)" }}
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="h-11 px-5 rounded-md text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--text)", color: "var(--accent)" }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
