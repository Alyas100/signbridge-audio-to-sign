import { NextRequest, NextResponse } from "next/server";
import {
  findAnimationByName,
  getAnimationCatalog,
  normalizeAnimationName,
} from "@/lib/animation-catalog";

interface GeminiSelection {
  gloss: string;
  animation: string | null;
}

function fallbackSelection(gloss: string, names: string[]) {
  const normalizedNames = names.map((name) => ({
    name,
    normalized: normalizeAnimationName(name),
  }));

  return gloss
    .toUpperCase()
    .replace(/[.,!?]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((token) => {
      const exact = normalizedNames.find(({ normalized }) => normalized === token.toLowerCase());
      const partial = normalizedNames.find(({ normalized }) =>
        normalized.split(" ").includes(token.toLowerCase()),
      );
      const match = exact ?? partial;
      return match ? [{ gloss: token, animation: match.name }] : [];
    });
}

export async function GET() {
  return NextResponse.json({ animations: await getAnimationCatalog() });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const gloss = typeof body?.gloss === "string" ? body.gloss.trim() : "";

  if (!gloss) {
    return NextResponse.json({ selections: [] });
  }

  const catalog = await getAnimationCatalog();
  const names = catalog.map(({ name }) => name);
  const fallback = fallbackSelection(gloss, names);
  const apiKey = process.env.GEMINI_API;

  if (!apiKey || names.length === 0) {
    return NextResponse.json({ selections: fallback });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = [
    "Map each ASL gloss token to the closest available animation filename.",
    "Use an exact filename when it exists. Otherwise use a semantically similar gesture.",
    "Skip a token when no reasonable gesture exists.",
    "Return JSON only in this shape: {\"selections\":[{\"gloss\":\"TOKEN\",\"animation\":\"filename.fbx\"}]}",
    "Every animation value must be copied exactly from the available filenames.",
    `Gloss: ${gloss}`,
    `Available filenames: ${JSON.stringify(names)}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) {
      return NextResponse.json({ selections: fallback });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = text ? (JSON.parse(text) as { selections?: GeminiSelection[] }) : null;
    const selections = parsed?.selections?.flatMap((selection) => {
      if (
        typeof selection?.gloss !== "string" ||
        typeof selection.animation !== "string"
      ) {
        return [];
      }
      const animation = findAnimationByName(catalog, selection.animation);
      return animation
        ? [{ gloss: selection.gloss, animation: animation.name }]
        : [];
    });

    return NextResponse.json({
      selections: selections && selections.length > 0 ? selections : fallback,
    });
  } catch {
    return NextResponse.json({ selections: fallback });
  }
}
