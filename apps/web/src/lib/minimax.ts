/**
 * MiniMax API integration for AI text + image generation.
 * Platform: https://platform.minimax.io
 *
 * ⚠ MiniMax credits BLOCKED (2026-05-28):
 *   Existing API key prefix sk-cp-QSN6AR... returned error 2061:
 *   "token plan not support model". Vow must upgrade/top-up at platform.minimax.io
 *   before any generation call will work.
 *
 * TODO (Day 3): after credits confirmed, use MiniMax chat + image endpoints
 *   - Text:  POST https://api.minimax.io/v1/text/chatcompletion_v2
 *   - Image: POST https://api.minimax.io/v1/image_generation
 *   Model names to try after top-up: MiniMax-Text-01, MiniMax-Image-01
 */

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY ?? "";
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID ?? "";

export interface MiniMaxConfig {
  apiKey: string;
  groupId: string;
}

export function getMiniMaxConfig(): MiniMaxConfig {
  return { apiKey: MINIMAX_API_KEY, groupId: MINIMAX_GROUP_ID };
}

/**
 * Generate story chapter text via MiniMax.
 * Replaces AI.generateText() once credits are restored.
 */
export async function generateChapterText(
  prompt: string,
  _memoryContext = "",
): Promise<string> {
  if (!MINIMAX_API_KEY) {
    throw new Error(
      "MINIMAX_API_KEY not set. Set it in .env.local after top-up.",
    );
  }
  // ── placeholder — replace with real MiniMax API call ──
  console.warn("[MiniMax] generateChapterText called but credits may be blocked");
  return `[AI-generated chapter continuation for: "${prompt.slice(0, 60)}..."]`;
}

/**
 * Generate a scene image via MiniMax image-01.
 * Replaces AI.generateImage() once credits are restored.
 */
export async function generateChapterImage(
  scene: string,
): Promise<string> {
  if (!MINIMAX_API_KEY) {
    throw new Error(
      "MINIMAX_API_KEY not set. Set it in .env.local after top-up.",
    );
  }
  // ── placeholder — replace with MiniMax image_generation call ──
  console.warn("[MiniMax] generateChapterImage called but credits may be blocked");
  return "";
}
