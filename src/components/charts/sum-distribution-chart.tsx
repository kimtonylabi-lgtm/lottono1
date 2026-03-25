"use client";

import { SumAnalysis } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SumDistributionChartProps {
  sumAnalysis: SumAnalysis;
}

export default function SumDistributionChart({ sumAnalysis }: SumDistributionChartProps) {
  const data = Object.entries(sumAnalysis.sumDistribution)
    .map(([range, count]) => ({ range, count }))
    .sort((a, b) => {
      const aStart = parseInt(a.range.split("-")[0]);
      const bStart = parseInt(b.range.split("-")[0]);
      return aStart - bStart;
    });

  return (
    <div className="bg-[var(--color-card)] rounded-2xl shadow-lg p-6 border border-[var(--color-card-border)] animate-slide-up">
      <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-2">
        합계 분포
      </h2>
      <p className="text-xs text-[var(--color-muted)] mb-4">
        평균 합계: {sumAnalysis.averageSum} | 최빈 구간: {sumAnalysis.mostFrequentRange}
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="range" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 10 }} width={35} />
            <Tooltip
              formatter={(value) => [`${value}회`, "출현"]}
              labelFormatter={(label) => `합계 ${label}`}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.range}
                  fill={entry.range === sumAnalysis.mostFrequentRange ? "#8b5cf6" : "#a78bfa"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
