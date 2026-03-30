import { NextRequest, NextResponse } from "next/server";
import { loadDraws } from "@/lib/crawler";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const draws = await loadDraws();

    if (!draws || draws.length === 0) {
      return NextResponse.json({ draws: [], total: 0, page: 1, totalPages: 0 });
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const size = Math.min(50, Math.max(1, parseInt(searchParams.get("size") || "20", 10)));
    const search = searchParams.get("search");

    const sorted = [...draws].sort((a, b) => b.round - a.round);

    if (search) {
      const round = parseInt(search, 10);
      if (!isNaN(round)) {
        const found = sorted.filter((d) => String(d.round).includes(search));
        return NextResponse.json({
          draws: found.slice(0, size),
          total: found.length,
          page: 1,
          totalPages: Math.ceil(found.length / size),
        }, {
          headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
        });
      }
    }

    const total = sorted.length;
    const totalPages = Math.ceil(total / size);
    const start = (page - 1) * size;
    const paged = sorted.slice(start, start + size);

    return NextResponse.json({ draws: paged, total, page, totalPages }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load draws", message: String(error) },
      { status: 500 }
    );
  }
}
