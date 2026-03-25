import { NumberStats } from "@/lib/types";
import LottoBall from "./lotto-ball";

interface HotColdTableProps {
  stats: NumberStats[];
}

export default function HotColdTable({ stats }: HotColdTableProps) {
  const sorted = [...stats].sort(
    (a, b) => b.recentFrequency - a.recentFrequency
  );
  const hot = sorted.slice(0, 10);
  const cold = sorted.slice(-10).reverse();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)] animate-slide-up">
        <h3 className="text-sm font-bold text-red-500 mb-3">
          HOT (최근 50회)
        </h3>
        <div className="space-y-2">
          {hot.map((s) => (
            <div key={s.number} className="flex items-center gap-2">
              <LottoBall number={s.number} size="sm" />
              <span className="text-xs text-[var(--color-muted)]">
                {s.recentFrequency}회
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-4 border border-[var(--color-card-border)] animate-slide-up" style={{ animationDelay: "100ms" }}>
        <h3 className="text-sm font-bold text-blue-500 mb-3">
          COLD (최근 50회)
        </h3>
        <div className="space-y-2">
          {cold.map((s) => (
            <div key={s.number} className="flex items-center gap-2">
              <LottoBall number={s.number} size="sm" />
              <span className="text-xs text-[var(--color-muted)]">
                {s.recentFrequency}회
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
