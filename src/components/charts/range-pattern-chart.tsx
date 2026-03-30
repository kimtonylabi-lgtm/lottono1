"use client";

import { DrawPatternStats } from "@/lib/types";

interface RangePatternChartProps {
  patterns: DrawPatternStats[];
}

const RANGE_LABELS = ["1-10", "11-20", "21-30", "31-40", "41-45"];
const RANGE_COLORS = ["#facc15", "#3b82f6", "#ef4444", "#6b7280", "#22c55e"];

export default function RangePatternChart({ patterns }: RangePatternChartProps) {
  const top10 = patterns.slice(0, 10);
  const maxFreq = top10[0]?.frequency ?? 1;

  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)] animate-slide-up">
      <h2 className="text-base font-bold text-[var(--color-foreground)] mb-1">
        구간 패턴 분석
      </h2>
      <p className="text-xs text-[var(--color-muted-light)] mb-2">
        6개 번호의 구간별 분포 패턴 (상위 10개)
      </p>
      <div className="flex gap-1 mb-4">
        {RANGE_LABELS.map((label, i) => (
          <span
            key={label}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ backgroundColor: RANGE_COLORS[i], color: i === 0 ? "#713f12" : "#fff" }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {top10.map((p, idx) => {
          const counts = p.rangePattern.split("-").map(Number);
          return (
            <div key={p.rangePattern} className="flex items-center gap-2">
              <div className="flex gap-0.5 shrink-0">
                {counts.map((count, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center text-white"
                    style={{
                      backgroundColor: count > 0 ? RANGE_COLORS[i] : "var(--color-surface)",
                      color: count > 0 ? (i === 0 ? "#713f12" : "#fff") : "var(--color-muted)",
                    }}
                  >
                    {count}
                  </div>
                ))}
              </div>
              <div className="flex-1 h-5 bg-[var(--color-surface)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(p.frequency / maxFreq) * 100}%`,
                    backgroundColor: idx === 0 ? "#8b5cf6" : "#a78bfa",
                  }}
                />
              </div>
              <span className="text-xs text-[var(--color-muted)] w-14 text-right shrink-0">
                {p.frequency}회 ({p.percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
