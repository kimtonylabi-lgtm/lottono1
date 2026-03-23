import { AnalysisResult, Recommendation } from "./types";

const TOTAL_NUMBERS = 45;

export function recommend(analysis: AnalysisResult): Recommendation {
  const { numberStats, oddEvenRatio, consecutiveRate } = analysis;

  // Score each number based on multiple factors
  const scored = numberStats.map((stat) => {
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Overall frequency (normalized, weight: 25%)
    const maxFreq = Math.max(...numberStats.map((s) => s.frequency));
    const freqScore = (stat.frequency / maxFreq) * 25;
    score += freqScore;
    if (freqScore > 20) reasons.push("high frequency");

    // Factor 2: Recent trend (weight: 30%)
    const maxRecent = Math.max(...numberStats.map((s) => s.recentFrequency));
    const recentScore = maxRecent > 0 ? (stat.recentFrequency / maxRecent) * 30 : 0;
    score += recentScore;
    if (recentScore > 24) reasons.push("hot trend");

    // Factor 3: Cold streak bonus — numbers due to appear (weight: 20%)
    const maxCold = Math.max(...numberStats.map((s) => s.coldStreak));
    const coldScore = maxCold > 0 ? (stat.coldStreak / maxCold) * 20 : 0;
    score += coldScore;
    if (coldScore > 15) reasons.push("overdue");

    // Factor 4: Balanced range distribution (weight: 15%)
    const range = getRange(stat.number);
    const rangeCount = analysis.rangeDistribution[range] || 0;
    const totalPicks = analysis.totalDraws * 6;
    const expectedRatio = range === "41-45" ? 5 / 45 : 10 / 45;
    const actualRatio = rangeCount / totalPicks;
    const rangeScore = (actualRatio / expectedRatio) * 15;
    score += Math.min(rangeScore, 15);

    // Factor 5: Small randomness to avoid always same result (weight: 10%)
    score += Math.random() * 10;

    return {
      ...stat,
      score,
      reasons,
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Select 6 numbers with constraints
  const selected: typeof scored = [];
  const candidates = [...scored];

  for (const candidate of candidates) {
    if (selected.length >= 6) break;

    // Check odd/even balance (target: ~3:3 based on historical data)
    const currentOdd = selected.filter((s) => s.number % 2 === 1).length;
    const currentEven = selected.filter((s) => s.number % 2 === 0).length;
    const isOdd = candidate.number % 2 === 1;

    if (isOdd && currentOdd >= 4) continue;
    if (!isOdd && currentEven >= 4) continue;

    // Check high/low balance (1-22 low, 23-45 high, target: ~3:3)
    const currentLow = selected.filter((s) => s.number <= 22).length;
    const currentHigh = selected.filter((s) => s.number > 22).length;
    const isLow = candidate.number <= 22;

    if (isLow && currentLow >= 4) continue;
    if (!isLow && currentHigh >= 4) continue;

    // Check range distribution (no more than 2 from same range)
    const candidateRange = getRange(candidate.number);
    const sameRange = selected.filter(
      (s) => getRange(s.number) === candidateRange
    ).length;
    if (sameRange >= 2) continue;

    selected.push(candidate);
  }

  // If we don't have 6 yet (unlikely), fill from remaining
  if (selected.length < 6) {
    for (const candidate of candidates) {
      if (selected.length >= 6) break;
      if (!selected.find((s) => s.number === candidate.number)) {
        selected.push(candidate);
      }
    }
  }

  const numbers = selected.map((s) => s.number).sort((a, b) => a - b);
  const reasons: Record<number, string> = {};
  for (const s of selected) {
    const reasonText =
      s.reasons.length > 0 ? s.reasons.join(", ") : "balanced pick";
    reasons[s.number] = reasonText;
  }

  return {
    numbers,
    reasons,
    basedOnRound: analysis.latestRound,
    generatedAt: new Date().toISOString(),
  };
}

function getRange(n: number): string {
  if (n <= 10) return "1-10";
  if (n <= 20) return "11-20";
  if (n <= 30) return "21-30";
  if (n <= 40) return "31-40";
  return "41-45";
}
