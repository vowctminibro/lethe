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
  /** which model produced this reply, e.g. "minimax/MiniMax-Text-01" */
  provider?: string;
  /** quiet failover note, e.g. "MiniMax unavailable — answered with Llama" */
  note?: string;
  /** true while tokens are still arriving */
  streaming?: boolean;
};

type ModelOption = { key: string; id: string; label: string; configured: boolean; isDefault: boolean };
const MODEL_LS_KEY = "lethe-model";

// Per-session LLM message cap (judge-proofing). ONLY chat sends count —
// memory features (view/derive/grant/revoke/export) are never capped.
const SESSION_CAP = Number(process.env.NEXT_PUBLIC_SESSION_MESSAGE_CAP) || 30;
const CAP_LS_KEY = "lethe-session-msgs";

function sessionMsgCount(): number {
  try {
    return Number(window.sessionStorage.getItem(CAP_LS_KEY)) || 0;
  } catch {
    return 0;
  }
}
function bumpSessionMsgCount() {
  try {
    window.sessionStorage.setItem(CAP_LS_KEY, String(sessionMsgCount() + 1));
  } catch {
    /* private mode — cap simply doesn't persist */
  }
}

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
  // Suggested trait cards from on-chain analysis — saved ONLY on user [Save].
  const [suggestions, setSuggestions] = useState<
    { id: string; text: string; kind: string; status: "pending" | "saving" | "saved" | "dismissed" }[]
  >([]);
  // Protocol names the activity reader fingerprinted (presentation only).
  const [derivedProtocols, setDerivedProtocols] = useState<string[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "lethe",
      text: "Hey — I'm Lethe. Tell me about your crypto style (e.g. \"I'm a momentum trader and I hate leverage\") and I'll remember it on Walrus, owned by you. Or let me read your on-chain activity and learn from what you've actually done.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  // Model selector — the chain still falls back on failure; this only sets
  // which configured provider goes FIRST. Persisted across sessions.
  const [models, setModels] = useState<ModelOption[]>([]);
  const [model, setModel] = useState<string>("");
  useEffect(() => {
    fetch("/api/chat/models")
      .then((r) => r.json())
      .then(({ models: m }: { models: ModelOption[] }) => {
        setModels(m);
        const saved = window.localStorage.getItem(MODEL_LS_KEY);
        if (saved && m.some((x) => x.key === saved)) setModel(saved);
        else setModel(m.find((x) => x.isDefault)?.key ?? m[0]?.key ?? "");
      })
      .catch(() => {/* selector is sugar — chat works on the default chain */});
  }, []);
  const pickModel = (key: string) => {
    setModel(key);
    try {
      window.localStorage.setItem(MODEL_LS_KEY, key);
    } catch {/* private mode */}
  };
  const labelOf = useCallback(
    (key: string) => models.find((m) => m.key === key)?.label.split(" · ")[0] ?? key,
    [models],
  );
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
    if (sessionMsgCount() >= SESSION_CAP) {
      setMsgs((m) => [
        ...m,
        { role: "you", text },
        {
          role: "lethe",
          text: "Free demo limit for this session reached — memory features keep working: view, export, grant and revoke on /memory anytime. Refresh the tab for a new session.",
        },
      ]);
      setInput("");
      return;
    }
    bumpSessionMsgCount();
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
          model: model || undefined,
          address: account?.address,
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
      // Preferred model didn't answer → say so quietly, never fail the chat.
      const answeredBy = provider?.split("/")[0];
      const note =
        model && answeredBy && answeredBy !== model
          ? `${labelOf(model)} unavailable right now — answered with ${labelOf(answeredBy)}`
          : undefined;

      setMsgs((m) => [...m, { role: "lethe", text: "", provider, note, streaming: true }]);
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
      const { entries, provider, inactive, protocols } = (await res.json()) as {
        entries: { text: string; kind: string }[];
        provider: string;
        inactive?: boolean;
        protocols?: string[];
      };
      setDerivedProtocols(Array.isArray(protocols) ? protocols : []);

      if (inactive || entries.length === 0) {
        setMsgs((m) => [
          ...m,
          {
            role: "lethe",
            provider,
            text: "I looked at that address but there isn't enough on-chain history yet to learn a style from. Trade, mint, or move something on Sui and try again.",
          },
        ]);
        return;
      }

      const protoLead =
        Array.isArray(protocols) && protocols.length > 0
          ? `Derived from your ${protocols.slice(0, 3).join(", ")} activity. `
          : "";
      setMsgs((m) => [
        ...m,
        {
          role: "lethe",
          provider,
          text: `${protoLead}Here's what your on-chain activity suggests — you didn't tell me any of this. These are only suggestions: nothing is saved until YOU say so. Review the cards below.`,
        },
      ]);
      setSuggestions((s) => [
        ...s.filter((x) => x.status !== "dismissed"),
        ...entries.map((e, i) => ({
          id: `sug-${Date.now()}-${i}`,
          text: e.text,
          kind: e.kind,
          status: "pending" as const,
        })),
      ]);
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
          text: `Linked ${addr.slice(0, 8)}…${addr.slice(-4)} (read-only). I'll keep its holdings and activity in mind as we talk. Reading its style now…`,
        },
      ]);

      // Style depth: derive suggested trait cards from the linked wallet.
      try {
        const dr = await fetch("/api/onchain/derive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr }),
        });
        if (dr.ok) {
          const { entries, inactive } = (await dr.json()) as {
            entries: { text: string; kind: string }[];
            inactive?: boolean;
          };
          if (inactive || entries.length === 0) {
            setMsgs((m) => [
              ...m,
              { role: "lethe", text: "That wallet doesn't have enough on-chain history yet to read a style from — I'll just keep its snapshot in mind." },
            ]);
          } else {
            setMsgs((m) => [
              ...m,
              { role: "lethe", text: "Here's the style I read off that wallet — suggestions only, nothing saved until you say so:" },
            ]);
            setSuggestions((s) => [
              ...s.filter((x) => x.status !== "dismissed"),
              ...entries.map((e, i) => ({
                id: `sug-${Date.now()}-${i}`,
                text: e.text,
                kind: e.kind,
                status: "pending" as const,
              })),
            ]);
          }
        }
      } catch {
        /* style read is enrichment — the link itself already succeeded */
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "couldn't read that wallet";
      setMsgs((m) => [...m, { role: "lethe", text: `Hmm — ${msg}.` }]);
    } finally {
      setWalletBusy(false);
    }
  }

  // Save/dismiss one suggested trait card. Save goes through the normal
  // write path (persistFact) — exactly like a chat-stated fact.
  async function saveSuggestion(id: string) {
    const sug = suggestions.find((s) => s.id === id);
    if (!sug || sug.status !== "pending") return;
    setSuggestions((s) => s.map((x) => (x.id === id ? { ...x, status: "saving" } : x)));
    await persistFact({ text: sug.text, kind: sug.kind });
    setSuggestions((s) => s.map((x) => (x.id === id ? { ...x, status: "saved" } : x)));
  }
  function dismissSuggestion(id: string) {
    setSuggestions((s) => s.map((x) => (x.id === id ? { ...x, status: "dismissed" } : x)));
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
            {models.length > 0 && (
              <select
                value={model}
                onChange={(e) => pickModel(e.target.value)}
                className="text-xs h-7 px-1.5 rounded border outline-none cursor-pointer max-w-[180px]"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text-dim)" }}
                title="Pick the model that answers — your memory works with all of them"
                aria-label="Model"
              >
                {models.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            )}
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
        <div className="flex flex-col min-h-0 rounded border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--bg-panel)" }}>
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-4">
            {msgs.map((m, i) =>
              m.role === "you" ? (
                // The reader's voice — a compact ink note, set right.
                <div key={i} className="self-end max-w-[80%]">
                  <div
                    className="rounded px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed"
                    style={{ background: "var(--text)", color: "var(--bg)" }}
                  >
                    {m.text}
                  </div>
                </div>
              ) : (
                // Lethe speaks as typeset prose with a hanging italic L. — no bubble.
                <div key={i} className="self-start max-w-[85%] flex gap-3">
                  <span
                    aria-hidden="true"
                    className="shrink-0 select-none"
                    style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "1.2rem", lineHeight: 1.3, color: "var(--text-dim)" }}
                  >
                    L.
                  </span>
                  <div className="min-w-0 pb-1" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text)" }}>
                      {m.text}
                      {m.streaming && (
                        <span className="inline-block w-[2px] h-[1em] ml-0.5 align-text-bottom animate-pulse" style={{ background: "var(--text-dim)" }} />
                      )}
                    </div>
                    {m.provider && !m.streaming && (
                      <div className="lethe-id mt-1.5" style={{ color: "var(--text-dim)" }} title="The model that actually produced this reply">
                        via {m.provider}
                      </div>
                    )}
                    {m.note && !m.streaming && (
                      <div className="text-[11px] mt-1 italic" style={{ color: "var(--accent-h)" }}>
                        {m.note}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {(analyzing || (busy && msgs[msgs.length - 1]?.role === "you")) && (
              <div className="self-start rounded-2xl px-4 py-3 border" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="lethe-shimmer h-3 w-36 rounded" />
              </div>
            )}

            {/* ── suggested trait cards — saved only on explicit [Save] ── */}
            {suggestions.some((s) => s.status !== "dismissed") && (
              <div className="self-start w-full max-w-xl flex flex-col gap-2" data-testid="suggestion-cards">
                {derivedProtocols.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap" data-testid="protocol-chips">
                    <span className="lethe-id uppercase" style={{ color: "var(--text-dim)" }}>seen on-chain:</span>
                    {derivedProtocols.map((p) => (
                      <span
                        key={p}
                        data-testid="protocol-chip"
                        className="text-[11px] px-2 py-0.5 rounded-full border"
                        style={{ borderColor: "var(--accent-h)", color: "var(--text-dim)", background: "var(--bg-panel)" }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
                {suggestions
                  .filter((s) => s.status !== "dismissed")
                  .map((s) => (
                    <div
                      key={s.id}
                      data-testid="suggestion-card"
                      className="rounded-xl border p-3 flex items-start justify-between gap-3 transition-opacity duration-300"
                      style={{
                        borderColor: "var(--accent-h)",
                        background: "var(--bg-panel)",
                        opacity: s.status === "saved" ? 0.65 : 1,
                      }}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded mr-2" style={{ background: "var(--bg)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>
                          {s.kind}
                        </span>
                        <span className="text-sm" style={{ color: "var(--text)" }}>{s.text}</span>
                      </div>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {s.status === "saved" ? (
                          <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>saved ✓</span>
                        ) : (
                          <>
                            <button
                              data-testid="suggestion-save"
                              onClick={() => saveSuggestion(s.id)}
                              disabled={s.status === "saving"}
                              className="text-[11px] px-2.5 py-1 rounded-md font-semibold disabled:opacity-50"
                              style={{ background: "var(--text)", color: "var(--accent)" }}
                            >
                              {s.status === "saving" ? "Saving…" : "Save"}
                            </button>
                            <button
                              data-testid="suggestion-dismiss"
                              onClick={() => dismissSuggestion(s.id)}
                              disabled={s.status === "saving"}
                              className="text-[11px] px-2.5 py-1 rounded-md border disabled:opacity-50"
                              style={{ borderColor: "var(--border)", color: "var(--text-dim)" }}
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
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
