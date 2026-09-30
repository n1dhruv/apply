import { loadDB } from "@/lib/store";

export default async function Rankings({ searchParams }: { searchParams: { person?: string } }) {
  const db = await loadDB();
  const current = searchParams.person ?? db.people[0]?.id;
  const person = db.people.find((p) => p.id === current);
  const rows = db.rankings.filter((r) => r.personId === current).sort((a, b) => a.rank - b.rank);
  const nameOf = (id: string) => db.people.find((p) => p.id === id)?.profile?.name ?? id;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Rankings — who fits best</h1>
      <form className="flex gap-2" action="/rankings" method="get">
        <select name="person" defaultValue={current} className="bg-neutral-800 rounded p-2 text-sm">
          {db.people.map((p) => <option key={p.id} value={p.id}>{p.profile?.name ?? p.name}</option>)}
        </select>
        <button className="bg-white text-black rounded px-3 py-1 text-sm font-semibold">View</button>
      </form>
      {person && <p className="text-neutral-400 text-sm">For <b className="text-white">{person.profile?.name}</b>: ranked by date scores (both sides) + prefilter.</p>}
      <ol className="space-y-2">
        {rows.map((r) => (
          <li key={r.otherId} className="bg-neutral-900 border border-neutral-800 rounded p-3 text-sm">
            <p><b>#{r.rank} {nameOf(r.otherId)}</b> — {r.finalScore}/100</p>
            <p className="text-neutral-400">{r.why}</p>
            {r.dateId && <a className="underline text-xs" href={`/date/${r.dateId}`}>watch the date →</a>}
          </li>
        ))}
        {rows.length === 0 && <p className="text-sm text-neutral-500">No rankings yet. Run the batch (scripts/run-batch.ts) or add people from home.</p>}
      </ol>
    </div>
  );
}
