import type { RankingRecord } from "./types";

// final = 0.45*mean(both judge scores) + 0.35*mutual_min + 0.20*prefilter
// Undated candidates rank below dated ones by prefilter score.
export function rankForPerson(
  personId: string,
  candidates: { otherId: string; prefilter: number; scoreA?: number; scoreB?: number; dateId?: string; reason?: string }[]
): RankingRecord[] {
  const withDates = candidates.filter((c) => c.scoreA !== undefined);
  const without = candidates.filter((c) => c.scoreA === undefined);
  const scored = withDates.map((c) => {
    const mean = ((c.scoreA ?? 0) + (c.scoreB ?? c.scoreA ?? 0)) / 2;
    const mutualMin = Math.min(c.scoreA ?? 0, c.scoreB ?? c.scoreA ?? 0);
    const finalScore = Math.round(0.45 * mean + 0.35 * mutualMin + 0.2 * c.prefilter);
    return { personId, otherId: c.otherId, finalScore, why: c.reason ?? "Date scores + shared interests", dateId: c.dateId, rank: 0 };
  }).sort((x, y) => y.finalScore - x.finalScore);
  const rest = without.sort((x, y) => y.prefilter - x.prefilter).map((c) => ({
    personId, otherId: c.otherId, finalScore: Math.round(c.prefilter * 0.5),
    why: `Not dated yet — prefilter: ${c.prefilter}`, dateId: undefined as string | undefined, rank: 0,
  }));
  return [...scored, ...rest].map((r, i) => ({ ...r, rank: i + 1 }));
}
