// Batch: prefilter all pairs → top-5 per person → dates → judge → rankings
// Usage: npm run run-batch
import pLimit from "p-limit";
import { loadDB, saveDB, uid } from "../lib/store";
import { prefilter } from "../lib/prefilter";
import { runDate } from "../lib/date-runner";
import { judge } from "../lib/judge";
import { rankForPerson } from "../lib/ranking";

const K = 5;
const CONCURRENCY = 4;

async function main() {
  const db = await loadDB();
  const people = db.people.filter((p) => p.profile);
  console.log(`${people.length} profiled people`);

  // Prefilter all unordered pairs
  db.pairs = [];
  for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
    const { score, reason } = prefilter(people[i].profile!, people[j].profile!);
    db.pairs.push({ aId: people[i].id, bId: people[j].id, prefilterScore: score, prefilterReason: reason });
  }
  console.log(`${db.pairs.length} pairs prefiltered`);

  // Top-K per person → dedupe
  const wanted = new Map<string, { otherId: string; prefilter: number }[]>();
  for (const p of people) {
    const cands = people.filter((q) => q.id !== p.id).map((q) => {
      const pair = db.pairs.find((x) => (x.aId === p.id && x.bId === q.id) || (x.aId === q.id && x.bId === p.id));
      return { otherId: q.id, prefilter: pair?.prefilterScore ?? 50 };
    }).sort((a, b) => b.prefilter - a.prefilter).slice(0, K);
    wanted.set(p.id, cands);
  }
  const pairKeys = new Set<string>();
  for (const [pid, cands] of wanted) for (const c of cands) pairKeys.add([pid, c.otherId].sort().join("|"));
  console.log(`${pairKeys.size} unique dates to run`);

  const limit = pLimit(CONCURRENCY);
  const byId = new Map(people.map((p) => [p.id, p]));
  const dateTasks = [...pairKeys].map((key) => limit(async () => {
    const [aId, bId] = key.split("|");
    if (db.dates.some((d) => (d.aId === aId && d.bId === bId) || (d.aId === bId && d.bId === aId))) return;
    const A = byId.get(aId)!, B = byId.get(bId)!;
    const transcript = await runDate(A.profile!, B.profile!, A.profile!.name, B.profile!.name);
    const [sA, sB] = await Promise.all([judge(A.profile!, transcript), judge(B.profile!, transcript)]);
    db.dates.push({ id: uid(), aId, bId, transcript, status: "done", scores: [{ ...sA, raterId: aId }, { ...sB, raterId: bId }] });
    process.stdout.write(".");
  }));
  await Promise.all(dateTasks);
  console.log(`\n${db.dates.length} dates total`);

  // Rankings per person
  db.rankings = [];
  for (const p of people) {
    const cands = (wanted.get(p.id) ?? []).map((c) => {
      const d = db.dates.find((x) => (x.aId === p.id && x.bId === c.otherId) || (x.aId === c.otherId && x.bId === p.id));
      if (!d) return { otherId: c.otherId, prefilter: c.prefilter };
      const sA = d.scores.find((s) => s.raterId === p.id) ?? d.scores[0];
      const sB = d.scores.find((s) => s.raterId !== (d.scores.find((x) => x.raterId === p.id)?.raterId ?? "")) ?? d.scores[1] ?? d.scores[0];
      return { otherId: c.otherId, prefilter: c.prefilter, scoreA: sA.score, scoreB: sB.score, dateId: d.id, reason: sA.reason };
    });
    for (const r of rankForPerson(p.id, cands)) db.rankings.push(r);
  }
  await saveDB(db);
  console.log(`Rankings written for ${people.length} people. Open /demo.`);
}
main();
