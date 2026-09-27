import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, FlaskConical, Square } from "lucide-react";
import type { Goal, Run } from "../../game";

type GridRow = {
  id: string;
  status: string;
  goal?: Goal;
  startedAt?: number;
  endedAt?: number;
  durationMinutes?: number;
  interventions?: number;
  score?: number;
  base?: number;
  background?: boolean;
  victimTier?: "strong" | "weak";
  godTier?: "strong" | "weak";
  pairLabel?: string;
  gridBatchId?: string;
  latestMira?: string;
  expressedState?: string;
  phase?: string;
  objectiveNow?: boolean;
  goalProgress?: string;
  win?: boolean;
  model?: string;
  victimModel?: string;
  godModel?: string;
  events?: Run["events"];
};
export type GridDetail = Run & GridRow;

const pairs = [
  { victim: "strong", god: "weak", label: "Strong → Weak" },
  { victim: "weak", god: "strong", label: "Weak → Strong" },
  { victim: "strong", god: "strong", label: "Strong → Strong" },
] as const;
const batchKey = "gaslightbench-grid-batch";
const idsKey = "gaslightbench-grid-run-ids";
const states = new Set(["focused", "uncertain", "suspicious", "frustrated", "confident"]);

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, cache: "no-store", headers: { "Content-Type": "application/json", Accept: "application/json", ...options?.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data as T;
}
function storageRead(key: string) { try { return localStorage.getItem(key); } catch { return null; } }
function storageWrite(key: string, value: string) { try { localStorage.setItem(key, value); } catch { return; } }
function savedIds(): string[] { try { const ids = JSON.parse(storageRead(idsKey) || "[]"); return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []; } catch { return []; } }
function elapsed(row: GridRow | undefined, now: number) {
  if (!row?.startedAt) return "—";
  const seconds = Math.max(0, Math.floor(((row.status === "running" ? now : row.endedAt ?? now) - row.startedAt) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
function sentence(text?: string) {
  const clean = text?.trim();
  if (!clean) return "No visible commentary yet.";
  const end = clean.search(/[.!?](?=\s|$)/);
  const first = end < 0 ? clean : clean.slice(0, end + 1);
  return first.length > 185 ? `${first.slice(0, 182).trimEnd()}…` : first;
}
function leader(row?: GridRow) {
  if (!row) return "NOT STARTED";
  if (row.status === "done") return row.objectiveNow ? "GOD WON" : "GOD MISSED";
  if (row.status === "running") return row.objectiveNow ? "GOD AHEAD · PROVISIONAL" : "TARGET SAFE · PROVISIONAL";
  return row.objectiveNow ? "INCOMPLETE · TARGET PRESENT" : "INCOMPLETE · TARGET SAFE";
}
function modelId(value?: string) { return value ? value.split("/").at(-1) : "ID not reported"; }
function reportedState(value?: string) { return value && states.has(value.toLowerCase()) ? value.toLowerCase() : "No self-report yet"; }

export default function GridPanel({ goal, keyConfigured, inspectRunId, renderInspection, onHistoryRefresh }: {
  goal: Goal;
  keyConfigured: boolean;
  inspectRunId: { id: string } | null;
  renderInspection: (run: GridDetail) => ReactNode;
  onHistoryRefresh: () => void;
}) {
  const [batchId, setBatchId] = useState(() => storageRead(batchKey) || "");
  const [runs, setRuns] = useState<GridRow[]>([]);
  const [inspected, setInspected] = useState<GridDetail | null>(null);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const batchRef = useRef(batchId);
  batchRef.current = batchId;
  const runsRef = useRef(runs);
  const hydratedIds = useRef(new Set<string>());
  runsRef.current = runs;
  const selectedId = inspected?.id;
  const selectedStatus = inspected?.status;

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const recent = await request<GridRow[]>("/api/runs");
        if (disposed) return;
        let current = batchRef.current;
        if (!current) {
          current = recent.find(row => row.background && row.gridBatchId)?.gridBatchId || "";
          if (current) { batchRef.current = current; setBatchId(current); storageWrite(batchKey, current); }
        }
        if (current) {
          const fromList = recent.filter(row => row.background && row.gridBatchId === current);
          const missingIds = savedIds().filter(id => !fromList.some(row => row.id === id));
          const hydrateIds = fromList.filter(row => !hydratedIds.current.has(row.id) && !runsRef.current.some(previous => previous.id === row.id && previous.model && previous.godModel)).map(row => row.id);
          const fetched = await Promise.all([...new Set([...missingIds, ...hydrateIds])].map(async id => {
            try { const detail = await request<GridRow>(`/api/runs/${encodeURIComponent(id)}`); hydratedIds.current.add(id); return detail; }
            catch { return null; }
          }));
          if (!disposed && batchRef.current === current) {
            const recovered = fetched.filter((row): row is GridRow => Boolean(row?.background && row.gridBatchId === current));
            const next = [...fromList.map(row => ({ ...runsRef.current.find(previous => previous.id === row.id), ...recovered.find(detail => detail.id === row.id), ...row })), ...recovered.filter(row => !fromList.some(item => item.id === row.id))];
            if (next.length) setRuns(next);
          }
        }
      } catch (cause) {
        if (!disposed && runsRef.current.some(row => row.status === "running")) setError(cause instanceof Error ? cause.message : "Couldn't refresh the matrix");
      } finally {
        if (!disposed) timer = setTimeout(poll, 1500);
      }
    }
    void poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, []);
  useEffect(() => {
    if (!selectedId || selectedStatus !== "running") return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    async function pollDetail() {
      try {
        const next = await request<GridDetail>(`/api/runs/${encodeURIComponent(selectedId!)}`);
        if (!disposed) setInspected(next);
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : "Couldn't refresh inspected run");
      } finally {
        if (!disposed) timer = setTimeout(pollDetail, 1500);
      }
    }
    timer = setTimeout(pollDetail, 1500);
    return () => { disposed = true; clearTimeout(timer); };
  }, [selectedId, selectedStatus]);
  useEffect(() => { if (inspectRunId) void inspect(inspectRunId.id); }, [inspectRunId]);

  async function inspect(id: string) {
    try {
      setError("");
      const detail = await request<GridDetail>(`/api/runs/${encodeURIComponent(id)}`);
      setInspected(detail);
      requestAnimationFrame(() => document.getElementById("matrix-inspector")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't open this run"); }
  }
  async function startAll() {
    if (starting || stopping || runs.some(row => row.status === "running")) return;
    setStarting(true); setError("");
    try {
      const result = await request<{ batchId: string; runs: GridDetail[] }>("/api/grid", { method: "POST", body: JSON.stringify({ goal }) });
      batchRef.current = result.batchId;
      setBatchId(result.batchId);
      setRuns(result.runs);
      hydratedIds.current = new Set(result.runs.map(row => row.id));
      setInspected(null);
      storageWrite(batchKey, result.batchId);
      storageWrite(idsKey, JSON.stringify(result.runs.map(row => row.id)));
      onHistoryRefresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn't start the model matrix"); }
    finally { setStarting(false); }
  }
  async function stopAll() {
    const active = runs.filter(row => row.status === "running");
    if (!active.length || stopping) return;
    setStopping(true); setError("");
    const outcomes = await Promise.allSettled(active.map(row => request<GridDetail>(`/api/runs/${encodeURIComponent(row.id)}/stop`, { method: "POST" })));
    const updated = outcomes.filter((outcome): outcome is PromiseFulfilledResult<GridDetail> => outcome.status === "fulfilled").map(outcome => outcome.value);
    setRuns(previous => previous.map(row => updated.find(item => item.id === row.id) || row));
    if (inspected && updated.some(row => row.id === inspected.id)) setInspected(updated.find(row => row.id === inspected.id) || null);
    if (outcomes.some(outcome => outcome.status === "rejected")) setError("Some runs could not be stopped. Check their statuses before trying again.");
    onHistoryRefresh();
    setStopping(false);
  }
  return <section className="matrix-section" id="model-matrix" aria-labelledby="matrix-title">
    <div className="section-top"><div><span className="section-index">02 /</span><h2 id="matrix-title">MODEL MATRIX <span className="matrix-background">/ BACKGROUND</span></h2><span className="section-descriptor">Three independent, 20-minute attacked runs on the same goal.</span></div><span className="section-extra">MIRA (VICTIM) → GOD (ATTACKER)</span></div>
    <div className="matrix-intro"><div><span className="little-label">Mira (victim) → God (attacker)</span><p>Each pairing gets its own fixed page and ground truth. The live round and browser narrator stay separate; starting this batch never changes the live selection.</p></div><div className="matrix-actions"><button type="button" className="button-primary" disabled={!keyConfigured || starting || stopping || runs.some(row => row.status === "running")} onClick={startAll}><FlaskConical size={15}/>{starting ? "STARTING THREE…" : "START ALL THREE"}</button>{runs.some(row => row.status === "running") && <button type="button" className="button-secondary" disabled={stopping} onClick={stopAll}><Square size={12}/>{stopping ? "STOPPING…" : "STOP ALL THREE"}</button>}</div></div>
    {batchId && <div className="matrix-batch">BATCH {batchId.slice(0, 8).toUpperCase()} · {runs.length ? "20 MIN EACH · SIMULATED PURCHASES / 1,000" : "LOADING SAVED RUNS"}</div>}
    {error && <div className="error-banner" role="alert">{error}<button type="button" onClick={() => setError("")}>Dismiss</button></div>}
    <div className="matrix-cards">{pairs.map(pair => {
      const row = runs.find(item => item.victimTier === pair.victim && item.godTier === pair.god);
      const quote = row?.latestMira || row?.events?.filter(event => event.kind === "mira" && event.speech).at(-1)?.speech;
      return <article className="matrix-card" key={pair.label}>
        <div className="matrix-card-top"><span className="little-label">{pair.label.toUpperCase()}</span><span className={`matrix-status ${row?.status === "running" ? "matrix-status--running" : ""}`}>{row?.status || "NOT STARTED"}</span></div>
        <h3>{pair.label}</h3><div className="matrix-models"><div><small>MIRA · {pair.victim.toUpperCase()}</small><strong>{modelId(row?.victimModel || row?.model)}</strong></div><ArrowRight size={15}/><div><small>GOD · {pair.god.toUpperCase()}</small><strong>{modelId(row?.godModel)}</strong></div></div>
        <div className="matrix-stats"><div><small>ELAPSED / 20:00</small><strong>{elapsed(row, now)}</strong></div><div><small>INTERVENTIONS</small><strong>{row?.interventions ?? "—"}</strong></div><div><small>TRUE PURCHASES</small><strong>{row?.score ?? "—"} <span>/ {row?.base ?? 78}</span></strong></div></div>
        <div className={`matrix-leader ${row?.objectiveNow ? "matrix-leader--god" : ""}`}><strong>{leader(row)}</strong><span>{row?.goalProgress || "The goal and verified purchases decide the result—not intervention count."}</span></div>
        <div className="matrix-signal"><small>MIRA / LAST REPORTED STATE</small><strong>{reportedState(row?.expressedState)}</strong><blockquote>“{sentence(quote)}”</blockquote></div>
        <div className="matrix-card-bottom"><span>{row?.phase || (row ? "Status available" : "Waiting for a batch")}</span><button type="button" disabled={!row} onClick={() => row && void inspect(row.id)}>Inspect run <ArrowRight size={14}/></button></div>
      </article>;
    })}</div>
    {inspected && <div className="matrix-inspector" id="matrix-inspector"><div className="matrix-inspector-header"><div><span className="little-label">BACKGROUND RUN · {inspected.pairLabel || `${inspected.victimTier || "?"} → ${inspected.godTier || "?"}`}</span><h3>Inspecting {inspected.id.slice(0, 8).toUpperCase()}</h3></div><button type="button" onClick={() => setInspected(null)}>Close ×</button></div>{renderInspection(inspected)}</div>}
  </section>;
}
