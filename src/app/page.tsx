import { loadDraws, getLastRound } from "@/lib/crawler";
import { analyze } from "@/lib/analyzer";
import { recommend } from "@/lib/recommender";
import RecommendationCard from "@/components/recommendation-card";
import StatsSummary from "@/components/stats-summary";
import HotColdTable from "@/components/hot-cold-table";
import FrequencyChart from "@/components/charts/frequency-chart";
import CrawlButton from "@/components/crawl-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  let draws: Awaited<ReturnType<typeof loadDraws>>;
  let lastRound: number;

  try {
    draws = await loadDraws();
    lastRound = draws.length > 0
      ? draws[draws.length - 1].round
      : 0;
  } catch {
    draws = [];
    lastRound = 0;
  }

  if (draws.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Lotto Analyzer
          </h1>
          <p className="text-gray-500 mb-6">
            데이터가 없습니다. 아래 버튼으로 크롤링을 시작하세요.
          </p>
          <CrawlButton lastRound={0} />
        </div>
      </main>
    );
  }

  const analysis = analyze(draws);
  const recommendation = recommend(analysis);

  return (
    <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4 pb-8">
      <header className="text-center pt-2 pb-2">
        <h1 className="text-xl font-bold text-gray-800">Lotto Analyzer</h1>
        <p className="text-xs text-gray-400">{lastRound}회차 기준</p>
      </header>

      <RecommendationCard initial={recommendation} />
      <StatsSummary analysis={analysis} />
      <HotColdTable stats={analysis.numberStats} />
      <FrequencyChart stats={analysis.numberStats} />

      <div className="pt-4">
        <CrawlButton lastRound={lastRound} />
      </div>
    </main>
  );
}
