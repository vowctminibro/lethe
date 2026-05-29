/**
 * traits.ts — the controlled-generation core (this IS the quality control).
 *
 * There is NO free-text prompt anywhere in Lethe. Users pick from a curated
 * trait menu; we assemble a LOCKED prompt template from one fixed base style
 * plus the selected fragments. Same style across every output → a coherent
 * generative collection (BAYC/Pudgy pattern, but AI-generated).
 *
 * Pure module — safe to import from both client UI and server routes.
 */

/**
 * The ONE locked style string. Stylized / non-photoreal on purpose: MiniMax
 * is far more consistent on toy/3D-render aesthetics than on photorealism.
 * Changeable here in one place — never per-user.
 */
export const BASE_STYLE =
  "3D vinyl-toy collectible creature, glossy finish, soft studio lighting, clean solid-color background, centered full-body";

export interface TraitOption {
  id: string;
  label: string;
  /** Phrase appended to the locked base style. */
  promptFragment: string;
  /** Higher = more common. Used to weight rarity (and battle later). */
  rarityWeight: number;
}

export interface TraitCategory {
  id: string;
  label: string;
  options: TraitOption[];
}

/** A user's choices: categoryId -> optionId. */
export type TraitSelection = Record<string, string>;

/**
 * 4 categories × 4–6 options. Weights are intentionally uneven so the
 * collection has common/rare tiers.
 */
export const TRAIT_CATEGORIES: TraitCategory[] = [
  {
    id: "species",
    label: "Species",
    options: [
      { id: "fox", label: "Fox", promptFragment: "a cute round fox character", rarityWeight: 50 },
      { id: "cat", label: "Cat", promptFragment: "a cute round cat character", rarityWeight: 45 },
      { id: "owl", label: "Owl", promptFragment: "a cute round owl character", rarityWeight: 30 },
      { id: "axolotl", label: "Axolotl", promptFragment: "a cute round axolotl character", rarityWeight: 18 },
      { id: "dragon", label: "Dragon", promptFragment: "a cute round baby dragon character", rarityWeight: 8 },
    ],
  },
  {
    id: "color",
    label: "Color",
    options: [
      { id: "mint", label: "Mint", promptFragment: "mint-green color palette", rarityWeight: 40 },
      { id: "coral", label: "Coral", promptFragment: "coral-pink color palette", rarityWeight: 40 },
      { id: "lavender", label: "Lavender", promptFragment: "lavender-purple color palette", rarityWeight: 30 },
      { id: "gold", label: "Gold", promptFragment: "warm golden-yellow color palette", rarityWeight: 20 },
      { id: "midnight", label: "Midnight", promptFragment: "deep midnight-blue color palette", rarityWeight: 10 },
    ],
  },
  {
    id: "accessory",
    label: "Accessory",
    options: [
      { id: "none", label: "None", promptFragment: "no accessories", rarityWeight: 45 },
      { id: "scarf", label: "Scarf", promptFragment: "wearing a cozy knitted scarf", rarityWeight: 35 },
      { id: "headphones", label: "Headphones", promptFragment: "wearing oversized headphones", rarityWeight: 25 },
      { id: "wizard", label: "Wizard Hat", promptFragment: "wearing a pointed wizard hat", rarityWeight: 15 },
      { id: "crown", label: "Crown", promptFragment: "wearing a tiny golden crown", rarityWeight: 6 },
    ],
  },
  {
    id: "background",
    label: "Background",
    options: [
      { id: "pink", label: "Pastel Pink", promptFragment: "solid pastel-pink background", rarityWeight: 40 },
      { id: "blue", label: "Sky Blue", promptFragment: "solid sky-blue background", rarityWeight: 40 },
      { id: "cream", label: "Cream", promptFragment: "solid warm-cream background", rarityWeight: 30 },
      { id: "mintbg", label: "Mint", promptFragment: "solid soft-mint background", rarityWeight: 25 },
    ],
  },
];

const CATEGORY_BY_ID = new Map(TRAIT_CATEGORIES.map((c) => [c.id, c]));

/** Look up a single option, or undefined if the ids don't match. */
export function getOption(categoryId: string, optionId: string): TraitOption | undefined {
  return CATEGORY_BY_ID.get(categoryId)?.options.find((o) => o.id === optionId);
}

/** The default selection (first option of each category). */
export function defaultSelection(): TraitSelection {
  const sel: TraitSelection = {};
  for (const cat of TRAIT_CATEGORIES) sel[cat.id] = cat.options[0].id;
  return sel;
}

/** True only if every category has a valid option selected. */
export function isCompleteSelection(selection: TraitSelection): boolean {
  return TRAIT_CATEGORIES.every((cat) => !!getOption(cat.id, selection[cat.id]));
}

/**
 * Assemble the LOCKED prompt: base style + selected fragments in category
 * order. Deterministic — the ONLY prompt path in the app.
 */
export function assemblePrompt(selection: TraitSelection): string {
  if (!isCompleteSelection(selection)) {
    throw new Error("assemblePrompt: incomplete or invalid trait selection");
  }
  const fragments = TRAIT_CATEGORIES.map(
    (cat) => getOption(cat.id, selection[cat.id])!.promptFragment,
  );
  return `${BASE_STYLE}, ${fragments.join(", ")}`;
}

/** Stable on-chain string for the traits, e.g. "species:fox;color:mint;...". */
export function traitsToString(selection: TraitSelection): string {
  return TRAIT_CATEGORIES.map((cat) => `${cat.id}:${selection[cat.id]}`).join(";");
}

/** Inverse of traitsToString — parse the on-chain string back to a selection. */
export function parseTraits(s: string): TraitSelection {
  const sel: TraitSelection = {};
  for (const part of s.split(";")) {
    const [cat, opt] = part.split(":");
    if (cat && opt) sel[cat] = opt;
  }
  return sel;
}

/** Human-readable labels for a selection, e.g. ["Fox","Mint","Crown","Pastel Pink"]. */
export function selectionLabels(selection: TraitSelection): string[] {
  return TRAIT_CATEGORIES.map((cat) => getOption(cat.id, selection[cat.id])?.label ?? "—");
}

export type RarityTier = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";

export interface Rarity {
  /** Combined probability of this exact combo (0–1). */
  probability: number;
  /** 1 / probability, rounded — higher is rarer. Battle/leaderboard uses this. */
  score: number;
  /** Probability as a percentage, rounded to 2 dp. */
  percent: number;
  tier: RarityTier;
}

/**
 * Rarity from the per-option weights: probability of each pick = weight / sum
 * of its category's weights; combined = product across categories.
 */
export function computeRarity(selection: TraitSelection): Rarity {
  if (!isCompleteSelection(selection)) {
    throw new Error("computeRarity: incomplete or invalid trait selection");
  }
  let probability = 1;
  for (const cat of TRAIT_CATEGORIES) {
    const total = cat.options.reduce((sum, o) => sum + o.rarityWeight, 0);
    const opt = getOption(cat.id, selection[cat.id])!;
    probability *= opt.rarityWeight / total;
  }
  const score = Math.round(1 / probability);
  const percent = Math.round(probability * 1e4) / 100;
  return { probability, score, percent, tier: rarityTier(score) };
}

function rarityTier(score: number): RarityTier {
  if (score >= 2000) return "Legendary";
  if (score >= 600) return "Epic";
  if (score >= 150) return "Rare";
  if (score >= 40) return "Uncommon";
  return "Common";
}
