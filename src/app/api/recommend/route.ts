import { NextRequest, NextResponse } from "next/server";
import { loadCache } from "@/lib/crawler";
import { recommend, recommendMultiple } from "@/lib/recommender";
import { Strategy } from "@/lib/types";

export const dynamic = "force-dynamic";

const validStrategies: Strategy[] = ["balanced", "aggressive", "conservative"];

export async function GET(request: NextRequest) {
  try {
    const cache = await loadCache();

    if (!cache) {
      return NextResponse.json(
        { error: "No data available" },
        { status: 404 }
      );
    }

    const { searchParams } = request.nextUrl;
    const strategyParam = searchParams.get("strategy") || "balanced";
    const countParam = parseInt(searchParams.get("count") || "1", 10);

    const strategy = validStrategies.includes(strategyParam as Strategy)
      ? (strategyParam as Strategy)
      : "balanced";
    const count = Math.max(1, Math.min(countParam, 5));

    if (count === 1) {
      const recommendation = recommend(cache.analysis, { strategy });
      return NextResponse.json(recommendation);
    }

    const recommendations = recommendMultiple(cache.analysis, { strategy, count });
    return NextResponse.json(recommendations);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate", message: String(error) },
      { status: 500 }
    );
  }
}
