import { promises as fs } from "fs";
import path from "path";
import type { DateRecord, DateScoreRecord, Person, ProfileJSON, RankingRecord } from "./types";

const DATA = path.join(process.cwd(), "data", "db.json");

type DB = {
  people: (Person & { profile?: ProfileJSON; summary?: string })[];
  dates: (DateRecord & { scores: DateScoreRecord[] })[];
  rankings: RankingRecord[];
  pairs: { aId: string; bId: string; prefilterScore: number; prefilterReason: string }[];
};

const empty: DB = { people: [], dates: [], rankings: [], pairs: [] };

export async function loadDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(DATA, "utf8");
    return JSON.parse(raw) as DB;
  } catch {
    return empty;
  }
}

export async function saveDB(db: DB): Promise<void> {
  await fs.mkdir(path.dirname(DATA), { recursive: true });
  await fs.writeFile(DATA, JSON.stringify(db, null, 2));
}

export const uid = () => Math.random().toString(36).slice(2, 10);
