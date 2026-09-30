import { NextResponse } from "next/server";
import { loadDB } from "@/lib/store";

// GET /api/jobs — DB-backed job/polling stub (plan §1: no Redis)
export async function GET() {
  const db = await loadDB();
  return NextResponse.json({ people: db.people.length, dates: db.dates.length, rankings: db.rankings.length, pairs: db.pairs.length });
}
