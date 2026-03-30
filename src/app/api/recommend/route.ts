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

    // Parse fixed numbers
    const fixedParam = searchParams.get("fixed") || "";
    const fixedNumbers = fixedParam
      ? fixedParam
          .split(",")
          .map(Number)
          .filter((n) => n >= 1 && n <= 45 && !isNaN(n))
          .filter((n, i, arr) => arr.indexOf(n) === i)
          .slice(0, 5)
      : undefined;

    if (count === 1) {
      const recommendation = recommend(cache.analysis, { strategy, fixedNumbers });
      return NextResponse.json(recommendation, {
        headers: { "Cache-Control": "private, no-cache" },
      });
    }

    const recommendations = recommendMultiple(cache.analysis, { strategy, count, fixedNumbers });
    return NextResponse.json(recommendations, {
      headers: { "Cache-Control": "private, no-cache" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate", message: String(error) },
      { status: 500 }
    );
  }
}
