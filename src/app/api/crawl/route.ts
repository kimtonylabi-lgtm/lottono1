import { NextResponse } from "next/server";
import { getLastRound, saveDraws } from "@/lib/crawler";
import { scrapeAllDraws } from "@/lib/scraper";

export const maxDuration = 60;

async function crawl() {
  const lastRound = await getLastRound();
  const newDraws = await scrapeAllDraws(lastRound);

  if (newDraws.length === 0) {
    return { success: true, added: 0, message: "Already up to date" };
  }

  const added = await saveDraws(newDraws);
  return { success: true, added };
}

// GET: Vercel Cron calls this weekly
export async function GET() {
  try {
    const result = await crawl();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Crawl failed", message: String(error) },
      { status: 500 }
    );
  }
}

// POST: Manual crawl from UI button
export async function POST() {
  try {
    const result = await crawl();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Crawl failed", message: String(error) },
      { status: 500 }
    );
  }
}
