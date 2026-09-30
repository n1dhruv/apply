import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Agentic Dating", description: "Each person gets an agent that dates for them." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <nav className="border-b border-neutral-800 px-6 py-3 flex gap-5 text-sm">
          <a href="/" className="font-bold">Agentic Dating</a>
          <a href="/rankings" className="text-neutral-400 hover:text-white">Rankings</a>
          <a href="/demo" className="text-neutral-400 hover:text-white">Demo (25)</a>
        </nav>
        <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
