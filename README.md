# Agentic Dating Site

Each person is represented by an agent. That agent dates on that person's behalf.

## Flow

paste links → `POST /api/people` → scrape LinkedIn + Instagram (cached) → profiler (LLM, structured JSON) → profile page `/p/[id]` → prefilter all pairs → dates (2-agent conversation) → judge (both sides) → rankings `/rankings`. Pre-run example at `/demo`.

## Run

```bash
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY + APIFY_TOKEN (optional; DEMO_MODE works without)
npm run dev
npm run import-people  # seeds 25 demo people (or reads people.csv)
npm run run-batch      # prefilter → ~80 dates → rankings
```

Deploy: Vercel (`npx vercel`). One pair per request so nothing exceeds function limits.

## Tech (scraping)

LinkedIn + Instagram public profiles via hosted scraping API (Apify actors; public data only, private IG rejected), normalized to one text schema, cached in DB (`raw_sources` / `data/db.json` locally, Postgres via `prisma/schema.prisma` in prod). Manual-paste fallback covers LinkedIn failures. Claude (Anthropic API) extracts structured profiles with evidence per claim, runs agent-to-agent dates, and judges them. Stack: Next.js 14 App Router + TypeScript + Tailwind, Prisma + Postgres, Vercel.

## Ethics

Consented people only (`people.csv` tracks consent). No inference of orientation/religion/health/caste/ethnicity. Optional `gender`/`interested_in` (default "open to all").
