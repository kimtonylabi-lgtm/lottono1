import { Draw, NumberStats, AnalysisResult } from "./types";

const TOTAL_NUMBERS = 45;
const RECENT_ROUNDS = 50;

export function analyze(draws: Draw[]): AnalysisResult {
  const sorted = [...draws].sort((a, b) => a.round - b.round);
  const latestRound = sorted[sorted.length - 1]?.round ?? 0;
  const recentDraws = sorted.slice(-RECENT_ROUNDS);

  // 1. Frequency analysis
  const freq = new Array(TOTAL_NUMBERS + 1).fill(0);
  const recentFreq = new Array(TOTAL_NUMBERS + 1).fill(0);
  const lastAppeared = new Array(TOTAL_NUMBERS + 1).fill(0);

  for (const draw of sorted) {
    for (const n of draw.numbers) {
      freq[n]++;
      lastAppeared[n] = draw.round;
    }
  }

  for (const draw of recentDraws) {
    for (const n of draw.numbers) {
      recentFreq[n]++;
    }
  }

  // Build number stats
  const numberStats: NumberStats[] = [];
  for (let n = 1; n <= TOTAL_NUMBERS; n++) {
    numberStats.push({
      number: n,
      frequency: freq[n],
      recentFrequency: recentFreq[n],
      lastAppeared: lastAppeared[n],
      coldStreak: latestRound - lastAppeared[n],
      score: 0,
    });
  }

  // 2. Odd/Even ratio from all draws
  let totalOdd = 0;
  let totalEven = 0;
  for (const draw of sorted) {
    for (const n of draw.numbers) {
      if (n % 2 === 1) totalOdd++;
      else totalEven++;
    }
  }
  const totalPicks = sorted.length * 6;

  // 3. High/Low ratio (1-22: low, 23-45: high)
  let totalHigh = 0;
  let totalLow = 0;
  for (const draw of sorted) {
    for (const n of draw.numbers) {
      if (n <= 22) totalLow++;
      else totalHigh++;
    }
  }

  // 4. Range distribution (1-10, 11-20, 21-30, 31-40, 41-45)
  const ranges: Record<string, number> = {
    "1-10": 0,
    "11-20": 0,
    "21-30": 0,
    "31-40": 0,
    "41-45": 0,
  };
  for (const draw of sorted) {
    for (const n of draw.numbers) {
      if (n <= 10) ranges["1-10"]++;
      else if (n <= 20) ranges["11-20"]++;
      else if (n <= 30) ranges["21-30"]++;
      else if (n <= 40) ranges["31-40"]++;
      else ranges["41-45"]++;
    }
  }

  // 5. Consecutive number rate
  let drawsWithConsecutive = 0;
  for (const draw of sorted) {
    const nums = [...draw.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i + 1] - nums[i] === 1) {
        drawsWithConsecutive++;
        break;
      }
    }
  }

  return {
    numberStats,
    oddEvenRatio: {
      odd: totalOdd / totalPicks,
      even: totalEven / totalPicks,
    },
    highLowRatio: {
      high: totalHigh / totalPicks,
      low: totalLow / totalPicks,
    },
    rangeDistribution: ranges,
    consecutiveRate: drawsWithConsecutive / sorted.length,
    totalDraws: sorted.length,
    latestRound,
    analyzedAt: new Date().toISOString(),
  };
}
