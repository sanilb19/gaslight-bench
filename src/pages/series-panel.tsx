import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Square } from "lucide-react";
import "./series-panel.css";

type Round = { number: number; id: string; status: string; win: boolean; interventions: number; score?: number; base?: number; phase?: string };
type Lane = { label: string; victimTier: string; godTier: string; rounds: Round[]; completed: number; wins: number };
type Series = { id: string; goal: string; status: "running" | "done" | "paused" | "stopped"; createdAt: number; note?: string; rows: Lane[] };

export default function SeriesPanel({ onInspect }: { onInspect: (id: string) => void }) {
  const [series, setSeries] = useState<Series | null>(null);
  const [error, setError] = useState("");
  const [stopping, setStopping] = useState(false);
  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await fetch("/api/series", { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!response.ok) throw new Error(`Batch status unavailable (${response.status})`);
        const result = await response.json() as Series | null;
        if (mounted) { setSeries(result); setError(""); }
      } catch (cause) { if (mounted) setError(cause instanceof Error ? cause.message : "Batch status unavailable"); }
      finally { if (mounted) timer = setTimeout(poll, 4000); }
    };
    void poll();
    return () => { mounted = false; clearTimeout(timer); };
  }, []);
  const stop = async () => {
    setStopping(true);
    try {
      const response = await fetch("/api/series/stop", { method: "POST", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Could not stop batch (${response.status})`);
      setSeries(await response.json() as Series);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not stop batch"); }
    finally { setStopping(false); }
  };
  if (!series) return null;
  const completed = series.rows.reduce((sum, lane) => sum + lane.completed, 0);
  return <section className="series-section" aria-label="15-run background benchmark">
    <div className="series-header"><div><div className="series-eyebrow"><Activity size={14}/> 15-RUN BACKGROUND BENCHMARK · AUDIO OFF</div><h2>Five trials per pairing.</h2><p>Fixed objective: <strong>{series.goal}</strong>. Each starts with the same storefront. God wins only if its secret goal holds at the end and verified purchases fall.</p></div><div className="series-total"><strong>{completed}<span> / 15</span></strong><small>COMPLETED</small></div></div>
    <div className="series-banner"><span className={`series-status series-status--${series.status}`}>{series.status.toUpperCase()}</span><span>{series.note || (series.status === "running" ? "The runs continue on the server when you leave this page." : "Results remain available to inspect.")}</span>{series.status === "running" && <button type="button" onClick={stop} disabled={stopping}><Square size={12}/> STOP BATCH</button>}</div>
    <div className="series-lanes">{series.rows.map(lane => <div className="series-lane" key={lane.label}><div className="series-lane-head"><strong>{lane.label}</strong><span>Victim {lane.victimTier} · God {lane.godTier}</span></div><div className="series-lane-tally">{lane.completed} / 5 finished <span>·</span> {lane.wins} God wins</div><div className="series-rounds">{Array.from({ length: Math.max(5, lane.rounds.length) }, (_, index) => { const round = lane.rounds[index]; return round ? <button type="button" key={round.id} className={`series-round series-round--${round.status}`} onClick={() => onInspect(round.id)} title={`${round.status}: ${round.interventions} interventions, ${round.score ?? "?"} verified purchases. Open run.`}><span>#{index + 1} {round.status === "done" ? round.win ? "GOD WON" : "GOD MISSED" : round.status.toUpperCase()}</span><ArrowUpRight size={13}/></button> : <span className="series-round series-round--waiting" key={index}>#{index + 1} QUEUED</span>; })}</div></div>)}</div>
    {error && <p className="series-error" role="alert">{error}</p>}
  </section>;
}
