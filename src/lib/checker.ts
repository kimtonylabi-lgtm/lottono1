import { Draw, MatchResult } from "./types";

export interface CheckSummary {
  total: number;
  rank1: number;
  rank2: number;
  rank3: number;
  rank4: number;
  rank5: number;
}

export interface CheckResult {
  results: MatchResult[];
  summary: CheckSummary;
}

function getRank(matchCount: number, matchedBonus: boolean): 1 | 2 | 3 | 4 | 5 | null {
  if (matchCount === 6) return 1;
  if (matchCount === 5 && matchedBonus) return 2;
  if (matchCount === 5) return 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return null;
}

export function checkNumbers(myNumbers: number[], draws: Draw[]): CheckResult {
  const mySet = new Set(myNumbers);
  const results: MatchResult[] = [];
  const summary: CheckSummary = { total: draws.length, rank1: 0, rank2: 0, rank3: 0, rank4: 0, rank5: 0 };

  for (const draw of draws) {
    const matchedNumbers = draw.numbers.filter((n) => mySet.has(n));
    const matchCount = matchedNumbers.length;
    const unmatchedMine = myNumbers.filter((n) => !draw.numbers.includes(n));
    const matchedBonus = unmatchedMine.includes(draw.bonus);
    const rank = getRank(matchCount, matchedBonus);

    if (rank !== null) {
      results.push({
        round: draw.round,
        date: draw.date,
        drawNumbers: draw.numbers,
        bonus: draw.bonus,
        matchedNumbers,
        matchedBonus,
        matchCount,
        rank,
      });

      if (rank === 1) summary.rank1++;
      else if (rank === 2) summary.rank2++;
      else if (rank === 3) summary.rank3++;
      else if (rank === 4) summary.rank4++;
      else if (rank === 5) summary.rank5++;
    }
  }

  results.sort((a, b) => b.round - a.round);
  return { results, summary };
}
