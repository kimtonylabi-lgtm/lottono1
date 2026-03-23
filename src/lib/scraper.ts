import { Draw } from "./types";

const BASE_URL = "https://www.lottoen.com/lotto645/lab/result";

function parseDrawsFromHtml(html: string): Draw[] {
  const draws: Draw[] = [];

  // Match each draw block
  const blockRegex =
    /<strong>(\d+)<\/strong>회차<\/span>\s*<span class="date">\(추첨일 ([\d.]+)\)<\/span>[\s\S]*?<div class="result_cont">([\s\S]*?)<\/div>/g;

  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    const round = parseInt(match[1]);
    const date = match[2].replace(/\./g, "-");
    const ballHtml = match[3];

    // Extract all ball numbers
    const ballRegex = /lotto_ball [^']*'>(\d+)<\/span>/g;
    const allBalls: number[] = [];
    let ballMatch;
    while ((ballMatch = ballRegex.exec(ballHtml)) !== null) {
      allBalls.push(parseInt(ballMatch[1]));
    }

    if (allBalls.length >= 7) {
      // First 6 are main numbers, last is bonus
      const numbers = allBalls.slice(0, 6).sort((a, b) => a - b);
      const bonus = allBalls[6];
      draws.push({ round, date, numbers, bonus });
    }
  }

  return draws;
}

export async function scrapeAllDraws(
  afterRound: number = 0
): Promise<Draw[]> {
  const allDraws: Draw[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${BASE_URL}?&p=${page}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) break;

    const html = await res.text();
    const draws = parseDrawsFromHtml(html);

    if (draws.length === 0) {
      hasMore = false;
      break;
    }

    // Check if we've gone past the rounds we need
    const minRound = Math.min(...draws.map((d) => d.round));

    for (const draw of draws) {
      if (draw.round > afterRound) {
        allDraws.push(draw);
      }
    }

    if (minRound <= afterRound + 1) {
      hasMore = false;
    } else {
      page++;
      // Rate limiting
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return allDraws.sort((a, b) => a.round - b.round);
}
