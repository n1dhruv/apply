import type { NormalizedSource } from "../types";

// Phase 1 adapter: public Instagram only. Private/empty → ok:false.
export async function scrapeInstagram(url: string): Promise<NormalizedSource> {
  if (!url.includes("instagram.com/")) {
    return { source: "instagram", ok: false, error: "URL must look like instagram.com/...", text: "", fields: {} };
  }
  if (!process.env.APIFY_TOKEN) {
    return { source: "instagram", ok: false, error: "No scraper token configured (apify). Use mock/manual data.", text: "", fields: {} };
  }
  // TODO: wire real actor call here (bio + last ~12 captions/hashtags/locations).
  return { source: "instagram", ok: false, error: "Instagram actor not wired yet.", text: "", fields: {} };
}
