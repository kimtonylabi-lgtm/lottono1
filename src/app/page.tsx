import { loadCache } from "@/lib/crawler";
import { recommend } from "@/lib/recommender";
import type { ExtendedAnalysis } from "@/lib/types";
import RecommendationCard from "@/components/recommendation-card";
import StatsSummary from "@/components/stats-summary";
import HotColdTable from "@/components/hot-cold-table";
import BonusAnalysis from "@/components/bonus-analysis";
import GapAnalysisTable from "@/components/gap-analysis-table";
import FrequencyChart from "@/components/charts/frequency-chart";
import SumDistributionChart from "@/components/charts/sum-distribution-chart";
import CoOccurrenceChart from "@/components/charts/co-occurrence-chart";
import CrawlButton from "@/components/crawl-button";
import MainContent from "@/components/main-content";
import ThemeToggle from "@/components/theme-toggle";

export const revalidate = 3600;

export default async function Home() {
  let cache;

  try {
    cache = await loadCache();
  } catch {
    cache = null;
  }

  if (!cache) {
    return (
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-foreground)] mb-4">
            로또 분석기
          </h1>
          <p className="text-[var(--color-muted)] mb-6">
            데이터가 없습니다. 아래 버튼으로 크롤링을 시작하세요.
          </p>
          <CrawlButton lastRound={0} />
        </div>
      </main>
    );
  }

  const { analysis, lastUpdated } = cache;
  const ext = "bonusStats" in analysis ? (analysis as ExtendedAnalysis) : null;
  const recommendation = recommend(analysis);

  return (
    <main className="flex-1 p-4 max-w-lg mx-auto w-full space-y-4 pb-8">
      <header className="flex items-center justify-between pt-2 pb-2">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">로또 분석기</h1>
          <p className="text-xs text-[var(--color-muted-light)]">
            {analysis.latestRound}회차 기준 | {new Date(lastUpdated).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <ThemeToggle />
      </header>

      <MainContent
        recommendTab={
          <RecommendationCard initial={recommendation} />
        }
        analysisTab={
          <>
            <StatsSummary key="stats" analysis={analysis} />
            <HotColdTable key="hotcold" stats={analysis.numberStats} />
            {ext && (
              <div key="bonus-gap" className="grid grid-cols-2 gap-4">
                <BonusAnalysis stats={ext.bonusStats} latestRound={analysis.latestRound} />
                <GapAnalysisTable gaps={ext.gapAnalysis} />
              </div>
            )}
          </>
        }
        chartsTab={
          <>
            <FrequencyChart key="freq" stats={analysis.numberStats} />
            {ext && <SumDistributionChart key="sum" sumAnalysis={ext.sumAnalysis} />}
            {ext && <CoOccurrenceChart key="cooc" pairs={ext.topCoOccurrences} />}
          </>
        }
        footer={
          <CrawlButton lastRound={analysis.latestRound} />
        }
      />
    </main>
  );
}
