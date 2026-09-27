let cached: { value: number; until: number } | null = null;
let pending: Promise<number> | null = null;

export async function availableCredits(key: string): Promise<number> {
  if (cached && cached.until > Date.now()) return cached.value;
  if (pending) return pending;
  pending = (async () => {
    if (!key) throw new Error("Featherless credit check unavailable: API key missing from server environment.");
    const response = await fetch("https://api.featherless.ai/credits/balance", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new Error(`Featherless credit check failed (${response.status}).`);
    const payload = await response.json() as { available_usd?: string | number };
    const value = Number(payload.available_usd);
    if (!Number.isFinite(value)) throw new Error("Featherless did not return an available credit balance.");
    cached = { value, until: Date.now() + 45_000 };
    return value;
  })();
  try { return await pending; } finally { pending = null; }
}

export async function ensureBackgroundCredits(key: string) {
  const available = await availableCredits(key);
  if (available < 10) throw new Error("Background run paused: Featherless credits reached the $10 live-demo reserve.");
}
