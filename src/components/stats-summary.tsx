import { AnalysisResult } from "@/lib/types";

interface StatsSummaryProps {
  analysis: AnalysisResult;
}

export default function StatsSummary({ analysis }: StatsSummaryProps) {
  const {
    totalDraws,
    latestRound,
    oddEvenRatio,
    highLowRatio,
    consecutiveRate,
  } = analysis;

  const stats = [
    {
      label: "총 회차",
      value: `${totalDraws}회`,
    },
    {
      label: "홀짝 비율",
      value: `${(oddEvenRatio.odd * 100).toFixed(1)}% : ${(oddEvenRatio.even * 100).toFixed(1)}%`,
    },
    {
      label: "고저 비율",
      value: `${(highLowRatio.low * 100).toFixed(1)}% : ${(highLowRatio.high * 100).toFixed(1)}%`,
    },
    {
      label: "연번 포함률",
      value: `${(consecutiveRate * 100).toFixed(1)}%`,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        분석 요약
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-sm font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
