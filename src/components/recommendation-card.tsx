"use client";

import { useState, useCallback } from "react";
import { Recommendation, Strategy } from "@/lib/types";
import LottoBall from "./lotto-ball";
import LottoMachine from "./lotto-machine";

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

  const rec = recs[activeIdx] ?? recs[0];
  const { numbers, reasons, basedOnRound, generatedAt, sumTotal } = rec;

  // The numbers to feed into the machine animation (sorted for display)
  const drawingNumbers = pendingRecs ? pendingRecs[0].numbers : numbers;

  async function handleDraw() {
    setLoading(true);
    setShowResult(false);
    try {
      const count = Math.max(recs.length, 1);
      const res = await fetch(`/api/recommend?strategy=${strategy}&count=${count}`);
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
    fetch(`/api/recommend?strategy=${strategy}&count=${recs.length + 1}`)
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
              <LottoBall key={n} number={n} size="lg" delay={i * 80} />
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-[var(--color-muted)]">선정 근거</h3>
            {numbers.map((n) => (
              <div key={n} className="flex items-center gap-2 text-sm">
                <LottoBall number={n} size="sm" />
                <span className="text-[var(--color-muted)] text-xs">{reasons[n]}</span>
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
