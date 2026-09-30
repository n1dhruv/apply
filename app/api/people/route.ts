import { NextResponse } from "next/server";
import { z } from "zod";
import { loadDB, saveDB, uid } from "@/lib/store";
import { scrapeLinkedIn } from "@/lib/scrape/linkedin";
import { scrapeInstagram } from "@/lib/scrape/instagram";
import { profiler } from "@/lib/profiler";

const Body = z.object({
  name: z.string().min(1),
  linkedinUrl: z.string().url().refine((u) => u.includes("linkedin.com/in/"), "LinkedIn URL must contain linkedin.com/in/"),
  instagramUrl: z.string().url().refine((u) => u.includes("instagram.com/"), "Instagram URL must contain instagram.com/"),
  gender: z.string().optional(),
  interestedIn: z.string().optional(),
  manualText: z.string().optional(),
});

// POST /api/people — paste links → scrape (cached) → profiler → profile
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const { name, linkedinUrl, instagramUrl, gender, interestedIn, manualText } = parsed.data;

  const [li, ig] = await Promise.all([scrapeLinkedIn(linkedinUrl), scrapeInstagram(instagramUrl)]);
  const linkedinText = li.ok ? li.text : (manualText || "");
  if (!li.ok && !manualText) {
    return NextResponse.json({ error: `LinkedIn fetch failed: ${li.error}. Paste profile text in the fallback box.`, needsManual: true }, { status: 422 });
  }
  if (!ig.ok && !ig.text) {
    // Instagram empty but not fatal if manual/linkedin present — profiler records data_gaps
  }
  const instagramText = ig.ok ? ig.text : "";
  const { profile, summary } = await profiler(name, linkedinText || `${name} (${linkedinUrl})`, instagramText || `${name} (${instagramUrl})`);

  const db = await loadDB();
  const person = { id: uid(), name, linkedinUrl, instagramUrl, gender: gender ?? null, interestedIn: interestedIn ?? "open to all", status: "profiled", profile, summary };
  db.people.push(person);
  await saveDB(db);
  return NextResponse.json({ person: { ...person, profile } });
}

export async function GET() {
  const db = await loadDB();
  return NextResponse.json({ people: db.people.map((p) => ({ id: p.id, name: p.profile?.name ?? p.name, summary: p.summary })) });
}
