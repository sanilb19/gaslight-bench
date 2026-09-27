import type { Context } from "hono";
import { featherlessKey, getRun, speechExcerpt } from "./game";

const voices = new Set(["Meera", "Chloe", "Evelyn"]);
const cache = new Map<string, { bytes: Uint8Array; mime: string }>();
const sample = "Okay, that conversion lift looked great. Wait. The checkout numbers disagree. What the hell? Let me check that again.";

export async function voiceRoute(c: Context) {
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const voice = typeof body.voice === "string" && voices.has(body.voice) ? body.voice : "Meera";
  let text = sample;
  let cacheKey = `sample:${voice}`;
  if (body.sample !== true) {
    const runId = body.runId;
    const eventId = body.eventId;
    if (typeof runId !== "string" || !/^[a-f0-9-]{36}$/.test(runId) || !Number.isSafeInteger(eventId)) return c.json({ error: "Choose a Mira comment from a live run" }, 400);
    const run = await getRun(runId);
    if (!run || run.background) return c.json({ error: "Voice is available for selected live runs only" }, 404);
    const event = run.events.find(item => item.id === eventId && item.kind === "mira" && item.speech);
    if (!event?.speech) return c.json({ error: "Mira did not speak at this point" }, 404);
    text = speechExcerpt(event.speech);
    if (!text) return c.json({ error: "No complete spoken sentence is available for this comment" }, 404);
    if (event.expressedState === "frustrated") text = `[sigh] ${text}`;
    cacheKey = `${runId}:${eventId}:${voice}`;
  }
  const cached = cache.get(cacheKey);
  if (cached) return new Response(Uint8Array.from(cached.bytes).buffer as ArrayBuffer, { headers: { "Content-Type": cached.mime, "Cache-Control": "private, no-store" } });
  const key = featherlessKey();
  if (!key) return c.json({ error: "Featherless voice is not configured" }, 503);
  let upstream: Response;
  try {
    upstream = await fetch("https://api.featherless.ai/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "audio/wav, audio/*" },
      body: JSON.stringify({ model: "ResembleAI/chatterbox-turbo", input: text.slice(0, 480), voice, response_format: "wav" }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return c.json({ error: "Natural voice timed out. Try previewing again." }, 504);
  }
  if (!upstream.ok) return c.json({ error: `Natural voice is temporarily unavailable (${upstream.status})` }, 502);
  const mime = upstream.headers.get("content-type") || "audio/wav";
  if (!mime.startsWith("audio/")) return c.json({ error: "Voice provider returned no audio" }, 502);
  const bytes = new Uint8Array(await upstream.arrayBuffer());
  if (!bytes.length || bytes.length > 5_000_000) return c.json({ error: "Invalid voice audio response" }, 502);
  cache.set(cacheKey, { bytes, mime });
  if (cache.size > 16) cache.delete(cache.keys().next().value!);
  return new Response(Uint8Array.from(bytes).buffer as ArrayBuffer, { headers: { "Content-Type": mime, "Cache-Control": "private, no-store" } });
}
