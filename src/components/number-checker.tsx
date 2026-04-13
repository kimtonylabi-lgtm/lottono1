"use client";

import { useState, useEffect } from "react";
import { MatchResult } from "@/lib/types";
import { CheckSummary } from "@/lib/checker";
import { getPurchasedSets, removePurchasedSet, PurchasedSet } from "@/lib/purchased-store";
import NumberGrid from "./number-grid";
import LottoBall from "./lotto-ball";

const RANK_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "1등", color: "#ef4444" },
  2: { label: "2등", color: "#f97316" },
  3: { label: "3등", color: "#eab308" },
  4: { label: "4등", color: "#22c55e" },
  5: { label: "5등", color: "#3b82f6" },
};

const STRATEGY_LABELS: Record<string, string> = {
  balanced: "균형",
  aggressive: "공격적",
  conservative: "보수적",
};

export default function NumberChecker() {
  const [selected, setSelected] = useState<number[]>([]);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [summary, setSummary] = useState<CheckSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState<PurchasedSet[]>([]);
  const [showPurchased, setShowPurchased] = useState(true);

  useEffect(() => {
    setPurchased(getPurchasedSets());
  }, []);

  function handleLoadPurchased(set: PurchasedSet) {
    setSelected([...set.numbers]);
    setResults(null);
    setSummary(null);
  }

  function handleDeletePurchased(id: string) {
    removePurchasedSet(id);
    setPurchased(getPurchasedSets());
  }

  function handleToggle(n: number) {
    setSelected((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
    setResults(null);
    setSummary(null);
  }

  function handleReset() {
    setSelected([]);
    setResults(null);
    setSummary(null);
  }

  async function handleCheck() {
    if (selected.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: selected }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResults(data.results);
      setSummary(data.summary);
    } catch {
      setResults([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Purchased numbers */}
      {purchased.length > 0 && (
        <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)] animate-slide-up">
          <button
            type="button"
            onClick={() => setShowPurchased(!showPurchased)}
            className="flex items-center gap-1 w-full text-left"
          >
            <span className="text-xs text-[var(--color-muted)]">{showPurchased ? "▼" : "▶"}</span>
            <h2 className="text-base font-bold text-[var(--color-foreground)]">
              구매 번호
            </h2>
            <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white rounded-full text-[10px] font-bold">
              {purchased.length}
            </span>
          </button>
          {showPurchased && (
            <div className="space-y-2 mt-3 animate-fade-in">
              {purchased.map((set) => {
                const isActive = selected.join(",") === set.numbers.join(",");
                const daysLeft = Math.ceil(
                  (14 - (Date.now() - new Date(set.purchasedAt).getTime()) / (1000 * 60 * 60 * 24))
                );
                return (
                  <div
                    key={set.id}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                        : "border-[var(--color-card-border)] hover:border-[var(--color-muted)]"
                    }`}
                  >
                    <button
                      onClick={() => handleLoadPurchased(set)}
                      className="flex-1 flex items-center gap-1.5 min-w-0"
                    >
                      {set.numbers.map((n) => (
                        <LottoBall key={n} number={n} size="sm" />
                      ))}
                    </button>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-[10px] text-[var(--color-muted-light)]">
                        {STRATEGY_LABELS[set.strategy] ?? set.strategy} · D-{daysLeft}
                      </span>
                      <button
                        onClick={() => handleDeletePurchased(set.id)}
                        className="text-[10px] text-[var(--color-muted)] hover:text-red-500 transition"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Number selection */}
      <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)] animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[var(--color-foreground)]">
            번호 선택
          </h2>
          <span className="text-xs text-[var(--color-muted)]">
            {selected.length}/6
          </span>
        </div>

        <NumberGrid
          selected={selected}
          onToggle={handleToggle}
          maxSelect={6}
          disabled={loading}
        />

        {selected.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3">
            {selected
              .sort((a, b) => a - b)
              .map((n) => (
                <LottoBall key={n} number={n} size="sm" />
              ))}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleCheck}
            disabled={selected.length !== 6 || loading}
            className="flex-1 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "확인 중..." : "당첨 확인"}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 bg-[var(--color-surface)] text-[var(--color-muted)] text-sm rounded-lg hover:text-[var(--color-foreground)] transition disabled:opacity-40"
          >
            초기화
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)] animate-slide-up">
          <h3 className="text-sm font-bold text-[var(--color-foreground)] mb-2">
            총 {summary.total.toLocaleString()}회차 확인 결과
          </h3>
          <div className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5] as const).map((rank) => {
              const count = summary[`rank${rank}` as keyof CheckSummary] as number;
              if (count === 0) return null;
              const info = RANK_LABELS[rank];
              return (
                <span
                  key={rank}
                  className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: info.color }}
                >
                  {info.label} {count}회
                </span>
              );
            })}
            {summary.rank1 + summary.rank2 + summary.rank3 + summary.rank4 + summary.rank5 === 0 && (
              <span className="text-sm text-[var(--color-muted)]">
                당첨 이력이 없습니다
              </span>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => {
            const matchedSet = new Set(r.matchedNumbers);
            const info = r.rank ? RANK_LABELS[r.rank] : null;
            return (
              <div
                key={r.round}
                className="bg-[var(--color-card)] rounded-xl p-3 border border-[var(--color-card-border)] shadow-sm animate-fade-in"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[var(--color-foreground)]">
                    {r.round}회
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted-light)]">{r.date}</span>
                    {info && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: info.color }}
                      >
                        {info.label}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.drawNumbers.map((n) => (
                    <div key={n} className={matchedSet.has(n) ? "" : "opacity-30"}>
                      <LottoBall number={n} size="sm" />
                    </div>
                  ))}
                  <span className="text-xs text-[var(--color-muted)] mx-1">+</span>
                  <div className={r.matchedBonus ? "" : "opacity-30"}>
                    <LottoBall number={r.bonus} size="sm" />
                  </div>
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {r.matchCount}개 일치{r.matchedBonus ? " + 보너스" : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
