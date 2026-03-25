"use client";

import { CoOccurrence } from "@/lib/types";
import LottoBall from "../lotto-ball";

interface CoOccurrenceChartProps {
  pairs: CoOccurrence[];
}

export default function CoOccurrenceChart({ pairs }: CoOccurrenceChartProps) {
  const top10 = pairs.slice(0, 10);
  const maxCount = top10[0]?.count ?? 1;

  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)] animate-slide-up">
      <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">
        자주 함께 나오는 번호
      </h2>
      <div className="space-y-3">
        {top10.map(({ pair, count }) => (
          <div key={`${pair[0]}-${pair[1]}`} className="flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <LottoBall number={pair[0]} size="sm" />
              <LottoBall number={pair[1]} size="sm" />
            </div>
            <div className="flex-1 h-5 bg-[var(--color-surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[var(--color-muted)] w-10 text-right shrink-0">{count}회</span>
          </div>
        ))}
      </div>
    </div>
  );
}
