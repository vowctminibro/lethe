/**
 * indexer.ts — server-side read model for battles + leaderboard.
 *
 * Reads directly from a Sui fullnode over JSON-RPC (version-independent):
 * BattleCreated events → battle objects → the two Artwork objects. House
 * battles from the manifest are merged in so the views are never empty.
 * Aggregation is computed on request (cheap at demo scale).
 */

import houseData from "@/src/data/house-artworks.json";
import { parseTraits, computeRarity, selectionLabels } from "./traits";

const NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK ?? "testnet";
const RPC = `https://fullnode.${NETWORK}.sui.io:443`;
const BP = process.env.NEXT_PUBLIC_BATTLE_PACKAGE_ID ?? "";

interface HouseBattle { id: string; label: string; artworkA: string; artworkB: string }
const HOUSE_BATTLES = (houseData as { battles?: HouseBattle[] }).battles ?? [];

async function rpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result as T;
}

export interface ArtworkView {
  objectId: string;
  blobId: string;
  traits: string;
  label: string;
  owner: string;
  rarityTier: string;
  rarityScore: number;
}

export interface BattleView {
  battleId: string;
  a: ArtworkView;
  b: ArtworkView;
  votesA: number;
  votesB: number;
  status: number;
}

function ownerOf(obj: any): string {
  const ow = obj?.data?.owner;
  if (ow && typeof ow === "object" && "AddressOwner" in ow) return ow.AddressOwner;
  return "";
}

const artworkCache = new Map<string, ArtworkView>();

async function getArtwork(objectId: string): Promise<ArtworkView> {
  if (artworkCache.has(objectId)) return artworkCache.get(objectId)!;
  const o = await rpc<any>("sui_getObject", [objectId, { showContent: true, showOwner: true }]);
  const f = o?.data?.content?.fields ?? {};
  const traits = String(f.traits ?? "");
  const sel = parseTraits(traits);
  let tier = "—";
  let score = 0;
  try {
    const r = computeRarity(sel);
    tier = r.tier;
    score = r.score;
  } catch {
    /* malformed traits → leave defaults */
  }
  const view: ArtworkView = {
    objectId,
    blobId: String(f.image_blob_id ?? ""),
    traits,
    label: selectionLabels(sel).join(" · "),
    owner: ownerOf(o),
    rarityTier: tier,
    rarityScore: score,
  };
  artworkCache.set(objectId, view);
  return view;
}

async function battleIds(): Promise<string[]> {
  const ids: string[] = [];
  if (BP) {
    try {
      const ev = await rpc<any>("suix_queryEvents", [
        { MoveEventType: `${BP}::battle::BattleCreated` },
        null,
        50,
        true,
      ]);
      for (const e of ev?.data ?? []) {
        const id = e?.parsedJson?.battle_id;
        if (id) ids.push(id);
      }
    } catch {
      /* fall back to house battles only */
    }
  }
  for (const b of HOUSE_BATTLES) if (!ids.includes(b.id)) ids.push(b.id);
  return ids;
}

export async function listBattleViews(): Promise<BattleView[]> {
  const ids = await battleIds();
  if (ids.length === 0) return [];
  const objs = await rpc<any[]>("sui_multiGetObjects", [ids, { showContent: true }]);
  const views: BattleView[] = [];
  for (const o of objs ?? []) {
    const f = o?.data?.content?.fields;
    if (!f) continue;
    const [a, b] = await Promise.all([getArtwork(f.artwork_a), getArtwork(f.artwork_b)]);
    views.push({
      battleId: o.data.objectId,
      a,
      b,
      votesA: Number(f.votes_a ?? 0),
      votesB: Number(f.votes_b ?? 0),
      status: Number(f.status ?? 0),
    });
  }
  return views;
}

export interface LeaderRow {
  rank: number;
  artwork: ArtworkView;
  wins: number;
  votes: number;
}

/**
 * Rank artworks across all battles. wins = battles whose side currently leads;
 * tiebreak by total votes received, then rarity score.
 */
export async function leaderboard(): Promise<LeaderRow[]> {
  const battles = await listBattleViews();
  const acc = new Map<string, { artwork: ArtworkView; wins: number; votes: number }>();

  const bump = (art: ArtworkView, votes: number, won: boolean) => {
    const e = acc.get(art.objectId) ?? { artwork: art, wins: 0, votes: 0 };
    e.votes += votes;
    if (won) e.wins += 1;
    acc.set(art.objectId, e);
  };

  for (const bt of battles) {
    bump(bt.a, bt.votesA, bt.votesA > bt.votesB);
    bump(bt.b, bt.votesB, bt.votesB > bt.votesA);
  }

  return [...acc.values()]
    .sort(
      (x, y) =>
        y.wins - x.wins ||
        y.votes - x.votes ||
        y.artwork.rarityScore - x.artwork.rarityScore,
    )
    .map((e, i) => ({ rank: i + 1, artwork: e.artwork, wins: e.wins, votes: e.votes }));
}
