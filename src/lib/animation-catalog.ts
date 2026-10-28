import { readdir } from "node:fs/promises";
import path from "node:path";

const animationDirectories = [
  path.join(process.cwd(), "assets", "common-animation"),
  path.join(process.cwd(), "public", "animations"),
];

export interface AnimationFile {
  name: string;
  url: string;
}

export async function getAnimationCatalog(): Promise<AnimationFile[]> {
  const files = await Promise.all(
    animationDirectories.map(async (directory) => {
      try {
        return await readdir(directory, { withFileTypes: true });
      } catch {
        return [];
      }
    }),
  );

  const names = new Map<string, string>();
  files.flat().forEach((entry) => {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".fbx")) {
      const key = entry.name.toLowerCase();
      if (!names.has(key)) names.set(key, entry.name);
    }
  });

  return [...names.values()].sort((a, b) => a.localeCompare(b)).map((name) => ({
    name,
    url: `/api/animations/file/${encodeURIComponent(name)}`,
  }));
}

export function normalizeAnimationName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findAnimationByName(
  catalog: AnimationFile[],
  requestedName: string,
) {
  const normalizedRequested = normalizeAnimationName(requestedName);
  return catalog.find(
    (animation) =>
      normalizeAnimationName(animation.name) === normalizedRequested,
  );
}
