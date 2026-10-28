import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAnimationCatalog } from "@/lib/animation-catalog";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const catalog = await getAnimationCatalog();
  const animation = catalog.find((entry) => entry.name === name);

  if (!animation) {
    return NextResponse.json({ error: "Animation not found" }, { status: 404 });
  }

  const directories = [
    path.join(process.cwd(), "assets", "common-animation"),
    path.join(process.cwd(), "public", "animations"),
  ];

  for (const directory of directories) {
    try {
      const file = await readFile(path.join(directory, animation.name));
      return new Response(file, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "Animation file unavailable" }, { status: 404 });
}
