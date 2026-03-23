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

export interface Recommendation {
  numbers: number[];
  reasons: Record<number, string>;
  basedOnRound: number;
  generatedAt: string;
}
