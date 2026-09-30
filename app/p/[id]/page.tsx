import { loadDB } from "@/lib/store";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const db = await loadDB();
  const p = db.people.find((x) => x.id === params.id);
  if (!p || !p.profile) return <p>Profile not found. <a className="underline" href="/">Go home</a></p>;
  const pr = p.profile;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{pr.name}</h1>
        <p className="text-neutral-400">{pr.headline}</p>
        <p className="mt-2">{pr.one_line_summary}</p>
        <p className="text-xs text-neutral-500 mt-1">Sources: <a className="underline" href={p.linkedinUrl}>LinkedIn</a> · <a className="underline" href={p.instagramUrl}>Instagram</a></p>
      </div>
      <section><h2 className="font-bold mb-2">Needs</h2><ul className="space-y-1">{pr.needs.map((n, i) => <li key={i} className="bg-neutral-900 border border-neutral-800 rounded p-2 text-sm">• {n.need} <span className="text-neutral-500">— {n.evidence} (conf {n.confidence})</span></li>)}</ul></section>
      <section><h2 className="font-bold mb-2">Hobbies</h2><ul className="space-y-1">{pr.hobbies.map((h, i) => <li key={i} className="bg-neutral-900 border border-neutral-800 rounded p-2 text-sm">• {h.hobby} <span className="text-neutral-500">[{h.source}] — {h.evidence}</span></li>)}</ul></section>
      <section><h2 className="font-bold mb-2">Interests · Values · Traits</h2>
        <p className="text-sm">Interests: {pr.interests.join(", ")}</p>
        <p className="text-sm">Values: {pr.values.join(", ")}</p>
        <ul className="mt-1 space-y-1">{pr.personality_traits.map((t, i) => <li key={i} className="text-sm">• {t.trait} <span className="text-neutral-500">— {t.evidence}</span></li>)}</ul>
      </section>
      <section><h2 className="font-bold mb-2">Lifestyle · Ambition</h2>
        <p className="text-sm">{pr.communication_style}</p>
        <p className="text-sm text-neutral-400">{pr.lifestyle.pace} · {pr.lifestyle.social_energy} · travel {pr.lifestyle.travel} · {pr.lifestyle.fitness}</p>
        <p className="text-sm mt-1">{pr.career_ambition}</p>
      </section>
      <section><h2 className="font-bold mb-2">Data gaps</h2><p className="text-sm text-neutral-400">{pr.data_gaps.join(" · ")}</p></section>
      <form action={`/api/dates`} method="post">
        <button formAction="/api/dates" className="hidden" />
      </form>
      <RunDates personId={p.id} />
      <p className="text-sm"><a className="underline" href="/rankings">See rankings →</a></p>
    </div>
  );
}

function RunDates({ personId }: { personId: string }) {
  return (
    <form
      className="bg-neutral-900 border border-neutral-800 rounded p-4"
      action={async () => {
        "use server";
        // client-side fetch is used instead; this box explains the flow
      }}
    >
      <p className="text-sm text-neutral-400">Date this person against the pool (top-5 by prefilter), then see personal ranking.</p>
      <a href={`/rankings?person=${personId}`} className="inline-block mt-2 bg-white text-black rounded px-4 py-2 text-sm font-semibold">Run dates + rank</a>
    </form>
  );
}
