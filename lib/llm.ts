// Single LLM entry point for the whole app.
// Talks OpenAI-compatible chat completions, designed for a LiteLLM Proxy
// so you can use Gemini (free tier), OpenRouter free models, Groq, etc.
// without changing app code — just point LLM_BASE_URL at the proxy and
// set LLM_MODEL. No LLM configured → callers fall back to deterministic
// mocks so the site + video flow still works offline.

const BASE_URL = (process.env.LLM_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");
const PROXY_KEY = process.env.LLM_API_KEY ?? "";
export const LLM_MODEL = process.env.LLM_MODEL ?? "gemini-flash";

export function llmConfigured(): boolean {
  return Boolean(process.env.LLM_MODEL || process.env.LLM_API_KEY);
}

export async function chatComplete(opts: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(PROXY_KEY ? { Authorization: `Bearer ${PROXY_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      max_tokens: opts.maxTokens ?? 1200,
      temperature: opts.temperature ?? 0.7,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM proxy ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const text: string = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Empty LLM response");
  return text;
}

export function extractJSON<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match?.[0] ?? text) as T;
}
