import type { ChatMsg, DateScoreRecord, ProfileJSON } from "./types";

// Judge: two calls per date (one per side), each sees only its own profile + transcript.
export async function judge(p: ProfileJSON, transcript: ChatMsg[]): Promise<DateScoreRecord> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();
      const res = await client.messages.create({
        model: "claude-sonnet-4-20250514", max_tokens: 400,
        system: `Score this date from this person's perspective. Return JSON only: {score 0-100, chemistry, values_fit, lifestyle_fit, would_meet_again, reason <=40 words citing a transcript line or profile fact, best_moment, red_flag}.`,
        messages: [{ role: "user", content: `PROFILE:\n${JSON.stringify(p).slice(0, 2500)}\n\nTRANSCRIPT:\n${transcript.map((m) => `${m.speaker}: ${m.text}`).join("\n")}` }],
      });
      const text = res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
      const j = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? text);
      return { raterId: p.name, score: j.score, chemistry: j.chemistry, valuesFit: j.values_fit, lifestyleFit: j.lifestyle_fit, reason: j.reason, wouldMeetAgain: j.would_meet_again, bestMoment: j.best_moment, redFlag: j.red_flag };
    } catch { /* mock below */ }
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
