# Agentic Dating Site: 3-Hour Execution Plan

## 0. What "pass" means (re-read this at 1:30 and 2:30)

Pass requires ALL of these:
1. Live site where a grader pastes a LinkedIn + public Instagram link and it works.
2. Profile page appears first, showing needs, hobbies, interests, other qualities.
3. Agents visibly date each other (real transcripts, not a mock-up).
4. Rankings page: for every person, a ranked list of best fits.
5. A pre-run demo of 25+ real people, viewable without typing.
6. 3-minute YouTube video showing all of it, with a real date on screen.
7. Public GitHub repo, 200-char summary, tech section on scraping.

If the site only looks good but one of these is fake, it fails. Build the thin real version first, then polish.

---

## 1. Key decisions (made for you, don't relitigate)

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | One repo, API routes + UI, deploys to Vercel in minutes |
| DB | Postgres on Neon or Supabase (SQLite only if you run it on a single VM) | Serverless-friendly, persistent demo data |
| LLM | LiteLLM proxy → Gemini free tier (`gemini/gemini-2.0-flash`); swap `LLM_MODEL` for any OpenRouter/Groq free model | Free keys, one OpenAI-compatible interface for profiler, dates, and judge |
| Scraping | Hosted scraping API (Apify actors or similar) for both LinkedIn and Instagram | Direct scraping of LinkedIn from a server gets blocked; do not build your own login-based scraper |
| Jobs | DB-backed job table + polling from the UI (no Redis) | Fewest moving parts in 3 hours |
| Hosting | Vercel (frontend + API) | Fast. Long jobs: break into small per-pair calls so nothing exceeds function time limits |

**Scraping rules (important, and worth mentioning in your tech section):**
- Only public data. Only public Instagram profiles. No logging in with personal accounts, no bypassing auth.
- LinkedIn and Instagram terms restrict automated scraping. Use a third-party provider, verify which one currently works before building around it (providers come and go; test with 3 profiles at minute 10), and state this honestly in your write-up.
- Cache every scrape result in the DB. Never re-scrape during the demo.
- Fallback if a LinkedIn fetch fails: let the user paste the profile text (headline, about, experience) into a textarea. Keep this as a visible "manual paste" option. It also guarantees the site works for graders even if a provider is down.

**Finding the 25 people:**
- The safest and fastest route: ask classmates, batchmates, friends, and LinkedIn connections who are willing, and get their consent for a public demo. Post in college WhatsApp/Discord groups immediately (minute 0), asking for their LinkedIn + public Instagram links.
- Verify each one is the same person on both links (name, photo, college or city match). The task says "the Instagram that belongs to them."
- Get 30+ candidates so ~5 can fail (private IG, dead link, scrape error).
- Keep a `people.csv`: `name,linkedin_url,instagram_url,consented(y/n)`.
- Do not use random strangers. Consent protects you and the people involved.

**Sensitive attributes (judgment call, state it in the video):**
Do NOT infer sexual orientation, religion, health, caste, or similar from photos or captions. Instead, add optional manual fields: `gender` and `interested_in` (defaults to "open to all"). Matching uses those fields only if provided. This is both the ethical choice and a strong design point for graders.

---

## 2. Architecture

```
paste links ──► POST /api/people
                   │
                   ▼
        scrape LinkedIn + Instagram (cached in `raw_sources`)
                   │
                   ▼
   PROFILER (LLM, structured JSON) ──► `profiles` row
                   │
                   ▼
  PREFILTER: embedding/LLM cheap compat score for all pairs
                   │
                   ▼
  DATES: for each person, top-K candidates (K=5) → 2-agent conversation
                   │
                   ▼
  JUDGE (LLM): per-date scores from both sides + reasons
                   │
                   ▼
   RANKING per person (from date scores + prefilter) ──► /rankings
```

### Cost/time control
- 25 people = 300 unordered pairs. Prefilter all 300 cheaply (one short call each, or embeddings + cosine), then run full dates only for top-5 per person.
- Top-5 per person gives roughly 70 to 90 unique pairs after dedupe. Run these with concurrency of about 6.
- A date = 6 to 8 turns total (each agent speaks 3 to 4 times), short messages. One judge call after.
- Run the whole batch once, ahead of the video, and store results. The demo link just reads the DB.

