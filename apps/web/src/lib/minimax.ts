/**
 * MiniMax — image generation (image-01). The ONLY generator in Lethe.
 *
 * Server-side only: reads MINIMAX_API_KEY. Used by src/lib/generate.ts via the
 * /api/generate route — never import this into a client component.
 *
 * Note: image_generation on api.minimax.io authenticates with the Bearer key
 * alone (no GroupId needed for this endpoint).
 */

const ENDPOINT = "https://api.minimax.io/v1/image_generation";
const MODEL = "image-01";

export interface GenerateImageOptions {
  /** Square by default. */
  aspectRatio?: string;
  /** Passed through where MiniMax supports it for reproducibility. */
  seed?: number;
  signal?: AbortSignal;
}

export interface GeneratedImage {
  /** Temporary MiniMax CDN url (expires) — we persist to Walrus, not this. */
  url: string;
  bytes: Uint8Array;
}

/** Generate one image from a fully-assembled prompt and return its bytes. */
export async function generateImage(
  prompt: string,
  opts: GenerateImageOptions = {},
): Promise<GeneratedImage> {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error("Missing MINIMAX_API_KEY");

  const body: Record<string, unknown> = {
    model: MODEL,
    prompt,
    aspect_ratio: opts.aspectRatio ?? "1:1",
    n: 1,
    response_format: "url",
  };
  if (typeof opts.seed === "number") body.seed = opts.seed;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) {
    throw new Error(`MiniMax HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const status = data?.base_resp?.status_code;
  if (status !== 0) {
    throw new Error(`MiniMax error ${status}: ${data?.base_resp?.status_msg}`);
  }
  const url: string | undefined = data?.data?.image_urls?.[0];
  if (!url) throw new Error("MiniMax returned no image url");

  const imgRes = await fetch(url, { signal: opts.signal });
  if (!imgRes.ok) throw new Error(`MiniMax image fetch HTTP ${imgRes.status}`);
  const bytes = new Uint8Array(await imgRes.arrayBuffer());

  return { url, bytes };
}
