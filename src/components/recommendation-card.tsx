"use client";

import { useState } from "react";
import { Recommendation } from "@/lib/types";
import LottoBall from "./lotto-ball";

interface RecommendationCardProps {
  initial: Recommendation;
}

export default function RecommendationCard({
  initial,
}: RecommendationCardProps) {
  const [rec, setRec] = useState<Recommendation>(initial);
  const [loading, setLoading] = useState(false);

  const { numbers, reasons, basedOnRound, generatedAt } = rec;

  async function handleRefresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/recommend");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRec(data);
    } catch {
      // keep current
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-gray-800">AI 추천 번호</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="text-sm text-blue-500 font-semibold hover:text-blue-600 active:scale-95 transition disabled:opacity-50"
        >
          {loading ? "분석 중..." : "새 번호 받기"}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {basedOnRound}회차 기준 분석
      </p>

      <div className="flex justify-center gap-3 mb-6">
        {numbers.map((n) => (
          <LottoBall key={n} number={n} size="lg" />
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-600">선정 근거</h3>
        {numbers.map((n) => (
          <div key={n} className="flex items-center gap-2 text-sm">
            <LottoBall number={n} size="sm" />
            <span className="text-gray-600">{reasons[n]}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-right">
        {new Date(generatedAt).toLocaleString("ko-KR")}
      </p>
    </div>
  );
}