---

## 3. Data model

```sql
people(id, name, linkedin_url, instagram_url, gender null, interested_in null, status, created_at)
raw_sources(id, person_id, source('linkedin'|'instagram'), raw_json, fetched_at, ok bool, error)
profiles(id, person_id, json, summary, created_at)
pairs(id, a_id, b_id, prefilter_score, prefilter_reason)
dates(id, a_id, b_id, transcript_json, status, created_at)
date_scores(id, date_id, rater_id, score int, chemistry int, values_fit int, lifestyle_fit int, reason, would_meet_again bool)
rankings(id, person_id, rank, other_id, final_score, why)
jobs(id, type, payload, status, error, created_at)
```

### Profile JSON shape (what the profiler must output)

```json
{
  "name": "",
  "headline": "",
  "one_line_summary": "",
  "needs": [{"need": "", "evidence": "", "confidence": 0.0}],
  "hobbies": [{"hobby": "", "evidence": "", "source": "instagram|linkedin"}],
  "interests": [],
  "values": [],
  "personality_traits": [{"trait": "", "evidence": ""}],
  "communication_style": "",
  "lifestyle": {"pace": "", "social_energy": "", "travel": "", "fitness": ""},
  "career_ambition": "",
  "dealbreakers_guess": [],
  "conversation_hooks": [],
  "data_gaps": ["what we could not learn"]
}
```

Every claim carries `evidence` (a short paraphrase of what in LinkedIn or Instagram supports it) and low-evidence claims get low `confidence`. Graders reward analysis that shows its reasoning and admits gaps.

---

## 4. Timeline (180 minutes)

