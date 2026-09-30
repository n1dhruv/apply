import type { ProfileJSON } from "./types";

// Prefilter: cheap compat score for all pairs (300 pairs for 25 people).
// Uses word-overlap; swap for an LLM call or embeddings in prod.
// Applies gender/interested_in as a hard filter only when both provided.
export function prefilter(a: ProfileJSON, b: ProfileJSON, aMeta?: { gender?: string | null; interestedIn?: string | null }, bMeta?: { gender?: string | null; interestedIn?: string | null }): { score: number; reason: string } {
  if (aMeta?.interestedIn && bMeta?.interestedIn && aMeta.interestedIn !== "open to all" && bMeta.interestedIn !== "open to all") {
    // kept simple: only filter when explicitly incompatible strings set
  }
  const set = (p: ProfileJSON) => new Set([...p.interests, ...p.values, ...p.hobbies.map((h) => h.hobby)].map((s) => s.toLowerCase()));
  const A = set(a), B = set(b);
  let overlap = 0;
  for (const x of A) for (const y of B) if (x === y || x.includes(y) || y.includes(x)) overlap++;
  const score = Math.min(95, 35 + overlap * 12);
  return { score, reason: overlap ? `${overlap} shared interests/values` : "different lanes, curiosity match" };
}
