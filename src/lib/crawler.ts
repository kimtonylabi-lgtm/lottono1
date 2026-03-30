import { Draw, ExtendedAnalysis } from "./types";
import { getDb } from "./firebase";
import { analyzeExtended } from "./analyzer";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const DRAWS_DOC = "lotto/draws";
const CACHE_DOC = "lotto/cache";

interface CachedData {
  analysis: ExtendedAnalysis;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// In-memory cache layer — avoids redundant Firestore reads.
// Lotto data changes at most once per week (Sunday crawl), so a generous TTL
// is safe.  The cache is also explicitly invalidated after a successful crawl.
// ---------------------------------------------------------------------------
const MEMORY_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface MemoryEntry<T> {
  data: T;
  expiresAt: number;
}

let memCache: MemoryEntry<CachedData> | null = null;
let memDraws: MemoryEntry<Draw[]> | null = null;

function isValid<T>(entry: MemoryEntry<T> | null): entry is MemoryEntry<T> {
  return entry !== null && Date.now() < entry.expiresAt;
}

export function invalidateMemoryCache() {
  memCache = null;
  memDraws = null;
}

// ---------------------------------------------------------------------------
// Local JSON fallback
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Public API (signatures unchanged)
// ---------------------------------------------------------------------------

// Read pre-computed analysis — memory → Firestore → local JSON
export async function loadCache(): Promise<CachedData | null> {
  if (isValid(memCache)) return memCache.data;

  let result: CachedData | null = null;
  try {
    const db = getDb();
    const doc = await db.doc(CACHE_DOC).get();
    if (doc.exists) result = doc.data() as CachedData;
  } catch {
    // Firestore unavailable — fall through to local
  }
  if (!result) result = loadLocalCache();

  if (result) {
    memCache = { data: result, expiresAt: Date.now() + MEMORY_TTL_MS };
  }
  return result;
}

// Read all draws — memory → Firestore → local JSON
export async function loadDraws(): Promise<Draw[]> {
  if (isValid(memDraws)) return memDraws.data;

  let result: Draw[] = [];
  try {
    const db = getDb();
    const doc = await db.doc(DRAWS_DOC).get();
    if (doc.exists) result = (doc.data()?.items as Draw[]) || [];
  } catch {
    // Firestore unavailable — fall through to local
  }
  if (result.length === 0) result = loadLocalDraws();

  if (result.length > 0) {
    memDraws = { data: result, expiresAt: Date.now() + MEMORY_TTL_MS };
  }
  return result;
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

  // Pre-compute and cache extended analysis
  const analysis = analyzeExtended(merged);
  const cachedData: CachedData = {
    analysis,
    lastUpdated: new Date().toISOString(),
  };
  await db.doc(CACHE_DOC).set(cachedData);

  // Update memory cache immediately with fresh data
  invalidateMemoryCache();
  memCache = { data: cachedData, expiresAt: Date.now() + MEMORY_TTL_MS };
  memDraws = { data: merged, expiresAt: Date.now() + MEMORY_TTL_MS };

  return added;
}

export async function getLastRound(): Promise<number> {
  const cache = await loadCache();
  if (cache) return cache.analysis.latestRound;

  const draws = await loadDraws();
  if (draws.length === 0) return 0;
  return draws[draws.length - 1].round;
}
