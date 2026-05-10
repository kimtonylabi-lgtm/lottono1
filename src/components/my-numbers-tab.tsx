"use client";

import { useEffect, useMemo, useState } from "react";
import { getPurchasedSets, removePurchasedSet, PurchasedSet } from "@/lib/purchased-store";
import { checkNumbers } from "@/lib/checker";
import type { Draw, MatchResult } from "@/lib/types";
import LottoBall from "./lotto-ball";
import NumberChecker from "./number-checker";

const RANK_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "1등", color: "#ef4444" },
  2: { label: "2등", color: "#f97316" },
  3: { label: "3등", color: "#eab308" },
  4: { label: "4등", color: "#22c55e" },
  5: { label: "5등", color: "#3b82f6" },
};

interface SetCheck {
  set: PurchasedSet;
  // 구매 후 추첨된 회차 결과들 (당첨된 것만 들어 있음 — checker.ts가 그렇게 동작)
  results: MatchResult[];
  // 구매 후 추첨된 총 회차 수 (당첨 여부 무관)
  drawsAfter: number;
  // 구매 후 추첨된 회차들 (전체)
  drawsAfterList: Draw[];
}

function daysLeft(set: PurchasedSet): number {
  return Math.ceil(
    (14 - (Date.now() - new Date(set.purchasedAt).getTime()) / (1000 * 60 * 60 * 24))
  );
}

function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

export default function MyNumbersTab() {
  const [purchased, setPurchased] = useState<PurchasedSet[]>([]);
  const [draws, setDraws] = useState<Draw[] | null>(null);
  const [drawsError, setDrawsError] = useState<string | null>(null);

  useEffect(() => {
    setPurchased(getPurchasedSets());
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/draws?size=10")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setDraws(Array.isArray(data.draws) ? data.draws : []);
      })
      .catch(() => {
        if (cancelled) return;
        setDrawsError("최근 회차 정보를 불러오지 못했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleDelete(id: string) {
    removePurchasedSet(id);
    setPurchased(getPurchasedSets());
  }

  const checks: SetCheck[] = useMemo(() => {
    if (!draws) return [];
    return purchased.map((set) => {
      const purchasedDate = new Date(set.purchasedAt);
      const drawsAfterList = draws.filter(
        (d) => new Date(d.date).getTime() >= purchasedDate.getTime()
      );
      const { results } = checkNumbers(set.numbers, drawsAfterList);
      return {
        set,
        results,
        drawsAfter: drawsAfterList.length,
        drawsAfterList,
      };
    });
  }, [purchased, draws]);

  if (purchased.length === 0) {
    return (
      <div className="space-y-3">
        <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)] animate-slide-up text-center">
          <p className="text-sm text-[var(--color-muted)]">
            아직 등록된 구매 번호가 없습니다.
          </p>
          <p className="text-xs text-[var(--color-muted-light)] mt-1">
            추천 탭에서 번호를 추첨한 뒤 <span className="font-semibold">구매 등록</span> 버튼을 누르면 여기에 모입니다.
          </p>
        </div>
        <NumberCheckerSection />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drawsError && (
        <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs rounded-lg p-3 border border-red-200 dark:border-red-900">
          {drawsError}
        </div>
      )}

      {checks.map(({ set, results, drawsAfter, drawsAfterList }) => {
        const top = results[0];
        const status: { tone: "wait" | "miss" | "win"; text: string } = !draws
          ? { tone: "wait", text: "확인 중..." }
          : drawsAfter === 0
            ? { tone: "wait", text: "다음 추첨 대기 중" }
            : top
              ? { tone: "win", text: `${top.round}회 ${RANK_LABELS[top.rank!].label} 당첨` }
              : { tone: "miss", text: `${drawsAfter}회차 확인, 당첨 없음` };

        const toneCls =
          status.tone === "win"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            : status.tone === "miss"
              ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300";

        return (
          <div
            key={set.id}
            className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)] animate-slide-up"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[var(--color-muted-light)]">
                {formatDateOnly(set.purchasedAt)} 등록 · D-{daysLeft(set)}
              </span>
              <button
                onClick={() => handleDelete(set.id)}
                className="text-[10px] text-[var(--color-muted)] hover:text-red-500 transition"
              >
                삭제
              </button>
            </div>

            <div className="flex justify-center gap-1.5 sm:gap-2 mb-3">
              {set.numbers.map((n) => (
                <LottoBall key={n} number={n} size="md" />
              ))}
            </div>

            <div className={`text-center text-sm font-semibold rounded-lg py-2 ${toneCls}`}>
              {status.text}
            </div>

            {results.length > 0 && (
              <div className="mt-3 space-y-2">
                {results.map((r) => {
                  const matchedSet = new Set(r.matchedNumbers);
                  const info = r.rank ? RANK_LABELS[r.rank] : null;
                  return (
                    <div
                      key={r.round}
                      className="rounded-lg p-2 border border-[var(--color-card-border)]"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[var(--color-foreground)]">
                          {r.round}회 · {r.date}
                        </span>
                        {info && (
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: info.color }}
                          >
                            {info.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {r.drawNumbers.map((n) => (
                          <div key={n} className={matchedSet.has(n) ? "" : "opacity-30"}>
                            <LottoBall number={n} size="sm" />
                          </div>
                        ))}
                        <span className="text-xs text-[var(--color-muted)] mx-0.5">+</span>
                        <div className={r.matchedBonus ? "" : "opacity-30"}>
                          <LottoBall number={r.bonus} size="sm" />
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--color-muted)] mt-1">
                        {r.matchCount}개 일치{r.matchedBonus ? " + 보너스" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {drawsAfter > 0 && results.length === 0 && drawsAfterList.length > 0 && (
              <details className="mt-3">
                <summary className="text-[11px] text-[var(--color-muted)] cursor-pointer hover:text-[var(--color-foreground)] transition">
                  확인된 회차 보기 ({drawsAfter}회)
                </summary>
                <ul className="mt-2 space-y-1">
                  {drawsAfterList.map((d) => (
                    <li
                      key={d.round}
                      className="text-[11px] text-[var(--color-muted-light)] flex justify-between"
                    >
                      <span>{d.round}회 · {d.date}</span>
                      <span className="text-[var(--color-muted)]">{d.numbers.join(", ")} +{d.bonus}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}

      <NumberCheckerSection />
    </div>
  );
}

function NumberCheckerSection() {
  return (
    <div className="pt-2">
      <h3 className="text-xs font-semibold text-[var(--color-muted)] mb-2 px-1">
        번호 검사 — 임의의 6개로 역대 회차 당첨 이력 확인
      </h3>
      <NumberChecker />
    </div>
  );
}
