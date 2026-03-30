"use client";

import { useState, useCallback } from "react";
import { Recommendation, Strategy } from "@/lib/types";
import LottoBall from "./lotto-ball";
import LottoMachine from "./lotto-machine";
import NumberGrid from "./number-grid";

interface RecommendationCardProps {
  initial: Recommendation;
}

const strategies: { id: Strategy; label: string }[] = [
  { id: "conservative", label: "보수적" },
  { id: "balanced", label: "균형" },
  { id: "aggressive", label: "공격적" },
];

export default function RecommendationCard({
  initial,
}: RecommendationCardProps) {
  const [recs, setRecs] = useState<Recommendation[]>([initial]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [strategy, setStrategy] = useState<Strategy>("balanced");
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [pendingRecs, setPendingRecs] = useState<Recommendation[] | null>(null);
  const [showResult, setShowResult] = useState(true);
  const [fixedNumbers, setFixedNumbers] = useState<number[]>([]);
  const [showFixed, setShowFixed] = useState(false);

  const rec = recs[activeIdx] ?? recs[0];
  const { numbers, reasons, basedOnRound, generatedAt, sumTotal } = rec;

  // The numbers to feed into the machine animation (sorted for display)
  const drawingNumbers = pendingRecs ? pendingRecs[0].numbers : numbers;

  function buildUrl(count: number) {
    let url = `/api/recommend?strategy=${strategy}&count=${count}`;
    if (fixedNumbers.length > 0) {
      url += `&fixed=${fixedNumbers.join(",")}`;
    }
    return url;
  }

  function handleFixedToggle(n: number) {
    setFixedNumbers((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  }

  async function handleDraw() {
    setLoading(true);
    setShowResult(false);
    try {
      const count = Math.max(recs.length, 1);
      const res = await fetch(buildUrl(count));
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const results: Recommendation[] = Array.isArray(data) ? data : [data];
      setPendingRecs(results);
      setDrawing(true);
    } catch {
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  }

  const handleDrawComplete = useCallback(() => {
    if (pendingRecs) {
      setRecs(pendingRecs);
      setActiveIdx(0);
      setPendingRecs(null);
    }
    setDrawing(false);
    setShowResult(true);
  }, [pendingRecs]);

  function addSet() {
    setLoading(true);
    setShowResult(false);
    fetch(buildUrl(recs.length + 1))
      .then((res) => res.json())
      .then((data) => {
        const results: Recommendation[] = Array.isArray(data) ? data : [data];
        setPendingRecs(results);
        setActiveIdx(results.length - 1);
        setDrawing(true);
      })
      .catch(() => setShowResult(true))
      .finally(() => setLoading(false));
  }

  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)] animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-[var(--color-foreground)]">AI 추천 번호</h2>
        <button
          onClick={handleDraw}
          disabled={loading || drawing}
          className="text-sm text-blue-500 font-semibold hover:text-blue-600 active:scale-95 transition disabled:opacity-50"
        >
          {loading ? "분석 중..." : drawing ? "추첨 중..." : "번호 추첨"}
        </button>
      </div>

      {/* Strategy selector */}
      <div className="flex bg-[var(--color-surface)] rounded-lg p-0.5 mb-4">
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => { if (!drawing) setStrategy(s.id); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              strategy === s.id
                ? "bg-blue-500 text-white shadow-sm"
                : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Fixed numbers */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowFixed(!showFixed)}
          className="flex items-center gap-1 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition mb-2"
        >
          <span>{showFixed ? "▼" : "▶"}</span>
          <span>고정번호 설정</span>
          {fixedNumbers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-[10px]">
              {fixedNumbers.length}
            </span>
          )}
        </button>
        {showFixed && (
          <div className="animate-fade-in">
            <NumberGrid
              selected={fixedNumbers}
              onToggle={handleFixedToggle}
              maxSelect={5}
              disabled={drawing}
            />
            {fixedNumbers.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-[var(--color-muted)]">고정:</span>
                {fixedNumbers.sort((a, b) => a - b).map((n) => (
                  <LottoBall key={n} number={n} size="sm" />
                ))}
                <button
                  onClick={() => setFixedNumbers([])}
                  className="ml-auto text-[10px] text-[var(--color-muted)] hover:text-red-500 transition"
                >
                  초기화
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Set tabs */}
      {recs.length > 1 && !drawing && (
        <div className="flex gap-1 mb-3">
          {recs.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                activeIdx === i
                  ? "bg-blue-500 text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-muted)]"
              }`}
            >
              {i + 1}
            </button>
          ))}
          {recs.length < 5 && (
            <button
              onClick={addSet}
              disabled={loading || drawing}
              className="w-8 h-8 rounded-full bg-[var(--color-surface)] text-[var(--color-muted)] text-xs font-bold hover:bg-blue-100 transition disabled:opacity-50"
            >
              +
            </button>
          )}
        </div>
      )}

      {/* Drawing animation */}
      {drawing && (
        <LottoMachine
          targetNumbers={drawingNumbers}
          onComplete={handleDrawComplete}
        />
      )}

      {/* Result display */}
      {showResult && !drawing && (
        <>
          <p className="text-sm text-[var(--color-muted)] mb-4">
            {basedOnRound}회차 기준 | 합계: {sumTotal}
          </p>

          <div key={`balls-${activeIdx}-${generatedAt}`} className="flex justify-center gap-3 mb-6">
            {numbers.map((n, i) => (
              <div key={n} className="relative">
                <LottoBall number={n} size="lg" delay={i * 80} />
                {reasons[n] === "고정번호" && (
                  <span className="absolute -top-1 -right-1 text-[10px] bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    P
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--color-muted)]">선정 근거</h3>
            {numbers.map((n) => (
              <div key={n} className="flex items-center gap-2 text-sm">
                <LottoBall number={n} size="sm" />
                <span className="text-[var(--color-muted)] text-xs">
                  {reasons[n] === "고정번호" ? "📌 고정번호" : reasons[n]}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4">
            {recs.length < 5 && recs.length === 1 && (
              <button
                onClick={addSet}
                disabled={loading || drawing}
                className="text-xs text-blue-500 font-semibold hover:text-blue-600 transition disabled:opacity-50"
              >
                + 세트 추가
              </button>
            )}
            <p className="text-xs text-[var(--color-muted-light)] text-right ml-auto">
              {new Date(generatedAt).toLocaleString("ko-KR")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
