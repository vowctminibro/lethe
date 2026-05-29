import { NextRequest, NextResponse } from "next/server";
import { generateArtwork } from "@/src/lib/generate";
import { isCompleteSelection, type TraitSelection } from "@/src/lib/traits";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST { traits, seed? } -> { prompt, rarity, mime, imageBase64 } */
export async function POST(req: NextRequest) {
  try {
    const { traits, seed } = await req.json();
    if (!traits || !isCompleteSelection(traits as TraitSelection)) {
      return NextResponse.json({ error: "invalid or incomplete trait selection" }, { status: 400 });
    }
    const { prompt, rarity, imageBytes, mime } = await generateArtwork(traits as TraitSelection, {
      seed: typeof seed === "number" ? seed : undefined,
    });
    return NextResponse.json({
      prompt,
      rarity,
      mime,
      imageBase64: Buffer.from(imageBytes).toString("base64"),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
