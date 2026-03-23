import { Draw } from "./types";
import { getDb } from "./firebase";

const DOC_PATH = "lotto/draws";

export async function loadDraws(): Promise<Draw[]> {
  const db = getDb();
  const doc = await db.doc(DOC_PATH).get();

  if (!doc.exists) return [];

  const data = doc.data();
  return (data?.items as Draw[]) || [];
}

export async function getLastRound(): Promise<number> {
  const draws = await loadDraws();
  if (draws.length === 0) return 0;
  return draws[draws.length - 1].round;
}

export async function saveDraws(newDraws: Draw[]): Promise<number> {
  const db = getDb();
  const existing = await loadDraws();

  // Merge
  const map = new Map<number, Draw>();
  for (const d of existing) map.set(d.round, d);
  for (const d of newDraws) map.set(d.round, d);

  const merged = Array.from(map.values()).sort((a, b) => a.round - b.round);
  const added = merged.length - existing.length;

  await db.doc(DOC_PATH).set({ items: merged });

  return added;
}
