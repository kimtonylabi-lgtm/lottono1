export interface Draw {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

export interface NumberStats {
  number: number;
  frequency: number;
  recentFrequency: number;
  lastAppeared: number;
  coldStreak: number;
  score: number;
}

export interface BonusStats {
  number: number;
  bonusFrequency: number;
  lastBonusAppeared: number;
}

export interface GapAnalysis {
  number: number;
  averageGap: number;
  currentGap: number;
  maxGap: number;
  minGap: number;
  gapTrend: "increasing" | "decreasing" | "stable";
}

export interface SumAnalysis {
  averageSum: number;
  minSum: number;
  maxSum: number;
  mostFrequentRange: string;
  sumDistribution: Record<string, number>;
}

export interface CoOccurrence {
  pair: [number, number];
  count: number;
  probability: number;
}

export interface ConsecutivePairStats {
  pair: [number, number];
  frequency: number;
}

export interface AnalysisResult {
  numberStats: NumberStats[];
  oddEvenRatio: { odd: number; even: number };
  highLowRatio: { high: number; low: number };
  rangeDistribution: Record<string, number>;
  consecutiveRate: number;
  totalDraws: number;
  latestRound: number;
  analyzedAt: string;
}

export interface EndingDigitStats {
  digit: number;
  frequency: number;
  percentage: number;
  recentFrequency: number;
}

export interface DrawPatternStats {
  rangePattern: string;
  frequency: number;
  percentage: number;
}

export interface MatchResult {
  round: number;
  date: string;
  drawNumbers: number[];
  bonus: number;
  matchedNumbers: number[];
  matchedBonus: boolean;
  matchCount: number;
  rank: 1 | 2 | 3 | 4 | 5 | null;
}

export interface ExtendedAnalysis extends AnalysisResult {
  bonusStats: BonusStats[];
  gapAnalysis: GapAnalysis[];
  sumAnalysis: SumAnalysis;
  topCoOccurrences: CoOccurrence[];
  consecutivePairs: ConsecutivePairStats[];
  endingDigitStats?: EndingDigitStats[];
  drawPatternStats?: DrawPatternStats[];
}

export type Strategy = "balanced" | "aggressive" | "conservative";

export interface Recommendation {
  numbers: number[];
  reasons: Record<number, string>;
  strategy: Strategy;
  sumTotal: number;
  basedOnRound: number;
  generatedAt: string;
}
