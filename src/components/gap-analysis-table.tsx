import { GapAnalysis } from "@/lib/types";
import LottoBall from "./lotto-ball";

interface GapAnalysisTableProps {
  gaps: GapAnalysis[];
}

export default function GapAnalysisTable({ gaps }: GapAnalysisTableProps) {
  // Show numbers where current gap exceeds average gap significantly (overdue)
  const overdue = [...gaps]
    .filter((g) => g.averageGap > 0 && g.currentGap > g.averageGap)
    .sort((a, b) => b.currentGap / b.averageGap - a.currentGap / a.averageGap)
    .slice(0, 10);

  const trendIcon: Record<string, string> = {
    increasing: "\u2191",
    decreasing: "\u2193",
    stable: "\u2192",
  };

  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)] animate-slide-up">
      <h3 className="text-sm font-bold text-orange-500 mb-3">
        출현 임박 번호 (갭 분석)
      </h3>
      <div className="space-y-2">
        {overdue.map((g) => {
          const ratio = g.currentGap / g.averageGap;
          return (
            <div key={g.number} className="flex items-center gap-2">
              <LottoBall number={g.number} size="sm" />
              <div className="flex-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-muted)]">
                    현재 {g.currentGap}회 / 평균 {g.averageGap}회
                  </span>
                  <span className={ratio > 1.5 ? "text-red-500 font-bold" : "text-[var(--color-muted-light)]"}>
                    {ratio.toFixed(1)}x {trendIcon[g.gapTrend]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
