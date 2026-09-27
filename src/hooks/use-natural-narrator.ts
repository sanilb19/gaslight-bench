import { useCallback, useEffect, useRef, useState } from "react";

export type MiraVoice = "Meera" | "Chloe" | "Evelyn";
type Clip = { text: string };

const preferences: Record<MiraVoice, string[]> = {
  Meera: ["Samantha", "Jenny", "Ava", "Google US English"],
  Chloe: ["Aria", "Zoe", "Google UK English Female", "Samantha"],
  Evelyn: ["Serena", "Samantha", "Jenny", "Google US English"],
};
const sample = "Okay, the numbers are changing, and I don't love what that implies. Let me check the actual page before I trust the chart.";

export function useNaturalNarrator() {
  const [enabled, setEnabled] = useState(false);
  const [voice, setVoice] = useState<MiraVoice>("Meera");
  const [error, setError] = useState("");
  const [availableVoices, setAvailableVoices] = useState<number | null>(null);
  const enabledRef = useRef(false);
  const voiceRef = useRef<MiraVoice>("Meera");
  const queue = useRef<Clip[]>([]);
  const working = useRef(false);
  const generation = useRef(0);
  const settle = useRef<(() => void) | null>(null);

  const reset = useCallback(() => {
    generation.current++;
    queue.current = [];
    settle.current?.();
    settle.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    working.current = false;
  }, []);

  const play = useCallback(async (text: string, cycle: number) => {
    if (!("speechSynthesis" in window)) throw new Error("This browser has no speech voices.");
    const synth = window.speechSynthesis;
    let candidates = synth.getVoices().filter(v => v.lang.toLowerCase().startsWith("en"));
    if (!candidates.length) {
      await new Promise<void>(resolve => {
        const timer = window.setTimeout(() => { synth.removeEventListener("voiceschanged", ready); resolve(); }, 1800);
        function ready() { window.clearTimeout(timer); synth.removeEventListener("voiceschanged", ready); resolve(); }
        synth.addEventListener("voiceschanged", ready);
      });
      candidates = synth.getVoices().filter(v => v.lang.toLowerCase().startsWith("en"));
    }
    if (generation.current !== cycle) return;
    if (!candidates.length) throw new Error("No English speech voices are available in this browser. Try a browser with installed system voices.");
    const preferred = preferences[voiceRef.current];
    const chosen = preferred.map(name => candidates.find(v => v.name.toLowerCase().includes(name.toLowerCase()))).find(Boolean)
      ?? candidates.find(v => /natural|premium|enhanced|neural/i.test(v.name)) ?? candidates[0];
    const utterance = new SpeechSynthesisUtterance(text);
    if (chosen) utterance.voice = chosen;
    utterance.rate = voiceRef.current === "Chloe" ? 1.09 : voiceRef.current === "Evelyn" ? 0.98 : 1.03;
    utterance.pitch = voiceRef.current === "Chloe" ? 1.08 : voiceRef.current === "Evelyn" ? 0.98 : 1.02;
    await new Promise<void>((resolve, reject) => {
      let started = false;
      const timeout = window.setTimeout(() => { synth.cancel(); reject(new Error("Browser speech timed out after 16 seconds.")); }, 16000);
      const startTimeout = window.setTimeout(() => { if (!started) { synth.cancel(); reject(new Error("Browser speech did not start. Check system voices and audio permissions.")); } }, 3500);
      settle.current = () => { window.clearTimeout(timeout); window.clearTimeout(startTimeout); resolve(); };
      utterance.onstart = () => { started = true; window.clearTimeout(startTimeout); };
      utterance.onend = () => { window.clearTimeout(timeout); window.clearTimeout(startTimeout); resolve(); };
      utterance.onerror = event => { window.clearTimeout(timeout); window.clearTimeout(startTimeout); reject(new Error(`Browser voice failed: ${event.error}`)); };
      if (generation.current !== cycle) { window.clearTimeout(timeout); resolve(); return; }
      synth.speak(utterance);
    });
    settle.current = null;
  }, []);

  const drain = useCallback(async () => {
    if (working.current || !enabledRef.current) return;
    working.current = true;
    const cycle = generation.current;
    try {
      while (cycle === generation.current && enabledRef.current && queue.current.length) {
        try { await play(queue.current.shift()!.text, cycle); }
        catch (cause) {
          if (cycle !== generation.current) return;
          setError(cause instanceof Error ? cause.message : "Browser voice is unavailable");
          enabledRef.current = false;
          setEnabled(false);
          return;
        }
      }
    } finally {
      if (cycle === generation.current) working.current = false;
    }
  }, [play]);

  const enqueue = useCallback((_runId: string, _eventId: number, text: string) => {
    if (!enabledRef.current || !text) return;
    queue.current.push({ text });
    while (queue.current.length > 1) queue.current.shift();
    void drain();
  }, [drain]);

  const preview = useCallback(async () => {
    reset();
    setError("");
    if (!("speechSynthesis" in window) || !window.speechSynthesis.getVoices().some(v => v.lang.toLowerCase().startsWith("en"))) {
      setError("No English speech voices are available in this browser. Use a browser with installed system voices.");
      return;
    }
    const cycle = generation.current;
    try { await play(sample, cycle); }
    catch (cause) { if (cycle === generation.current) setError(cause instanceof Error ? cause.message : "Browser voice is unavailable"); }
  }, [play, reset]);

  useEffect(() => {
    enabledRef.current = enabled;
    if (enabled) setError("");
    else reset();
  }, [enabled, reset]);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) { setAvailableVoices(0); return; }
    const synth = window.speechSynthesis;
    const update = () => setAvailableVoices(synth.getVoices().filter(v => v.lang.toLowerCase().startsWith("en")).length);
    update();
    synth.addEventListener("voiceschanged", update);
    return () => synth.removeEventListener("voiceschanged", update);
  }, []);
  useEffect(() => () => reset(), [reset]);

  return { enabled, setEnabled, voice, setVoice, error, availableVoices, enqueue, preview, reset };
}
