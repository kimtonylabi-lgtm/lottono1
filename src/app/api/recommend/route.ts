import { NextResponse } from "next/server";
import { loadCache } from "@/lib/crawler";
import { recommend } from "@/lib/recommender";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cache = await loadCache();

    if (!cache) {
      return NextResponse.json(
        { error: "No data available" },
        { status: 404 }
      );
    }

    const recommendation = recommend(cache.analysis);
    return NextResponse.json(recommendation);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate", message: String(error) },
      { status: 500 }
    );
  }
}
