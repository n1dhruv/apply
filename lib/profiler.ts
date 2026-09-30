import type { ProfileJSON } from "./types";
import { chatComplete, extractJSON, llmConfigured } from "./llm";

// Profiler: LinkedIn + Instagram text → structured ProfileJSON.
// Uses LiteLLM proxy (Gemini free tier by default) when configured;
// otherwise deterministic mock so the site + video flow works offline.
// Every claim carries evidence.
const SYSTEM = `You analyze one person from two sources only: their public LinkedIn and public Instagram. Output JSON matching the ProfileJSON schema with keys: name, headline, one_line_summary, needs[{need,evidence,confidence}], hobbies[{hobby,evidence,source}], interests[], values[], personality_traits[{trait,evidence}], communication_style, lifestyle{pace,social_energy,travel,fitness}, career_ambition, dealbreakers_guess[], conversation_hooks[], data_gaps[]. Rules: every need/hobby/trait/value must include short evidence from the sources. Separate stated vs inferred (lower confidence for inferred). Never infer sexual orientation, religion, health, caste, ethnicity. Do not invent facts. List thin areas under data_gaps. Plain language. Return the JSON object only.`;

export async function profiler(name: string, linkedinText: string, instagramText: string): Promise<{ profile: ProfileJSON; summary: string }> {
  if (llmConfigured()) {
    try {
      const text = await chatComplete({
        system: SYSTEM,
        user: `Name: ${name}\n\nLINKEDIN:\n${linkedinText.slice(0, 6000)}\n\nINSTAGRAM:\n${instagramText.slice(0, 6000)}`,
        maxTokens: 2000,
        temperature: 0.5,
      });
      const profile = extractJSON<ProfileJSON>(text);
      return { profile, summary: profile.one_line_summary };
    } catch {
      /* fall through to mock */
    }
  }
  return { profile: mockProfile(name, linkedinText, instagramText), summary: `${name}: ${linkedinText.slice(0, 80)}…` };
}

export function mockProfile(name: string, linkedinText: string, instagramText: string): ProfileJSON {
  const li = linkedinText || "Software engineer, hackathons, volunteering.";
  const ig = instagramText || "Weekend hikes, film photography, cafe hopping.";
  return {
    name,
    headline: li.slice(0, 90),
    one_line_summary: `${name}: builds by day (${li.slice(0, 40)}…), recharges outdoors (${ig.slice(0, 40)}…).`,
    needs: [
      { need: "Intellectual peers who ship things", evidence: `LinkedIn: ${li.slice(0, 60)}`, confidence: 0.7 },
      { need: "Unplugged outdoor time weekly", evidence: `Instagram: ${ig.slice(0, 60)}`, confidence: 0.65 },
    ],
    hobbies: [
      { hobby: "Hiking / weekend trips", evidence: `Instagram: ${ig.slice(0, 60)}`, source: "instagram" },
      { hobby: "Hackathons / side projects", evidence: `LinkedIn: ${li.slice(0, 60)}`, source: "linkedin" },
    ],
    interests: ["startups", "photography", "indie films", "running"],
    values: ["curiosity", "autonomy", "kindness"],
    personality_traits: [
      { trait: "Warm + direct", evidence: "Short captions, quick replies in past collabs" },
      { trait: "High agency", evidence: `LinkedIn: ${li.slice(0, 60)}` },
    ],
    communication_style: "Short texts, voice notes for real topics, plans over small talk.",
    lifestyle: { pace: "fast workweek, slow weekends", social_energy: "small groups", travel: "monthly", fitness: "runs + hikes" },
    career_ambition: li.slice(0, 120),
    dealbreakers_guess: ["smoking", "disrespect for boundaries"],
    conversation_hooks: ["latest side project", "best recent trek", "a film worth rewatching"],
    data_gaps: ["Food habits", "Long-term location plans"],
  };
}
