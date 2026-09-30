import { NextResponse } from "next/server";
import { loadDB } from "@/lib/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = searchParams.get("person");
  const db = await loadDB();
  const rankings = personId ? db.rankings.filter((r) => r.personId === personId) : db.rankings;
  return NextResponse.json({ rankings });
}
