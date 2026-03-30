"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { EndingDigitStats } from "@/lib/types";

interface EndingDigitChartProps {
  stats: EndingDigitStats[];
}

const DIGIT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function EndingDigitChart({ stats }: EndingDigitChartProps) {
  const data = stats
    .map((s) => ({ digit: s.digit, freq: s.frequency, recent: s.recentFrequency, pct: s.percentage }))
    .sort((a, b) => a.digit - b.digit);

  const maxFreq = Math.max(...data.map((d) => d.freq));

  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)] animate-slide-up">
      <h2 className="text-base font-bold text-[var(--color-foreground)] mb-1">
        끝수 분석
      </h2>
      <p className="text-xs text-[var(--color-muted-light)] mb-4">
        번호의 일의 자리(0~9) 출현 빈도
      </p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <XAxis dataKey="digit" tick={{ fontSize: 12, fill: "var(--color-muted)" }} />
            <YAxis width={35} tick={{ fontSize: 10, fill: "var(--color-muted)" }} />
            <Tooltip
              formatter={(value) => [`${value}회`, "출현"]}
              labelFormatter={(label) => `끝수 ${label}`}
              contentStyle={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-card-border)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="freq" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.digit}
                  fill={DIGIT_COLORS[entry.digit]}
                  opacity={entry.freq === maxFreq ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4">
        {data.map((d) => (
          <div
            key={d.digit}
            className="text-center p-1.5 rounded-lg bg-[var(--color-surface)]"
          >
            <div
              className="text-sm font-bold"
              style={{ color: DIGIT_COLORS[d.digit] }}
            >
              {d.digit}
            </div>
            <div className="text-[10px] text-[var(--color-muted)]">
              {d.pct}%
            </div>
            <div className="text-[10px] text-[var(--color-muted-light)]">
              최근 {d.recent}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
