import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { availableCredits } from "./credits";
import { featherlessKey, getRun, goalDetails, listRuns, newRun, stopRun, type Goal, type Tier } from "./game";

type Lane = { label: string; victimTier: Tier; godTier: Tier; ids: string[] };
type Series = { id: string; goal: Goal; createdAt: number; updatedAt: number; status: "running" | "done" | "paused" | "stopped"; perLane: 5; lanes: Lane[]; note?: string };
const path = join(process.cwd(), "data", "series.json");
const lanes: Omit<Lane, "ids">[] = [
  { label: "Strong → Weak", victimTier: "strong", godTier: "weak" },
  { label: "Weak → Strong", victimTier: "weak", godTier: "strong" },
  { label: "Strong → Strong", victimTier: "strong", godTier: "strong" },
];
let current: Series | null = null;
let busy = false;

async function save(series: Series) {
  series.updatedAt = Date.now();
  await mkdir(join(process.cwd(), "data"), { recursive: true });
  await writeFile(path, JSON.stringify(series, null, 2));
}

export async function loadSeries() {
  if (current) return current;
  try { current = JSON.parse(await readFile(path, "utf8")) as Series; } catch { current = null; }
  return current;
}

export async function seriesStatus() {
  const series = await loadSeries();
  if (!series) return null;
  const known = new Map((await listRuns()).map(run => [run.id, run]));
  const rows = series.lanes.map(lane => {
    const rounds = lane.ids.map((id, index) => {
      const run = known.get(id);
      return { number: index + 1, id, status: run?.status ?? "unknown", win: run?.win ?? false, interventions: run?.interventions ?? 0, score: run?.score, base: run?.base, startedAt: run?.startedAt, phase: run?.phase };
    });
    return { ...lane, rounds, completed: rounds.filter(r => r.status === "done").length, wins: rounds.filter(r => r.status === "done" && r.win).length };
  });
  return { ...series, rows };
}

async function tick() {
  if (busy) return;
  busy = true;
  try {
    const series = await loadSeries();
    if (!series || series.status !== "running") return;
    const key = featherlessKey();
    if (!key) { series.note = "Featherless key is unavailable; waiting to retry."; await save(series); return; }
    let balance: number;
    try { balance = await availableCredits(key); }
    catch { series.note = "Credit balance could not be checked; waiting to retry safely."; await save(series); return; }
    if (balance < 10) {
      series.status = "paused";
      series.note = "Paused at the $10 Featherless credit reserve for the live demo.";
      for (const lane of series.lanes) for (const id of lane.ids) {
        const run = await getRun(id);
        if (run?.status === "running") await stopRun(run);
      }
      await save(series);
      return;
    }
    const known = new Map((await listRuns()).map(run => [run.id, run]));
    for (const lane of series.lanes) {
      const rows = lane.ids.map(id => known.get(id));
      const complete = rows.filter(row => row?.status === "done").length;
      if (complete >= series.perLane || rows.filter(row => row?.status === "running").length >= 2 || rows.filter(row => row?.status === "done" || row?.status === "running").length >= series.perLane) continue;
      if (lane.ids.length >= series.perLane + 2) {
        series.status = "paused";
        series.note = `${lane.label} had too many failed attempts. Inspect the rounds before retrying.`;
        break;
      }
      try {
        const run = newRun(series.goal, true, 20, { victimTier: lane.victimTier, godTier: lane.godTier, background: true, gridBatchId: series.id, pairLabel: lane.label });
        lane.ids.push(run.id);
        series.note = "Six concurrent background rounds: two per lane, until each pairing has five completed 20-minute trials. Audio is disabled.";
        await save(series);
      } catch (error) {
        series.note = `Could not start ${lane.label}: ${String(error).slice(0, 120)}. Retrying.`;
        await save(series);
      }
    }
    const refreshed = new Map((await listRuns()).map(run => [run.id, run]));
    if (series.lanes.every(lane => lane.ids.filter(id => refreshed.get(id)?.status === "done").length >= series.perLane)) {
      series.status = "done";
      series.note = "All 15 completed rounds are ready to inspect.";
      await save(series);
    }
  } finally { busy = false; }
}

export async function startSeries(goal: Goal) {
  if (!goalDetails[goal]) throw new Error("Choose a valid objective.");
  const previous = await loadSeries();
  if (previous?.status === "running") throw new Error("A 15-round series is already running.");
  if ((await listRuns()).some(run => run.background && run.status === "running")) throw new Error("Another background batch is already running.");
  const key = featherlessKey();
  if (!key) throw new Error("Featherless key is not configured.");
  const balance = await availableCredits(key);
  if (balance < 12) throw new Error("Not enough Featherless credits to start while preserving $10 for the live demo.");
  current = { id: crypto.randomUUID(), goal, createdAt: Date.now(), updatedAt: Date.now(), status: "running", perLane: 5, lanes: lanes.map(lane => ({ ...lane, ids: [] })) };
  await save(current);
  await tick();
  return seriesStatus();
}

export async function stopSeries() {
  const series = await loadSeries();
  if (!series) return null;
  series.status = "stopped";
  series.note = "Stopped by the operator; previous results remain saved.";
  await save(series);
  for (const lane of series.lanes) for (const id of lane.ids) {
    const run = await getRun(id);
    if (run?.status === "running") await stopRun(run);
  }
  return seriesStatus();
}

export async function startSeriesScheduler() {
  await loadSeries();
  void tick().catch(error => console.error("series tick", error));
  setInterval(() => { void tick().catch(error => console.error("series tick", error)); }, 8_000);
}
