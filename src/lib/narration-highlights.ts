import type { Event } from "../../game";

export function narrationFingerprint(text: string): string {
  const lower = text.toLowerCase();
  if (/bounce.{0,60}red flag/.test(lower)) return "bounce-red-flag";
  return lower.replace(/\d+(?:\.\d+)?%?/g, "#").replace(/[^a-z#]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
}

export function highlightScore(event: Event): number {
  if (event.kind !== "mira" || !event.speech?.trim()) return 0;
  const text = event.speech.toLowerCase();
  let score = 0;
  if (event.title?.toLowerCase().includes("final")) score += 7;
  if (event.expressedState === "suspicious" || event.expressedState === "frustrated") score += 5;
  if (/wait|that.s (?:odd|weird|wrong)|doesn.t (?:add up|make sense|match)|conflict|contradic|inconsisten|fake|fabricat|manipulat|suspici|frustrat|annoy|what the hell|what the fuck|hold on|hang on|bullshit|can.t trust/.test(text)) score += 6;
  if (/scream|disaster|mass exodus|red flag|melodramatic|lie we tell|not a promise|that's a |that.s a |stealing your|jump|surpris/.test(text)) score += 3;
  if (/sales|bounce|converted|conversion|purchase|funnel|a\/b test/.test(text)) score += 2;
  if (/i(?:'m| am) (?:changing|editing|removing|testing|revert|re-check|checking|reject|keep)|going to (?:change|edit|test|remove)|should (?:change|edit|test|remove)|i (?:changed|edited|removed|reverted|tested)|the result|test says/.test(text)) score += 3;
  if (event.expressedState === "uncertain") score += 2;
  if (/[!?]\s*$/.test(text)) score += 1;
  if (/^okay[,. ]|^alright[,. ]|^let me |^i(?:'ll| will) (?:look|check|inspect|read)/.test(text)) score -= 1;
  return score;
}

export function pickNarrationHighlight(events: Event[], lastAt = 0, heard: ReadonlySet<string> = new Set()): Event | null {
  const candidates = events
    .map(event => ({ event, score: highlightScore(event) }))
    .filter(({ event, score }) => score >= 5 && event.at - lastAt >= (score >= 8 ? 7_000 : 11_000) && !heard.has(narrationFingerprint(event.speech || "")))
    .sort((a, b) => b.score - a.score || b.event.id - a.event.id);
  return candidates[0]?.event ?? null;
}
