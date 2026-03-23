"use client";

import { NumberStats } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FrequencyChartProps {
  stats: NumberStats[];
}

function getBallHex(n: number): string {
  if (n <= 10) return "#facc15";
  if (n <= 20) return "#3b82f6";
  if (n <= 30) return "#ef4444";
  if (n <= 40) return "#6b7280";
  return "#22c55e";
}

export default function FrequencyChart({ stats }: FrequencyChartProps) {
  const data = stats
    .sort((a, b) => a.number - b.number)
    .map((s) => ({
      num: s.number,
      freq: s.frequency,
    }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        번호별 출현 빈도
      </h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="num"
              tick={{ fontSize: 10 }}
              interval={4}
            />
            <YAxis tick={{ fontSize: 10 }} width={35} />
            <Tooltip
              formatter={(value) => [`${value}회`, "출현"]}
              labelFormatter={(label) => `번호 ${label}`}
            />
            <Bar dataKey="freq" radius={[2, 2, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.num}`}
                  fill={getBallHex(entry.num)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
