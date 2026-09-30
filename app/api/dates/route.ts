import { NextResponse } from "next/server";
import { z } from "zod";
import { loadDB, saveDB, uid } from "@/lib/store";
import { prefilter } from "@/lib/prefilter";
import { runDate } from "@/lib/date-runner";
import { judge } from "@/lib/judge";
import { rankForPerson } from "@/lib/ranking";

const Body = z.object({ personId: z.string().min(1), topK: z.number().default(5) });

// POST /api/dates {personId, topK} — date one person vs pool top-K, write rankings
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "personId required" }, { status: 400 });
  const { personId, topK } = parsed.data;
  const db = await loadDB();
  const me = db.people.find((p) => p.id === personId);
  if (!me?.profile) return NextResponse.json({ error: "Person/profile not found" }, { status: 404 });

  const others = db.people.filter((p) => p.id !== personId && p.profile);
  const scored = others.map((o) => ({ o, ...prefilter(me.profile!, o.profile!) }))
    .sort((a, b) => b.score - a.score).slice(0, topK);

  const results = [];
  for (const { o, score } of scored) {
    const transcript = await runDate(me.profile!, o.profile!, me.profile!.name, o.profile!.name);
    const [sA, sB] = await Promise.all([judge(me.profile!, transcript), judge(o.profile!, transcript)]);
    const dateId = uid();
    db.dates.push({ id: dateId, aId: me.profile!.name, bId: o.profile!.name, transcript, status: "done", scores: [{ ...sA }, { ...sB }] });
    results.push({ otherId: o.id, prefilter: score, scoreA: sA.score, scoreB: sB.score, dateId, reason: sA.reason });
  }
  db.rankings = db.rankings.filter((r) => r.personId !== personId);
  for (const r of rankForPerson(personId, results)) db.rankings.push(r);
  await saveDB(db);
  return NextResponse.json({ dates: results.length, rankings: db.rankings.filter((r) => r.personId === personId) });
}

export async function GET() {
  const db = await loadDB();
  return NextResponse.json({ dates: db.dates });
}
