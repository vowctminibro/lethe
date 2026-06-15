#!/usr/bin/env node
/**
 * lethe-mcp — a tiny, dependency-free MCP (Model Context Protocol) stdio server
 * that lets ANY MCP-capable agent (Claude Desktop/Code, etc.) read a user's
 * Lethe memory through the on-chain grant.
 *
 * It is a thin adapter over Lethe's public surface — it adds NO new trust:
 *   • lethe_get_vault     — public on-chain vault metadata (entries, authorized)
 *                           straight from a Sui fullnode. No grant needed.
 *   • lethe_recall_granted — the server-mediated, grant-gated read
 *                           (POST /api/grant/recall). Returns the owner's
 *                           memories ONLY if THIS agent's address is in the
 *                           vault's on-chain `authorized` list; revoked or
 *                           never-granted → a clear "grant denied" message.
 *
 * Config (env):
 *   LETHE_APP_ADDRESS  — this agent's on-chain address (the one the user grants).
 *                        Required for lethe_recall_granted.
 *   LETHE_BASE_URL     — Lethe app base (default https://lethe-gold.vercel.app)
 *   LETHE_FULLNODE_URL — Sui fullnode (default testnet public)
 *   LETHE_MEMORY_PKG   — original Memory package id (defaults to the live one)
 *
 * Transport: newline-delimited JSON-RPC 2.0 over stdin/stdout (MCP stdio).
 * Logs go to stderr only — stdout carries protocol messages exclusively.
 */
import { createInterface } from "node:readline";

const BASE = (process.env.LETHE_BASE_URL ?? "https://lethe-gold.vercel.app").replace(/\/$/, "");
const FULLNODE = process.env.LETHE_FULLNODE_URL ?? "https://fullnode.testnet.sui.io:443";
const APP_ADDRESS = process.env.LETHE_APP_ADDRESS ?? "";
const MEMORY_PKG =
  process.env.LETHE_MEMORY_PKG ??
  "0x9dcc482cd7fb5d7fa2a0cf90c7dc1e6efec6f40e817e352c61ed0f63951c1331";

const SERVER_INFO = { name: "lethe-mcp", version: "0.1.0" };
const PROTOCOL_VERSION = "2024-11-05";

const TOOLS = [
  {
    name: "lethe_get_vault",
    description:
      "Public on-chain metadata for a user's Lethe memory vault (entry count, " +
      "authorized app addresses, Suiscan link). No grant required.",
    inputSchema: {
      type: "object",
      properties: { ownerAddress: { type: "string", description: "The user's Sui address (0x…)." } },
      required: ["ownerAddress"],
    },
  },
  {
    name: "lethe_recall_granted",
    description:
      "Read the user's Lethe memories through the on-chain grant. Returns entries " +
      "ONLY if this agent's address (LETHE_APP_ADDRESS) is currently authorized on " +
      "the user's vault; otherwise a grant-denied message. Seal-encrypted entries " +
      "are owner-decrypt-only and come back marked sealed.",
    inputSchema: {
      type: "object",
      properties: { ownerAddress: { type: "string", description: "The user's Sui address (0x…)." } },
      required: ["ownerAddress"],
    },
  },
];

const ADDR = /^0x[0-9a-fA-F]+$/;
const log = (...a) => process.stderr.write(`[lethe-mcp] ${a.join(" ")}\n`);

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}
function ok(id, result) {
  send({ jsonrpc: "2.0", id, result });
}
function err(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}
function toolText(text, isError = false) {
  return { content: [{ type: "text", text }], isError };
}

async function getVault(ownerAddress) {
  const res = await fetch(FULLNODE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "suix_getOwnedObjects",
      params: [
        ownerAddress,
        { filter: { StructType: `${MEMORY_PKG}::memory::Memory` }, options: { showContent: true } },
        null,
        1,
      ],
    }),
  });
  const json = await res.json();
  const obj = json?.result?.data?.[0]?.data;
  const fields = obj?.content?.fields;
  if (!obj || !fields) return null;
  return {
    vaultId: obj.objectId,
    owner: fields.owner,
    entryCount: Array.isArray(fields.entries) ? fields.entries.length : 0,
    authorized: fields.authorized ?? [],
    suiscanUrl: `https://suiscan.xyz/testnet/object/${obj.objectId}`,
  };
}

async function runTool(name, args) {
  const ownerAddress = String(args?.ownerAddress ?? "");
  if (!ADDR.test(ownerAddress)) return toolText("Invalid ownerAddress (expected 0x… hex).", true);

  if (name === "lethe_get_vault") {
    const v = await getVault(ownerAddress);
    if (!v) return toolText(`No Lethe memory vault found for ${ownerAddress}.`);
    return toolText(JSON.stringify(v, null, 2));
  }

  if (name === "lethe_recall_granted") {
    if (!ADDR.test(APP_ADDRESS)) {
      return toolText("LETHE_APP_ADDRESS is not configured — set this agent's granted on-chain address.", true);
    }
    const res = await fetch(`${BASE}/api/grant/recall`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerAddress, appAddress: APP_ADDRESS }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 403) {
      return toolText(
        `Grant denied: this agent (${APP_ADDRESS}) is not authorized on the user's vault` +
          (body.vaultId ? ` (${body.vaultId})` : "") +
          ". Ask the user to grant access on /memory, then retry.",
      );
    }
    if (!res.ok) return toolText(`Read failed: HTTP ${res.status} ${body.error ?? ""}`.trim(), true);
    const entries = body.entries ?? [];
    const readable = entries.filter((e) => !e.sealed);
    const sealed = entries.length - readable.length;
    const lines = readable.map((e) => `• [${e.kind}] ${e.text}`).join("\n");
    return toolText(
      `Vault ${body.vaultId} — ${entries.length} memories (${sealed} owner-sealed):\n` +
        (lines || "(no server-readable entries)"),
    );
  }

  return toolText(`Unknown tool: ${name}`, true);
}

async function handle(msg) {
  const { id, method, params } = msg;
  // Notifications (no id) — acknowledge silently.
  if (id === undefined || id === null) return;

  switch (method) {
    case "initialize":
      return ok(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: SERVER_INFO });
    case "ping":
      return ok(id, {});
    case "tools/list":
      return ok(id, { tools: TOOLS });
    case "tools/call": {
      const name = params?.name;
      try {
        const result = await runTool(name, params?.arguments ?? {});
        return ok(id, result);
      } catch (e) {
        return ok(id, toolText(`Tool error: ${e instanceof Error ? e.message : String(e)}`, true));
      }
    }
    default:
      return err(id, -32601, `Method not found: ${method}`);
  }
}

const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  let msg;
  try {
    msg = JSON.parse(trimmed);
  } catch {
    return log("dropping non-JSON line");
  }
  void handle(msg);
});
log(`ready · base=${BASE} · app=${APP_ADDRESS || "(unset)"}`);
