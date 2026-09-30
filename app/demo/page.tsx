import { loadDB } from "@/lib/store";

export default async function Demo() {
  const db = await loadDB();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Demo — 25 people, already run</h1>
      <p className="text-sm text-neutral-400">{db.people.length} profiles · {db.dates.length} dates · read-only, no typing needed.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {db.people.map((p) => (
          <a key={p.id} href={`/p/${p.id}`} className="bg-neutral-900 border border-neutral-800 rounded p-3 text-sm hover:border-neutral-500">
            <p className="font-bold">{p.profile?.name ?? p.name}</p>
            <p className="text-neutral-400">{p.profile?.one_line_summary}</p>
          </a>
        ))}
      </div>
      <h2 className="font-bold">Recent dates</h2>
      <ul className="space-y-1">
        {db.dates.slice(0, 10).map((d) => (
          <li key={d.id} className="text-sm"><a className="underline" href={`/date/${d.id}`}>{d.aId} × {d.bId}</a></li>
        ))}
      </ul>
      <p className="text-sm"><a className="underline" href="/rankings">Rankings →</a></p>
    </div>
  );
}
