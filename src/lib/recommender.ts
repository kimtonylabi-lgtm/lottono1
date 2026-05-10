import { AnalysisResult, ExtendedAnalysis, Recommendation } from "./types";
import { seededRandom } from "./seeded-random";

export interface RecommendOptions {
  count?: number;
  seed?: number;
  previousNumbers?: number[];
  fixedNumbers?: number[];
}

const WEIGHTS = {
  freq: 25,
  recent: 30,
  cold: 20,
  range: 15,
  random: 10,
  bonus: 5,
  endingDigit: 5,
  coOccur: 8,
  pattern: 6,
};

const SUM_TOLERANCE = 35;
const SUM_HARD_MIN = 80;
const SUM_HARD_MAX = 200;

export function recommend(
  analysis: AnalysisResult | ExtendedAnalysis,
  options: RecommendOptions = {}
): Recommendation {
  const { seed } = options;
  const w = WEIGHTS;
  const rng = seededRandom(seed ?? Date.now());
  const { numberStats } = analysis;

  const extended = "gapAnalysis" in analysis ? (analysis as ExtendedAnalysis) : null;

  const maxFreq = Math.max(...numberStats.map((s) => s.frequency));
  const maxRecent = Math.max(...numberStats.map((s) => s.recentFrequency));
  const maxCold = Math.max(...numberStats.map((s) => s.coldStreak));

  // Bonus stats max (extended only)
  const maxBonus = extended
    ? Math.max(...extended.bonusStats.map((b) => b.bonusFrequency))
    : 0;

  // Ending digit stats max (extended only). digit -> frequency
  const maxDigitFreq = extended?.endingDigitStats
    ? Math.max(...extended.endingDigitStats.map((d) => d.frequency))
    : 0;

  // Top range patterns (top 5) for selection-time guidance
  const topPatterns = extended?.drawPatternStats
    ? extended.drawPatternStats
        .slice()
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)
        .map((p) => p.rangePattern)
    : [];

  // Co-occurrence map for fast lookup: number -> Map<partner, count>
  const coMap = new Map<number, Map<number, number>>();
  if (extended) {
    for (const c of extended.topCoOccurrences) {
      const [a, b] = c.pair;
      if (!coMap.has(a)) coMap.set(a, new Map());
      if (!coMap.has(b)) coMap.set(b, new Map());
      coMap.get(a)!.set(b, c.count);
      coMap.get(b)!.set(a, c.count);
    }
  }
  const maxCoCount = extended
    ? Math.max(0, ...extended.topCoOccurrences.map((c) => c.count))
    : 0;

  // Sum dynamic range based on sumAnalysis (extended only)
  const sumMin = extended
    ? Math.max(SUM_HARD_MIN, extended.sumAnalysis.averageSum - SUM_TOLERANCE)
    : SUM_HARD_MIN;
  const sumMax = extended
    ? Math.min(SUM_HARD_MAX, extended.sumAnalysis.averageSum + SUM_TOLERANCE)
    : SUM_HARD_MAX;

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

    // Factor 5: Gap analysis bonus
    if (extended) {
      const gap = extended.gapAnalysis.find((g) => g.number === stat.number);
      if (gap && gap.averageGap > 0 && gap.currentGap > gap.averageGap * 1.3) {
        const gapBonus = Math.min((gap.currentGap / gap.averageGap - 1) * 5, 8);
        score += gapBonus;
        if (gapBonus > 3) reasons.push(`갭 ${gap.currentGap}/${gap.averageGap}`);
      }
    }

    // Factor 6: Bonus number frequency
    if (extended && maxBonus > 0) {
      const bonus = extended.bonusStats.find((b) => b.number === stat.number);
      if (bonus) {
        const bonusScore = (bonus.bonusFrequency / maxBonus) * w.bonus;
        score += bonusScore;
        if (bonusScore > w.bonus * 0.75) {
          reasons.push(`보너스 ${bonus.bonusFrequency}회`);
        }
      }
    }

    // Factor 7: Ending digit frequency
    if (extended?.endingDigitStats && maxDigitFreq > 0) {
      const digit = stat.number % 10;
      const ds = extended.endingDigitStats.find((d) => d.digit === digit);
      if (ds) {
        const digitScore = (ds.frequency / maxDigitFreq) * w.endingDigit;
        score += digitScore;
      }
    }

    // Factor 8: Seeded randomness
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

  // Pre-seed with fixed numbers
  const selected: typeof scored = [];
  const pool = [...scored];

  if (options.fixedNumbers && options.fixedNumbers.length > 0) {
    const fixedSet = new Set(options.fixedNumbers.filter((n) => n >= 1 && n <= 45));
    for (const num of fixedSet) {
      const idx = pool.findIndex((s) => s.number === num);
      if (idx >= 0) {
        const entry = pool[idx];
        entry.reasons = ["고정번호"];
        selected.push(entry);
        pool.splice(idx, 1);
      }
    }
  }

  while (selected.length < 6 && pool.length > 0) {
    const remaining = 6 - selected.length;

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
        if (currentSum < sumMin || currentSum > sumMax) return false;
      }

      return true;
    });

    if (viable.length === 0) break;

    // Dynamic per-round bonus: co-occurrence + pattern
    const dynamicScored = viable.map((v) => {
      let dynBonus = 0;

      // Co-occurrence: sum of pair counts with already selected numbers
      if (extended && maxCoCount > 0 && selected.length > 0) {
        const partners = coMap.get(v.number);
        if (partners) {
          let coTotal = 0;
          for (const sel of selected) {
            const c = partners.get(sel.number);
            if (c) coTotal += c;
          }
          if (coTotal > 0) {
            const normalized = Math.min(coTotal / (maxCoCount * selected.length), 1);
            dynBonus += normalized * w.coOccur;
          }
        }
      }

      // Range pattern: would picking this candidate yield a top-pattern prefix?
      if (topPatterns.length > 0 && remaining > 0) {
        const counts = [0, 0, 0, 0, 0];
        for (const s of selected) counts[rangeIdx(s.number)]++;
        counts[rangeIdx(v.number)]++;
        const prefix = counts.join("-");
        // partial match: any top pattern that starts to align
        const matched = topPatterns.some((p) => couldYieldPattern(counts, p));
        if (matched) {
          dynBonus += w.pattern;
          // exact emerging match (final pick) gets the full bonus
          if (selected.length === 5 && topPatterns.includes(prefix)) {
            dynBonus += w.pattern * 0.5;
          }
        }
      }

      return { ...v, weight: Math.max(v.score + dynBonus, 0.1) };
    });

    const minScore = Math.min(...dynamicScored.map((v) => v.weight));
    const shifted = dynamicScored.map((v) => ({ ...v, weight: Math.max(v.weight - minScore + 1, 0.1) }));
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

function rangeIdx(n: number): number {
  if (n <= 10) return 0;
  if (n <= 20) return 1;
  if (n <= 30) return 2;
  if (n <= 40) return 3;
  return 4;
}

// Returns true if the current partial counts can still produce one of the
// top patterns by adding more picks (no bucket has already exceeded target).
function couldYieldPattern(currentCounts: number[], pattern: string): boolean {
  const target = pattern.split("-").map(Number);
  if (target.length !== 5) return false;
  for (let i = 0; i < 5; i++) {
    if (currentCounts[i] > target[i]) return false;
  }
  return true;
}
