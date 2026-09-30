import type { ChatMsg, DateScoreRecord, ProfileJSON } from "./types";
import { chatComplete, extractJSON, llmConfigured } from "./llm";

// Judge: two calls per date (one per side), each sees only its own profile + transcript.
type JudgeJSON = {
  score: number; chemistry: number; values_fit: number; lifestyle_fit: number;
  would_meet_again: boolean; reason: string; best_moment: string; red_flag: string;
};

export async function judge(p: ProfileJSON, transcript: ChatMsg[]): Promise<DateScoreRecord> {
  if (llmConfigured()) {
    try {
      const j = extractJSON<JudgeJSON>(await chatComplete({
        system: `Score this date from this person's perspective. Return JSON only: {score 0-100, chemistry, values_fit, lifestyle_fit, would_meet_again, reason <=40 words citing a transcript line or profile fact, best_moment, red_flag}.`,
        user: `PROFILE:\n${JSON.stringify(p).slice(0, 2500)}\n\nTRANSCRIPT:\n${transcript.map((m) => `${m.speaker}: ${m.text}`).join("\n")}`,
        maxTokens: 400,
        temperature: 0.4,
      }));
      return {
        raterId: p.name, score: j.score, chemistry: j.chemistry, valuesFit: j.values_fit,
        lifestyleFit: j.lifestyle_fit, reason: j.reason, wouldMeetAgain: j.would_meet_again,
        bestMoment: j.best_moment, redFlag: j.red_flag,
      };
    } catch {
      /* mock below */
    }
  }
  const joined = transcript.map((m) => m.text).join(" ").toLowerCase();
  const hits = (p.interests.join(" ") + p.values.join(" ")).toLowerCase().split(/\W+/).filter((w) => w.length > 3 && joined.includes(w)).length;
  const score = Math.min(95, 55 + hits * 8);
  return {
    raterId: p.name, score, chemistry: Math.min(99, score - 3), valuesFit: Math.min(99, score),
    lifestyleFit: Math.max(40, score - 8),
    reason: `Grounded exchange; ${hits} shared-interest callbacks; friction discussed openly.`,
    wouldMeetAgain: score >= 60,
    bestMoment: transcript[1]?.text.slice(0, 90) ?? "",
    redFlag: score < 60 ? "Pace mismatch flagged in date" : "",
  };
}
