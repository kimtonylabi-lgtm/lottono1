"use client";

import { useState, useEffect } from "react";
import { Draw } from "@/lib/types";
import LottoBall from "./lotto-ball";

interface DrawsResponse {
  draws: Draw[];
  total: number;
  page: number;
  totalPages: number;
}

export default function DrawHistory() {
  const [data, setData] = useState<DrawsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), size: "15" });
    if (search) params.set("search", search);

    fetch(`/api/draws?${params}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex gap-2 bg-[var(--color-card)] rounded-xl p-3 border border-[var(--color-card-border)] shadow-sm"
      >
        <input
          type="number"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="회차 검색"
          className="flex-1 bg-[var(--color-surface)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-light)] outline-none"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition"
        >
          검색
        </button>
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-3 py-2 bg-[var(--color-surface)] text-[var(--color-muted)] text-sm rounded-lg hover:text-[var(--color-foreground)] transition"
          >
            초기화
          </button>
        )}
      </form>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-[var(--color-card)] rounded-xl animate-pulse border border-[var(--color-card-border)]"
            />
          ))}
        </div>
      )}

      {/* Draw list */}
      {!loading && data && (
        <>
          {data.draws.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted)]">
              검색 결과가 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {data.draws.map((draw) => (
                <div
                  key={draw.round}
                  className="bg-[var(--color-card)] rounded-xl p-3 border border-[var(--color-card-border)] shadow-sm animate-fade-in"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-[var(--color-foreground)]">
                      {draw.round}회
                    </span>
                    <span className="text-xs text-[var(--color-muted-light)]">
                      {draw.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {draw.numbers.map((n) => (
                      <LottoBall key={n} number={n} size="sm" />
                    ))}
                    <span className="text-xs text-[var(--color-muted)] mx-1">+</span>
                    <div className="opacity-60">
                      <LottoBall number={draw.bonus} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition disabled:opacity-30"
              >
                이전
              </button>
              <span className="text-sm text-[var(--color-muted)]">
                {data.page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition disabled:opacity-30"
              >
                다음
              </button>
            </div>
          )}

          <p className="text-center text-xs text-[var(--color-muted-light)]">
            총 {data.total}개 회차
          </p>
        </>
      )}
    </div>
  );
}
