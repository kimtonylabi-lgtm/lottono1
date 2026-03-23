import { Draw, AnalysisResult } from "./types";
import { getDb } from "./firebase";
import { analyze } from "./analyzer";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const DRAWS_DOC = "lotto/draws";
const CACHE_DOC = "lotto/cache";

interface CachedData {
  analysis: AnalysisResult;
  lastUpdated: string;
}

function loadLocalCache(): CachedData | null {
  const cachePath = join(process.cwd(), "public", "data", "cache.json");
  if (!existsSync(cachePath)) return null;
  return JSON.parse(readFileSync(cachePath, "utf-8")) as CachedData;
}

function loadLocalDraws(): Draw[] {
  const drawsPath = join(process.cwd(), "public", "data", "draws.json");
  if (!existsSync(drawsPath)) return [];
  return JSON.parse(readFileSync(drawsPath, "utf-8")) as Draw[];
}

// Read pre-computed analysis — tries Firestore first, falls back to local JSON
export async function loadCache(): Promise<CachedData | null> {
  try {
    const db = getDb();
    const doc = await db.doc(CACHE_DOC).get();
    if (doc.exists) return doc.data() as CachedData;
  } catch {
    // Firestore unavailable — fall through to local
  }
  return loadLocalCache();
}

// Read all draws — tries Firestore first, falls back to local JSON
export async function loadDraws(): Promise<Draw[]> {
  try {
    const db = getDb();
    const doc = await db.doc(DRAWS_DOC).get();
    if (doc.exists) return (doc.data()?.items as Draw[]) || [];
  } catch {
    // Firestore unavailable — fall through to local
  }
  return loadLocalDraws();
}

// Save draws + recompute and cache analysis (only during crawl)
export async function saveDraws(newDraws: Draw[]): Promise<number> {
  const db = getDb();
  const existing = await loadDraws();

  const map = new Map<number, Draw>();
  for (const d of existing) map.set(d.round, d);
  for (const d of newDraws) map.set(d.round, d);

  const merged = Array.from(map.values()).sort((a, b) => a.round - b.round);
  const added = merged.length - existing.length;

  // Save draws
  await db.doc(DRAWS_DOC).set({ items: merged });

  // Pre-compute and cache analysis
  const analysis = analyze(merged);
  await db.doc(CACHE_DOC).set({
    analysis,
    lastUpdated: new Date().toISOString(),
  });

  return added;
}

export async function getLastRound(): Promise<number> {
  const cache = await loadCache();
  if (cache) return cache.analysis.latestRound;

  const draws = await loadDraws();
  if (draws.length === 0) return 0;
  return draws[draws.length - 1].round;
}
