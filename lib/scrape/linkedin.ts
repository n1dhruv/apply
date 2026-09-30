import type { NormalizedSource } from "../types";

// Phase 1 adapter: hosted scraping API (Apify actors or equivalent).
// Public data only. Private IG → ok:false so the UI can reject clearly.
// Env: APIFY_TOKEN. Without a token we return ok:false (caller falls back
// to manual-paste + mock) instead of pretending to scrape.

const PROVIDER = "apify";

export async function scrapeLinkedIn(url: string): Promise<NormalizedSource> {
  if (!url.includes("linkedin.com/in/")) {
    return { source: "linkedin", ok: false, error: "URL must look like linkedin.com/in/...", text: "", fields: {} };
  }
  if (!process.env.APIFY_TOKEN) {
    return { source: "linkedin", ok: false, error: `No scraper token configured (${PROVIDER}). Use manual paste.`, text: "", fields: {} };
  }
  // TODO: wire real actor call here; cache result in raw_sources.
  return { source: "linkedin", ok: false, error: "LinkedIn actor not wired yet. Use manual paste.", text: "", fields: {} };
}
