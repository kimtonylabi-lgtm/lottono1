import { NextRequest, NextResponse } from "next/server";
import { loadDraws } from "@/lib/crawler";
import { checkNumbers } from "@/lib/checker";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numbers } = body;

    if (!Array.isArray(numbers) || numbers.length !== 6) {
      return NextResponse.json(
        { error: "Exactly 6 numbers required" },
        { status: 400 }
      );
    }

    const parsed = numbers.map(Number);
    if (parsed.some((n) => isNaN(n) || n < 1 || n > 45)) {
      return NextResponse.json(
        { error: "Numbers must be between 1 and 45" },
        { status: 400 }
      );
    }

    const unique = new Set(parsed);
    if (unique.size !== 6) {
      return NextResponse.json(
        { error: "Numbers must be unique" },
        { status: 400 }
      );
    }

    const draws = await loadDraws();
    if (!draws || draws.length === 0) {
      return NextResponse.json(
        { error: "No draw data available" },
        { status: 404 }
      );
    }

    const result = checkNumbers(parsed, draws);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to check numbers", message: String(error) },
      { status: 500 }
    );
  }
}
