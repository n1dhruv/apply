export type NormalizedSource = {
  source: "linkedin" | "instagram";
  ok: boolean;
  error?: string;
  text: string;
  fields: Record<string, string>;
};

export type ProfileJSON = {
  name: string;
  headline: string;
  one_line_summary: string;
  needs: { need: string; evidence: string; confidence: number }[];
  hobbies: { hobby: string; evidence: string; source: string }[];
  interests: string[];
  values: string[];
  personality_traits: { trait: string; evidence: string }[];
  communication_style: string;
  lifestyle: { pace: string; social_energy: string; travel: string; fitness: string };
  career_ambition: string;
  dealbreakers_guess: string[];
  conversation_hooks: string[];
  data_gaps: string[];
};

export type Person = {
  id: string;
  name: string;
  linkedinUrl: string;
  instagramUrl: string;
  gender?: string | null;
  interestedIn?: string | null;
  status: string;
};

export type ChatMsg = { speaker: string; speakerId: string; text: string };
export type DateRecord = { id: string; aId: string; bId: string; transcript: ChatMsg[]; status: string };
export type DateScoreRecord = {
  raterId: string; score: number; chemistry: number; valuesFit: number;
  lifestyleFit: number; reason: string; wouldMeetAgain: boolean;
  bestMoment?: string; redFlag?: string;
};
export type RankingRecord = { personId: string; rank: number; otherId: string; finalScore: number; why: string; dateId?: string };
