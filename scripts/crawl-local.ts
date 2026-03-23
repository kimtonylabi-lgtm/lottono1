/**
 * Local crawl script — fetches all lotto draws from lottoen.com
 * and saves analysis result as a static JSON file.
 *
 * Usage: npx tsx scripts/crawl-local.ts
 */

import { scrapeAllDraws } from "../src/lib/scraper";
import { analyze } from "../src/lib/analyzer";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(__dirname, "..", "public", "data");
const DRAWS_PATH = join(DATA_DIR, "draws.json");
const CACHE_PATH = join(DATA_DIR, "cache.json");

async function main() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load existing local draws if any
  let existingDraws: Array<{
    round: number;
    date: string;
    numbers: number[];
    bonus: number;
  }> = [];
  if (existsSync(DRAWS_PATH)) {
    existingDraws = JSON.parse(readFileSync(DRAWS_PATH, "utf-8"));
    console.log(`Existing local draws: ${existingDraws.length}`);
  }

  const lastRound =
    existingDraws.length > 0
      ? Math.max(...existingDraws.map((d) => d.round))
      : 0;

  console.log(`Last round: ${lastRound}, fetching new draws...`);
  const newDraws = await scrapeAllDraws(lastRound);
  console.log(`Fetched ${newDraws.length} new draws`);

  // Merge
  const map = new Map<number, (typeof existingDraws)[0]>();
  for (const d of existingDraws) map.set(d.round, d);
  for (const d of newDraws) map.set(d.round, d);
  const merged = Array.from(map.values()).sort((a, b) => a.round - b.round);

  // Save draws
  writeFileSync(DRAWS_PATH, JSON.stringify(merged, null, 2));
  console.log(`Saved ${merged.length} total draws to ${DRAWS_PATH}`);

  // Analyze and save cache
  const analysis = analyze(merged);
  const cache = {
    analysis,
    lastUpdated: new Date().toISOString(),
  };
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  console.log(`Saved analysis cache to ${CACHE_PATH}`);
  console.log(`Latest round: ${analysis.latestRound}`);
}

main().catch((err) => {
  console.error("Crawl failed:", err);
  process.exit(1);
});
