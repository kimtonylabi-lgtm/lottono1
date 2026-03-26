import { AnalysisResult, ExtendedAnalysis, Recommendation, Strategy } from "./types";
import { seededRandom } from "./seeded-random";

export interface RecommendOptions {
  strategy?: Strategy;
  count?: number;
  seed?: number;
  previousNumbers?: number[];
}

const WEIGHTS: Record<Strategy, { freq: number; recent: number; cold: number; range: number; random: number }> = {
  balanced: { freq: 25, recent: 30, cold: 20, range: 15, random: 10 },
  aggressive: { freq: 15, recent: 45, cold: 10, range: 15, random: 15 },
  conservative: { freq: 30, recent: 20, cold: 25, range: 20, random: 5 },
};

export function recommend(
  analysis: AnalysisResult | ExtendedAnalysis,
  options: RecommendOptions = {}
): Recommendation {
  const { strategy = "balanced", seed } = options;
  const w = WEIGHTS[strategy];
  const rng = seededRandom(seed ?? Date.now());
  const { numberStats } = analysis;

  // Check if extended analysis is available
  const extended = "gapAnalysis" in analysis ? (analysis as ExtendedAnalysis) : null;

  // Pre-compute max values once
  const maxFreq = Math.max(...numberStats.map((s) => s.frequency));
  const maxRecent = Math.max(...numberStats.map((s) => s.recentFrequency));
  const maxCold = Math.max(...numberStats.map((s) => s.coldStreak));

  const scored = numberStats.map((stat) => {
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Overall frequency
    const freqScore = (stat.frequency / maxFreq) * w.freq;
    score += freqScore;
    if (freqScore > w.freq * 0.8) reasons.push(`출현 ${stat.frequency}회 (상위)`);

    // Factor 2: Recent trend
    const recentScore = maxRecent > 0 ? (stat.recentFrequency / maxRecent) * w.recent : 0;
    score += recentScore;
    if (recentScore > w.recent * 0.8) reasons.push(`최근 50회 중 ${stat.recentFrequency}회`);

    // Factor 3: Cold streak bonus
    const coldScore = maxCold > 0 ? (stat.coldStreak / maxCold) * w.cold : 0;
    score += coldScore;
    if (coldScore > w.cold * 0.75) reasons.push(`${stat.coldStreak}회차 미출현`);

    // Factor 4: Range distribution balance
    const range = getRange(stat.number);
    const rangeCount = analysis.rangeDistribution[range] || 0;
    const totalPicks = analysis.totalDraws * 6;
    const expectedRatio = range === "41-45" ? 5 / 45 : 10 / 45;
    const actualRatio = rangeCount / totalPicks;
    const rangeScore = (actualRatio / expectedRatio) * w.range;
    score += Math.min(rangeScore, w.range);

    // Factor 5: Gap analysis bonus (if extended data available)
    if (extended) {
      const gap = extended.gapAnalysis.find((g) => g.number === stat.number);
      if (gap && gap.averageGap > 0 && gap.currentGap > gap.averageGap * 1.3) {
        const gapBonus = Math.min((gap.currentGap / gap.averageGap - 1) * 5, 8);
        score += gapBonus;
        if (gapBonus > 3) reasons.push(`갭 ${gap.currentGap}/${gap.averageGap}`);
      }
    }

    // Factor 6: Seeded randomness
    score += rng() * w.random;

    return { ...stat, score, reasons };
  });

  // Apply penalty for previously recommended numbers
  if (options.previousNumbers && options.previousNumbers.length > 0) {
    const penaltySet = new Set(options.previousNumbers);
    for (const s of scored) {
      if (penaltySet.has(s.number)) {
        s.score *= 0.4;
        s.reasons.push("중복 회피 감점");
      }
    }
  }

  // Weighted probability sampling instead of top-6 selection
  const selected: typeof scored = [];
  const pool = [...scored];

  while (selected.length < 6 && pool.length > 0) {
    // Filter candidates that pass constraints
    const viable = pool.filter((candidate) => {
      const currentOdd = selected.filter((s) => s.number % 2 === 1).length;
      const currentEven = selected.filter((s) => s.number % 2 === 0).length;
      const isOdd = candidate.number % 2 === 1;
      if (isOdd && currentOdd >= 4) return false;
      if (!isOdd && currentEven >= 4) return false;

      const currentLow = selected.filter((s) => s.number <= 22).length;
      const currentHigh = selected.filter((s) => s.number > 22).length;
      if (candidate.number <= 22 && currentLow >= 4) return false;
      if (candidate.number > 22 && currentHigh >= 4) return false;

      const candidateRange = getRange(candidate.number);
      const sameRange = selected.filter((s) => getRange(s.number) === candidateRange).length;
      if (sameRange >= 2) return false;

      if (selected.length === 5) {
        const currentSum = selected.reduce((s, v) => s + v.number, 0) + candidate.number;
        if (currentSum < 80 || currentSum > 200) return false;
      }

      return true;
    });

    if (viable.length === 0) break;

    // Convert scores to probabilities and sample
    const minScore = Math.min(...viable.map((v) => v.score));
    const shifted = viable.map((v) => ({ ...v, weight: Math.max(v.score - minScore + 1, 0.1) }));
    const totalWeight = shifted.reduce((sum, v) => sum + v.weight, 0);

    let roll = rng() * totalWeight;
    let picked = shifted[0];
    for (const candidate of shifted) {
      roll -= candidate.weight;
      if (roll <= 0) {
        picked = candidate;
        break;
      }
    }

    selected.push(picked);
    const pickedIdx = pool.findIndex((p) => p.number === picked.number);
    if (pickedIdx >= 0) pool.splice(pickedIdx, 1);
  }

  // Fallback fill
  if (selected.length < 6) {
    for (const candidate of pool) {
      if (selected.length >= 6) break;
      selected.push(candidate);
    }
  }

  const numbers = selected.map((s) => s.number).sort((a, b) => a - b);
  const sumTotal = numbers.reduce((s, n) => s + n, 0);
  const reasons: Record<number, string> = {};
  for (const s of selected) {
    reasons[s.number] = s.reasons.length > 0 ? s.reasons.join(", ") : "균형 선정";
  }

  // Add co-occurrence info for selected numbers
  if (extended) {
    for (const num of numbers) {
      const coMatches = extended.topCoOccurrences.filter(
        (c) => (c.pair[0] === num || c.pair[1] === num) && numbers.includes(c.pair[0]) && numbers.includes(c.pair[1])
      );
      if (coMatches.length > 0) {
        const partner = coMatches[0].pair[0] === num ? coMatches[0].pair[1] : coMatches[0].pair[0];
        const existing = reasons[num];
        reasons[num] = existing !== "균형 선정"
          ? `${existing}, ${partner}번과 동시출현 ${coMatches[0].count}회`
          : `${partner}번과 동시출현 ${coMatches[0].count}회`;
      }
    }
  }

  return {
    numbers,
    reasons,
    strategy,
    sumTotal,
    basedOnRound: analysis.latestRound,
    generatedAt: new Date().toISOString(),
  };
}

export function recommendMultiple(
  analysis: AnalysisResult | ExtendedAnalysis,
  options: RecommendOptions = {}
): Recommendation[] {
  const count = Math.min(options.count || 1, 5);
  const baseSeed = options.seed ?? Date.now();
  const results: Recommendation[] = [];
  const usedNumbers: number[] = [];

  for (let i = 0; i < count; i++) {
    const rec = recommend(analysis, {
      ...options,
      seed: baseSeed + i * 7919,
      previousNumbers: usedNumbers,
    });
    results.push(rec);
    usedNumbers.push(...rec.numbers);
  }

  return results;
}

function getRange(n: number): string {
  if (n <= 10) return "1-10";
  if (n <= 20) return "11-20";
  if (n <= 30) return "21-30";
  if (n <= 40) return "31-40";
  return "41-45";
}
