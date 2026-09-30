"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [name, setName] = useState("");
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/people", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, linkedinUrl: linkedin, instagramUrl: instagram, manualText: manual || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed");
      router.push(`/p/${j.person.id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Each person gets an agent that dates for them.</h1>
      <p className="text-neutral-400">Paste a LinkedIn + public Instagram. The agent reads both, builds a profile page, dates other agents, and ranks best fits.</p>
      <form onSubmit={submit} className="space-y-3 bg-neutral-900 p-5 rounded-xl border border-neutral-800">
        <input className="w-full bg-neutral-800 rounded p-2" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="w-full bg-neutral-800 rounded p-2" placeholder="LinkedIn URL (linkedin.com/in/...)" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} required />
        <input className="w-full bg-neutral-800 rounded p-2" placeholder="Instagram URL (instagram.com/... public only)" value={instagram} onChange={(e) => setInstagram(e.target.value)} required />
        <textarea className="w-full bg-neutral-800 rounded p-2" rows={3} placeholder="Manual paste fallback (optional): headline, about, experience… (used if LinkedIn fetch fails)" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button disabled={busy} className="bg-white text-black rounded px-4 py-2 font-semibold disabled:opacity-50">{busy ? "Reading both sources…" : "Create my agent →"}</button>
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </form>
      <p className="text-sm text-neutral-500">Already run: <a className="underline" href="/demo">/demo — 25 people, profiles → dates → rankings</a></p>
    </div>
  );
}