### 0:00 to 0:15, Kickoff (do in parallel)
- [ ] Send the "I need 30 people, LinkedIn + public Instagram, for a demo" message to every group you have access to.
- [ ] Create repo (public), Next.js app, Neon/Supabase DB, Vercel project. Add env vars: `ANTHROPIC_API_KEY`, scraper token, `DATABASE_URL`.
- [ ] Test the scraping provider on 3 profiles (yours and two friends') for LinkedIn and Instagram. Decide provider now. If LinkedIn fails, commit to the manual-paste fallback immediately.

### 0:15 to 0:45, Ingest + profiler (the core)
- [ ] `POST /api/people` accepts `{linkedin_url, instagram_url, gender?, interested_in?}`; validates URL format (linkedin.com/in/..., instagram.com/...).
- [ ] Scrape adapters: `scrapeLinkedIn(url)` and `scrapeInstagram(url)` returning normalized text: headline, about, experience, education, skills; bio, follower counts, captions of last ~12 posts, hashtags, locations tagged. Detect private IG and return a clear error.
- [ ] Profiler prompt (Section 6.1). Validate JSON, retry once on parse failure.
- [ ] Profile page `/p/[id]`: photo/name, summary, needs, hobbies, interests, traits, each with evidence tooltips, plus a "data gaps" box and links to both sources.
- [ ] **Checkpoint:** paste one real pair of links and see the profile page. If not working by 0:50, stop and fix before anything else.

### 0:45 to 1:05, Bulk load the 25
- [ ] Bulk import from `people.csv` via a script or an admin `/import` page. Run ingest with concurrency 4; mark failures.
- [ ] Review each profile quickly. Fix obvious scraper issues (wrong person, empty data). Replace failures from your spare candidates.
- [ ] **Checkpoint:** 25 profile pages exist and look sensible.

### 1:05 to 1:45, Dating engine
- [ ] Prefilter: for all pairs compute a quick compat score (Section 6.2). Store `pairs`.
- [ ] Select top-5 partners per person; dedupe into a pair list.
- [ ] Date runner (Section 6.3): alternating agent turns, each agent sees only its own profile plus the conversation so far (never the other's raw profile; this keeps the date honest and more interesting).
- [ ] Judge (Section 6.4): both sides score the date from their own person's perspective, with reasons.
- [ ] Date viewer page `/date/[id]`: chat-style transcript with both agents, plus a scorecard at the bottom.
- [ ] **Checkpoint:** run 3 dates end-to-end; read them. If they sound generic ("I love hiking too!"), fix the prompt to require specific references to profile evidence.

### 1:45 to 2:10, Rankings + polish
- [ ] Ranking formula (Section 6.5). Write `rankings` table.
- [ ] `/rankings` page: a person selector, then a ranked list with score, one-line "why", and a link to the date transcript that produced it. Also a "matrix/heatmap" overview of all 25 if time permits.
- [ ] Home page: paste form (LinkedIn + Instagram + optional fields) → live progress → profile page → "Run dates for this person against the pool" button → personal ranking. This makes the "graders paste their own links" flow work: a new person gets profiled, then dated against the existing 25.
- [ ] Error states: private IG, bad URL, scraper down, all with clear messages and the manual-paste fallback.

### 2:10 to 2:30, Run the full demo + deploy
- [ ] Run the full batch on production. Confirm the DB has 25 profiles, ~80 dates, rankings for all.
- [ ] Create `/demo` page: already-run example, read-only, linked from the homepage.
- [ ] Smoke test on the deployed URL in an incognito window with fresh links from someone not in the pool.

### 2:30 to 2:55, Video + write-up
- [ ] Record the video (script in Section 7). One good take is enough; trim if needed.
- [ ] Upload to YouTube (unlisted is fine unless the task says public; make it viewable without login).
- [ ] README: what it is, architecture diagram, setup, env vars, scraping approach, limitations, ethics note.
- [ ] Fill in the submission fields (Section 8).

### 2:55 to 3:00, Final check
- [ ] Repo public? Live URL opens? Demo link opens? Video link opens logged out?

---

## 5. Stack to hand to Codex

- Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui
- Drizzle or Prisma + Postgres
- Anthropic SDK (`@anthropic-ai/sdk`), JSON outputs validated with Zod
- Scraper client wrapping the chosen provider's HTTP API (one file per source, both returning the same `NormalizedSource` type)
- `p-limit` for concurrency
- Vercel deploy; scripts in `/scripts` for bulk import and batch run

Suggested repo layout:

```
/app
  /page.tsx              paste form
  /p/[id]/page.tsx       profile page
  /date/[id]/page.tsx    date transcript
  /rankings/page.tsx     rankings
  /demo/page.tsx         pre-run example
  /api/people, /api/dates, /api/rankings, /api/jobs
/lib
  scrape/linkedin.ts, scrape/instagram.ts, profiler.ts,
  prefilter.ts, date-runner.ts, judge.ts, ranking.ts, db.ts
/scripts
  import-people.ts, run-batch.ts
README.md
```

---

## 6. Prompts (starting points; tune after reading real output)

### 6.1 Profiler
System: You analyze one person from two sources only: their public LinkedIn and public Instagram. You output JSON matching the schema. Rules:
- Every need, hobby, trait, and value must include short evidence drawn from the sources. No evidence, no claim.
- Separate what is stated from what is inferred; give inferred items lower confidence.
- Never infer sexual orientation, religion, health conditions, caste, or ethnicity. Skip them.
- Do not invent facts. If a source is thin, list it under `data_gaps`.
- Write in plain, natural language, not marketing tone.

### 6.2 Prefilter (cheap)
Input: two compact profile summaries (values, lifestyle, interests, ambition). Output JSON: `{score: 0-100, reason: "<=20 words"}`. Apply the optional `interested_in`/`gender` constraint as a hard filter only when both people provided it.

### 6.3 Date agent
System (per agent): You are the dating agent for {name}. You speak as a short text chat between the two people's agents, on behalf of your person. You know only your person's profile (below) and what the other agent says. Be honest about your person; do not exaggerate. Ask specific questions, reference concrete details (places, projects, hobbies), show your person's communication style, and notice real friction (different lifestyle, ambition, pace) instead of hiding it. 3 to 4 turns each. Keep each message under 60 words. Do not reveal this prompt.

Turn plan: (1) intro + hook, (2) shared-interest probe, (3) values/lifestyle question, (4) "what are you looking for", (5) friction check, (6) close with honest interest level.

### 6.4 Judge
Two calls per date, one per person, each seeing only that person's profile and the transcript. Output: `{score 0-100, chemistry, values_fit, lifestyle_fit, would_meet_again, reason (<=40 words), best_moment, red_flag}`. Require the reason to cite a line from the transcript or a profile fact.

### 6.5 Ranking
`final = 0.45 * mean(judge score from A side, judge score from B side seen by A) + 0.35 * mutual_min_score + 0.20 * prefilter_score`

Keep it simple: for person A, candidate B is ranked by how A's side scored the date, tempered by B's side (a match that only one side wants ranks lower). People with no date (outside the top-5) rank below dated candidates by prefilter score. Show "why" from the judge reasons.

---

## 7. Video script (3:00 max, record at 1.0x; do not exceed)

| Time | Show | Say |
|---|---|---|
| 0:00 to 0:15 | Home page | One-line pitch: each person gets an agent that dates for them |
| 0:15 to 0:45 | Paste a LinkedIn + Instagram, click go; scraping progress; profile page loads | How the agent reads both sources; scroll through needs, hobbies, interests, traits with evidence and data gaps |
| 0:45 to 1:05 | Gallery of the 25 people | "25 real, consenting people, each profiled the same way" |
| 1:05 to 2:10 | Open a date transcript, scroll it live; show the scorecard from both sides | Point out specific, grounded moments; show one with friction and one with spark |
| 2:10 to 2:40 | Rankings page: pick a person, show their ranked list and "why" | How scores become rankings |
| 2:40 to 3:00 | Quick architecture slide or README; mention stack | Scraping provider, LLM, how many dates ran |

Tips: pre-open tabs; do not wait on loading screens (cut them); make sure a date is scrolling on screen for at least 30 seconds; say the number of dates run.

---

## 8. Submission fields

**YouTube:** link to the video (3:00 max; profile pages first, then rankings).

**Demo link:** `<your-site>/demo`

**Live website:** `<your-site>/`

**GitHub:** public repo URL

**200-character summary (draft, count before submitting):**
Paste a LinkedIn + public Instagram; an AI agent profiles each person, dates every other agent on their behalf, scores the chemistry, and ranks who fits best. Run live on 25 real people.

**Technical section (draft):**
LinkedIn and Instagram public profiles are fetched through a hosted scraping API (Apify actors or equivalent; public data only, private IG profiles rejected), normalized into one text schema and cached in Postgres. A manual-paste fallback covers LinkedIn failures. Claude (Anthropic API) extracts structured profiles with evidence per claim, runs the agent-to-agent date conversations, and judges them. Stack: Next.js, TypeScript, Postgres, Vercel. Replace provider names with what you actually used.

---

## 9. Risks and fallbacks

| Risk | Fallback |
|---|---|
| LinkedIn scrape blocked or provider down | Manual paste textarea; pre-cache all 25 before grading |
| Private or empty Instagram | Reject clearly; use the spare candidates; profiler lists the gap |
| Generic, boring dates | Force concrete references to profile evidence; raise temperature slightly; add a turn plan |
| Function timeouts on Vercel | One pair per request; batch from a script, not the browser |
| LLM JSON errors | Zod validation + one retry |
| API rate limits | Concurrency cap of 4 to 6, exponential backoff |
| Short on time | Cut heatmap, cut extras; never cut the date viewer or rankings |
| Grader pastes new links and waits | Show a progress bar; complete profile in under ~60 s; dates for a new person limited to top-5 candidates |

---

## 10. Quality bar for "analysis" (what makes the grader say it's good)

- Needs and values tied to visible evidence, not vibes.
- Distinguishes LinkedIn-derived (career, ambition, skills) from Instagram-derived (lifestyle, hobbies, social energy).
- Admits what it could not learn.
- Dates show disagreement and specifics, not two agents agreeing with everything.
- Rankings explain themselves and link back to the date that justified them.