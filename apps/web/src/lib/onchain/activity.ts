/**
 * On-chain activity reader — the WEDGE.
 *
 * Reads what an address actually DID on Sui (coins held, tx frequency, the Move
 * modules it touched) straight from a public fullnode via RPC — no key, no
 * permission, nothing the user typed. The summary it returns is fed to the LLM
 * to DERIVE memories ("holds SUI + stables, active trader, touches DeepBook").
 *
 * That's the pitch: the agent knows you from what you do on-chain, not from what
 * you tell it. Read-only and address-scoped, so it works on any address a judge
 * pastes in, not just the signed-in zkLogin account.
 */

import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

/** Coin types we can name; everything else is shown by its short type tag. */
const KNOWN_COINS: Record<string, string> = {
  "0x2::sui::SUI": "SUI",
};

/** Heuristic buckets keyed on Move module/package fingerprints seen in recent txs. */
const PROTOCOL_HINTS: { match: RegExp; label: string }[] = [
  { match: /deepbook|clob/i, label: "DeepBook (orderbook DEX)" },
  { match: /cetus|turbos|kriya|aftermath|flowx|bluefin/i, label: "a DEX/AMM" },
  { match: /scallop|navi|suilend|bucket/i, label: "a lending protocol" },
  { match: /kiosk|nft|collectible|artwork/i, label: "NFTs" },
  { match: /stake|validator/i, label: "staking" },
  { match: /coin|pay|transfer/i, label: "coin transfers" },
];

export interface CoinHolding {
  /** Short symbol if known, else a truncated coin type. */
  symbol: string;
  coinType: string;
  /** Human-readable total (raw base units as string; SUI shown in SUI). */
  amount: string;
}

export interface OnChainActivity {
  address: string;
  /** Distinct coins held with non-zero balance. */
  holdings: CoinHolding[];
  /** Count of owned objects (NFTs, coins, misc). */
  ownedObjectCount: number;
  /** Number of recent transactions sampled (capped). */
  recentTxCount: number;
  /** Distinct "module::function" Move calls seen in the sample. */
  moveCalls: string[];
  /** Protocol/category labels inferred from those calls. */
  protocols: string[];
}

const SAMPLE_TX = 40;

function shortType(t: string): string {
  // 0x2::sui::SUI -> sui::SUI ; long custom -> 0xab12…::module::TYPE
  const parts = t.split("::");
  if (parts.length === 3) {
    const pkg = parts[0].length > 12 ? `${parts[0].slice(0, 6)}…` : parts[0];
    return `${pkg}::${parts[1]}::${parts[2]}`;
  }
  return t.length > 24 ? `${t.slice(0, 12)}…${t.slice(-6)}` : t;
}

function fmtSui(raw: string): string {
  // SUI has 9 decimals; show 3 dp.
  try {
    const n = Number(BigInt(raw)) / 1e9;
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 3 })} SUI`;
  } catch {
    return `${raw} (raw)`;
  }
}

/**
 * Fetch a compact, read-only activity snapshot for `address`. Best-effort: any
 * single RPC failing degrades that field rather than throwing the whole read.
 */
export async function readActivity(
  client: SuiJsonRpcClient,
  address: string,
): Promise<OnChainActivity> {
  const activity: OnChainActivity = {
    address,
    holdings: [],
    ownedObjectCount: 0,
    recentTxCount: 0,
    moveCalls: [],
    protocols: [],
  };

  // ── Balances ──────────────────────────────────────────────────────────
  try {
    const balances = await client.getAllBalances({ owner: address });
    activity.holdings = balances
      .filter((b) => BigInt(b.totalBalance) > BigInt(0))
      .map((b) => {
        const symbol = KNOWN_COINS[b.coinType] ?? shortType(b.coinType);
        const amount = b.coinType === "0x2::sui::SUI" ? fmtSui(b.totalBalance) : b.totalBalance;
        return { symbol, coinType: b.coinType, amount };
      });
  } catch {
    /* leave holdings empty */
  }

  // ── Owned objects (count) ─────────────────────────────────────────────
  try {
    const owned = await client.getOwnedObjects({ owner: address, options: { showType: false } });
    activity.ownedObjectCount = owned.data?.length ?? 0;
  } catch {
    /* leave 0 */
  }

  // ── Recent transactions + Move-call fingerprints ──────────────────────
  try {
    const txs = await client.queryTransactionBlocks({
      filter: { FromAddress: address },
      options: { showInput: true },
      limit: SAMPLE_TX,
      order: "descending",
    });
    const blocks = txs.data ?? [];
    activity.recentTxCount = blocks.length;

    const calls = new Set<string>();
    for (const tb of blocks) {
      // ProgrammableTransaction: data.transaction.transactions[] may hold MoveCall.
      const data = (tb as { transaction?: { data?: { transaction?: unknown } } }).transaction?.data
        ?.transaction as { transactions?: unknown[] } | undefined;
      for (const cmd of data?.transactions ?? []) {
        const mc = (cmd as { MoveCall?: { module?: string; function?: string } }).MoveCall;
        if (mc?.module && mc.function) calls.add(`${mc.module}::${mc.function}`);
      }
    }
    activity.moveCalls = [...calls].slice(0, 20);

    const protos = new Set<string>();
    const haystack = activity.moveCalls.join(" ");
    for (const { match, label } of PROTOCOL_HINTS) {
      if (match.test(haystack)) protos.add(label);
    }
    activity.protocols = [...protos];
  } catch {
    /* leave tx fields empty */
  }

  return activity;
}

/** Render the snapshot as a compact prompt block for the LLM to interpret. */
export function activityToPrompt(a: OnChainActivity): string {
  const holdings =
    a.holdings.length > 0
      ? a.holdings.map((h) => `${h.symbol}: ${h.amount}`).join(", ")
      : "no fungible coin balances";
  return [
    `Address: ${a.address}`,
    `Holdings: ${holdings}`,
    `Distinct coins held: ${a.holdings.length}`,
    `Owned objects: ${a.ownedObjectCount}`,
    `Recent transactions sampled: ${a.recentTxCount}`,
    `Move calls observed: ${a.moveCalls.length > 0 ? a.moveCalls.join(", ") : "none in sample"}`,
    `Protocols inferred: ${a.protocols.length > 0 ? a.protocols.join(", ") : "none obvious"}`,
  ].join("\n");
}
