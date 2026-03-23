import { NextResponse } from "next/server";
import { getLastRound, saveDraws } from "@/lib/crawler";
import { scrapeAllDraws } from "@/lib/scraper";

export async function GET() {
  try {
    const lastRound = await getLastRound();
    return NextResponse.json({ lastRound });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get last round", message: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const lastRound = await getLastRound();
    const newDraws = await scrapeAllDraws(lastRound);

    if (newDraws.length === 0) {
      return NextResponse.json({
        success: true,
        added: 0,
        message: "Already up to date",
      });
    }

    const added = await saveDraws(newDraws);

    return NextResponse.json({
      success: true,
      added,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Crawl failed", message: String(error) },
      { status: 500 }
    );
  }
}
