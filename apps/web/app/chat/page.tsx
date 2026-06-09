"use client";

/**
 * Chat with Lethe — surface #1 of the hero flow (0:15–0:40).
 *
 * A real LLM (Groq → Gemini, free) drives the conversation, grounded on the
 * user's recalled memories (lightweight RAG). When the user reveals a durable
 * fact the model flags it and we remember it: encrypted → Walrus → referenced on
 * their owned Sui Memory object, gasless. Asking a question recalls from that
 * same memory. End-to-end loop: talk → facts persist on Walrus → recall pulls
 * them back as context for the next reply.
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
  // which model produced this reply, e.g. "groq/llama-3.3-70b-versatile"
  provider?: string;
  // optional proof chips shown under a "lethe" ack
  proof?: { blobId: string; memoryId: string; digest: string; gasOwner: string | null };
};

const SUISCAN = (id: string) => `https://suiscan.xyz/testnet/object/${id}`;
const SUISCAN_TX = (d: string) => `https://suiscan.xyz/testnet/tx/${d}`;
const short = (s: string) => (s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s);

export default function ChatPage() {
  const account = useCurrentAccount();
  const memory = useMemory();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "lethe",
      text: "Hey — I'm Lethe. Tell me about your crypto style (e.g. \"I'm a momentum trader and I hate leverage\") and I'll remember it on Walrus, owned by you. Or hit \"Analyze my on-chain activity\" below and I'll learn about you from what you've actually done on Sui.",
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
    const history = [...msgs, { role: "you" as const, text }];
    setMsgs(history);
    setBusy(true);

    try {
      // 1) RAG: recall the most relevant owned memories to ground the reply.
      const hits = await memory.recall(text, { limit: 5 });
      const context = hits.map((h) => h.text);

      // 2) Real LLM turn. Send the running transcript + recalled context; the
      //    model returns a reply and (optionally) a new durable fact to remember.
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: history.map((m) => ({
            role: m.role === "you" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "chat failed");
      }
      const { reply, remember, provider } = (await res.json()) as {
        reply: string;
        remember: { text: string; kind: string } | null;
        provider: string;
      };

      // 3) Show the reply immediately.
      setMsgs((m) => [...m, { role: "lethe", text: reply, provider }]);

      // 4) If the model flagged a new fact, persist it (gasless) and attach proof.
      if (remember) {
        try {
          const r = await memory.remember({ text: remember.text, kind: remember.kind });
          setMsgs((m) => [
            ...m,
            {
              role: "lethe",
              text: `📌 Remembered "${remember.text}" as ${remember.kind} — encrypted on Walrus, referenced on your own Memory object.`,
              proof: { blobId: r.blobId, memoryId: r.memoryId, digest: r.digest, gasOwner: r.gasOwner },
            },
          ]);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "couldn't persist that memory";
          setMsgs((m) => [...m, { role: "lethe", text: `⚠️ ${msg}` }]);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setMsgs((m) => [...m, { role: "lethe", text: `⚠️ ${msg}` }]);
    } finally {
      setBusy(false);
    }
  }

  /**
   * The wedge: read the signed-in address's real on-chain activity, derive
   * memories from it via the LLM, and persist each one (gasless) — the agent
   * learns about the user from what they DID, not what they said.
   */
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
        throw new Error(err?.error ?? "on-chain analysis failed");
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
            .join("\n")}\n\nSaving these to your owned memory…`,
        },
      ]);

      // Persist each derived fact through the same gasless remember() loop.
      for (const e of entries) {
        try {
          const r = await memory.remember({ text: e.text, kind: e.kind });
          setMsgs((m) => [
            ...m,
            {
              role: "lethe",
              text: `📡 From-chain → remembered "${e.text}" (${e.kind}).`,
              proof: { blobId: r.blobId, memoryId: r.memoryId, digest: r.digest, gasOwner: r.gasOwner },
            },
          ]);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "couldn't persist a derived memory";
          setMsgs((m) => [...m, { role: "lethe", text: `⚠️ ${msg}` }]);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setMsgs((m) => [...m, { role: "lethe", text: `⚠️ ${msg}` }]);
    } finally {
      setAnalyzing(false);
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
            {m.provider && !m.proof && (
              <div className="mt-1 text-[10px]" style={{ color: "var(--text-dim)" }} title="The free LLM that produced this reply">
                via {m.provider}
              </div>
            )}
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
        {(busy || analyzing) && (
          <div className="self-start text-sm" style={{ color: "var(--text-dim)" }}>
            {analyzing ? "Lethe is reading the chain…" : "Lethe is thinking…"}
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
            <>
              <div className="mb-2 flex justify-center">
                <button
                  onClick={analyze}
                  disabled={analyzing || busy}
                  className="text-xs px-3 py-1.5 rounded-full border disabled:opacity-50"
                  style={{ borderColor: "var(--accent-h)", color: "var(--text-dim)" }}
                  title="Lethe reads your real Sui activity and remembers what it learns"
                >
                  {analyzing ? "Analyzing on-chain…" : "📡 Analyze my on-chain activity"}
                </button>
              </div>
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
            </>
          )}
        </div>
      </div>
    </main>
  );
}
