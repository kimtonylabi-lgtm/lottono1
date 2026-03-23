import { NextResponse } from "next/server";
import { loadDraws } from "@/lib/crawler";
import { analyze } from "@/lib/analyzer";
import { recommend } from "@/lib/recommender";

export async function GET() {
  try {
    const draws = await loadDraws();

    if (draws.length === 0) {
      return NextResponse.json(
        { error: "No data available" },
        { status: 404 }
      );
    }

    const analysis = analyze(draws);
    const recommendation = recommend(analysis);

    return NextResponse.json(recommendation);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate", message: String(error) },
      { status: 500 }
    );
  }
}
