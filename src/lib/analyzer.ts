import {
  Draw,
  NumberStats,
  AnalysisResult,
  ExtendedAnalysis,
  BonusStats,
  GapAnalysis,
  SumAnalysis,
  CoOccurrence,
  ConsecutivePairStats,
  EndingDigitStats,
  DrawPatternStats,
} from "./types";

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

export function analyzeExtended(draws: Draw[]): ExtendedAnalysis {
  const base = analyze(draws);
  const sorted = [...draws].sort((a, b) => a.round - b.round);
  const latestRound = base.latestRound;

  // Bonus number analysis
  const bonusFreq = new Array(TOTAL_NUMBERS + 1).fill(0);
  const lastBonusAppeared = new Array(TOTAL_NUMBERS + 1).fill(0);
  for (const draw of sorted) {
    bonusFreq[draw.bonus]++;
    lastBonusAppeared[draw.bonus] = draw.round;
  }
  const bonusStats: BonusStats[] = [];
  for (let n = 1; n <= TOTAL_NUMBERS; n++) {
    bonusStats.push({
      number: n,
      bonusFrequency: bonusFreq[n],
      lastBonusAppeared: lastBonusAppeared[n],
    });
  }

  // Gap analysis — track intervals between appearances for each number
  const appearances: number[][] = Array.from({ length: TOTAL_NUMBERS + 1 }, () => []);
  for (const draw of sorted) {
    for (const n of draw.numbers) {
      appearances[n].push(draw.round);
    }
  }
  const gapAnalysis: GapAnalysis[] = [];
  for (let n = 1; n <= TOTAL_NUMBERS; n++) {
    const apps = appearances[n];
    if (apps.length < 2) {
      gapAnalysis.push({
        number: n,
        averageGap: 0,
        currentGap: latestRound - (apps[0] ?? 0),
        maxGap: 0,
        minGap: 0,
        gapTrend: "stable",
      });
      continue;
    }
    const gaps: number[] = [];
    for (let i = 1; i < apps.length; i++) {
      gaps.push(apps[i] - apps[i - 1]);
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const currentGap = latestRound - apps[apps.length - 1];

    // Trend: compare last 5 gaps vs previous 5
    let trend: "increasing" | "decreasing" | "stable" = "stable";
    if (gaps.length >= 10) {
      const recent5 = gaps.slice(-5).reduce((s, g) => s + g, 0) / 5;
      const prev5 = gaps.slice(-10, -5).reduce((s, g) => s + g, 0) / 5;
      if (recent5 > prev5 * 1.2) trend = "increasing";
      else if (recent5 < prev5 * 0.8) trend = "decreasing";
    }

    gapAnalysis.push({
      number: n,
      averageGap: Math.round(avgGap * 10) / 10,
      currentGap,
      maxGap: Math.max(...gaps),
      minGap: Math.min(...gaps),
      gapTrend: trend,
    });
  }

  // Sum analysis — sum of 6 numbers per draw
  const sums = sorted.map((d) => d.numbers.reduce((s, n) => s + n, 0));
  const sumDist: Record<string, number> = {};
  for (const sum of sums) {
    const rangeStart = Math.floor(sum / 20) * 20 + 1;
    const rangeEnd = rangeStart + 19;
    const key = `${rangeStart}-${rangeEnd}`;
    sumDist[key] = (sumDist[key] || 0) + 1;
  }
  let mostFreqRange = "";
  let mostFreqCount = 0;
  for (const [key, count] of Object.entries(sumDist)) {
    if (count > mostFreqCount) {
      mostFreqCount = count;
      mostFreqRange = key;
    }
  }
  const sumAnalysis: SumAnalysis = {
    averageSum: Math.round(sums.reduce((s, v) => s + v, 0) / sums.length),
    minSum: Math.min(...sums),
    maxSum: Math.max(...sums),
    mostFrequentRange: mostFreqRange,
    sumDistribution: sumDist,
  };

  // Co-occurrence analysis — count pairs appearing together
  const pairCounts = new Map<string, number>();
  for (const draw of sorted) {
    const nums = draw.numbers;
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const a = Math.min(nums[i], nums[j]);
        const b = Math.max(nums[i], nums[j]);
        const key = `${a}-${b}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  }
  const topCoOccurrences: CoOccurrence[] = Array.from(pairCounts.entries())
    .map(([key, count]) => {
      const [a, b] = key.split("-").map(Number);
      return { pair: [a, b] as [number, number], count, probability: count / sorted.length };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Consecutive pair frequency
  const consecutiveMap = new Map<string, number>();
  for (const draw of sorted) {
    const nums = [...draw.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length - 1; i++) {
      if (nums[i + 1] - nums[i] === 1) {
        const key = `${nums[i]}-${nums[i + 1]}`;
        consecutiveMap.set(key, (consecutiveMap.get(key) || 0) + 1);
      }
    }
  }
  const consecutivePairs: ConsecutivePairStats[] = Array.from(consecutiveMap.entries())
    .map(([key, frequency]) => {
      const [a, b] = key.split("-").map(Number);
      return { pair: [a, b] as [number, number], frequency };
    })
    .sort((a, b) => b.frequency - a.frequency);

  // Ending digit analysis (0-9)
  const recentDraws = sorted.slice(-RECENT_ROUNDS);
  const digitFreq = new Array(10).fill(0);
  const digitRecentFreq = new Array(10).fill(0);
  const totalPicks = sorted.length * 6;

  for (const draw of sorted) {
    for (const n of draw.numbers) {
      digitFreq[n % 10]++;
    }
  }
  for (const draw of recentDraws) {
    for (const n of draw.numbers) {
      digitRecentFreq[n % 10]++;
    }
  }
  const endingDigitStats: EndingDigitStats[] = [];
  for (let d = 0; d < 10; d++) {
    endingDigitStats.push({
      digit: d,
      frequency: digitFreq[d],
      percentage: Math.round((digitFreq[d] / totalPicks) * 1000) / 10,
      recentFrequency: digitRecentFreq[d],
    });
  }

  // Range pattern analysis (e.g. "2-1-1-1-1")
  const patternMap = new Map<string, number>();
  for (const draw of sorted) {
    const counts = [0, 0, 0, 0, 0]; // 1-10, 11-20, 21-30, 31-40, 41-45
    for (const n of draw.numbers) {
      if (n <= 10) counts[0]++;
      else if (n <= 20) counts[1]++;
      else if (n <= 30) counts[2]++;
      else if (n <= 40) counts[3]++;
      else counts[4]++;
    }
    const pattern = counts.join("-");
    patternMap.set(pattern, (patternMap.get(pattern) || 0) + 1);
  }
  const drawPatternStats: DrawPatternStats[] = Array.from(patternMap.entries())
    .map(([rangePattern, frequency]) => ({
      rangePattern,
      frequency,
      percentage: Math.round((frequency / sorted.length) * 1000) / 10,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);

  return {
    ...base,
    bonusStats,
    gapAnalysis,
    sumAnalysis,
    topCoOccurrences,
    consecutivePairs,
    endingDigitStats,
    drawPatternStats,
  };
}
