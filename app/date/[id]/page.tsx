import { loadDB } from "@/lib/store";

export default async function DatePage({ params }: { params: { id: string } }) {
  const db = await loadDB();
  const d = db.dates.find((x) => x.id === params.id);
  if (!d) return <p>Date not found.</p>;
  const nameOf = (id: string) => db.people.find((p) => p.id === id || p.name === id)?.profile?.name ?? id;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Date: {nameOf(d.aId)} × {nameOf(d.bId)}</h1>
      <div className="space-y-2">
        {d.transcript.map((m, i) => (
          <div key={i} className={`max-w-[80%] rounded-xl p-3 text-sm ${i % 2 === 0 ? "bg-neutral-800" : "bg-neutral-700 ml-auto"}`}>
            <p className="text-xs text-neutral-400 mb-1">{m.speaker}</p>
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      <section className="bg-neutral-900 border border-neutral-800 rounded p-4">
        <h2 className="font-bold mb-2">Scorecard (both sides)</h2>
        {d.scores.map((s, i) => (
          <div key={i} className="text-sm mb-2">
            <p><b>{s.raterId}</b>: {s.score}/100 · chemistry {s.chemistry} · values {s.valuesFit} · lifestyle {s.lifestyleFit} · {s.wouldMeetAgain ? "would meet again ✓" : "would not meet again"}</p>
            <p className="text-neutral-400">{s.reason}</p>
          </div>
        ))}
      </section>
      <p className="text-sm"><a className="underline" href="/rankings">← rankings</a></p>
    </div>
  );
}
