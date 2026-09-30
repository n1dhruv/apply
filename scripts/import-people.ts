// Bulk import from people.csv (name,linkedin_url,instagram_url,consented)
// Usage: npm run import-people  (reads ./people.csv, else seeds 25 mock people)
import { readFile } from "fs/promises";
import { loadDB, saveDB, uid } from "../lib/store";
import { SEED_PEOPLE } from "../lib/mock-data";
import { mockProfile } from "../lib/profiler";

async function main() {
  let rows = SEED_PEOPLE.map((s) => ({ name: s.name, linkedin: s.linkedin, instagram: s.instagram, li: s.li, ig: s.ig }));
  try {
    const csv = await readFile("./people.csv", "utf8");
    const lines = csv.trim().split("\n").slice(1);
    rows = lines.map((l) => {
      const [name, linkedin, instagram] = l.split(",");
      return { name: name?.trim(), linkedin: linkedin?.trim(), instagram: instagram?.trim(), li: `${name} LinkedIn`, ig: `${name} Instagram` };
    }).filter((r) => r.name && r.linkedin && r.instagram);
    console.log(`people.csv: ${rows.length} rows`);
  } catch { console.log("No people.csv — seeding 25 mock people (replace with consented links)."); }

  const db = await loadDB();
  for (const r of rows) {
    if (db.people.some((p) => p.linkedinUrl === r.linkedin)) continue;
    const profile = mockProfile(r.name, r.li, r.ig);
    db.people.push({ id: uid(), name: r.name, linkedinUrl: r.linkedin, instagramUrl: r.instagram, status: "profiled", profile, summary: profile.one_line_summary });
  }
  await saveDB(db);
  console.log(`Done. ${db.people.length} people in data/db.json`);
}
main();
