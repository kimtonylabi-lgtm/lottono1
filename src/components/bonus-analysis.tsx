import { BonusStats } from "@/lib/types";
import LottoBall from "./lotto-ball";

interface BonusAnalysisProps {
  stats: BonusStats[];
  latestRound: number;
}

export default function BonusAnalysis({ stats, latestRound }: BonusAnalysisProps) {
  const sorted = [...stats].sort((a, b) => b.bonusFrequency - a.bonusFrequency);
  const hot = sorted.slice(0, 10);

  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)] animate-slide-up">
      <h3 className="text-sm font-bold text-purple-500 mb-3">
        보너스 번호 TOP 10
      </h3>
      <div className="space-y-2">
        {hot.map((s) => (
          <div key={s.number} className="flex items-center gap-2">
            <LottoBall number={s.number} size="sm" />
            <div className="flex-1">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--color-muted)]">{s.bonusFrequency}회</span>
                <span className="text-[var(--color-muted-light)]">
                  {latestRound - s.lastBonusAppeared}회차 전
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
