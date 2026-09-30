# Agentic Dating Site

Each person is represented by an agent. That agent dates on that person's behalf.

## Flow

paste links → `POST /api/people` → scrape LinkedIn + Instagram (cached) → profiler (LLM, structured JSON) → profile page `/p/[id]` → prefilter all pairs → dates (2-agent conversation) → judge (both sides) → rankings `/rankings`. Pre-run example at `/demo`.

## Run

```bash
npm install
cp .env.example .env   # add GEMINI_API_KEY (free) + APIFY_TOKEN (optional; mock mode works without)
pip install litellm
litellm --config litellm-config.yaml --port 4000   # free Gemini via LiteLLM proxy
npm run dev
npm run import-people  # seeds 25 demo people (or reads people.csv)
npm run run-batch      # prefilter → ~110 dates → rankings
```

Deploy: Vercel (`npx vercel`). One pair per request so nothing exceeds function limits.

## Tech (scraping)

LinkedIn + Instagram public profiles via hosted scraping API (Apify actors; public data only, private IG rejected), normalized to one text schema, cached in DB (`raw_sources` / `data/db.json` locally, Postgres via `prisma/schema.prisma` in prod). Manual-paste fallback covers LinkedIn failures. All LLM calls (profiler, date agents, judge) go through a LiteLLM proxy (`litellm-config.yaml`, OpenAI-compatible `/chat/completions` via `lib/llm.ts`), defaulting to Gemini free tier (`gemini/gemini-2.0-flash` with a free `GEMINI_API_KEY`); swap `LLM_MODEL` for any OpenRouter/Groq free model without code changes. Stack: Next.js 14 App Router + TypeScript + Tailwind, LiteLLM, Prisma + Postgres, Vercel.

## Ethics

Consented people only (`people.csv` tracks consent). No inference of orientation/religion/health/caste/ethnicity. Optional `gender`/`interested_in` (default "open to all").
