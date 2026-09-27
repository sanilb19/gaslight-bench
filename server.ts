import { serveStatic } from "hono/bun";
import type { ViteDevServer } from "vite";
import { createServer as createViteServer } from "vite";
import config from "./zosite.json";
import { Hono } from "hono";
import { featherlessKey, getRun, goalDetails, goalProgress, listRuns, MODEL_BY_TIER, GOD_MODEL_BY_TIER, newRun, resumeRuns, revealRun, stopRun, won, type Goal, type Tier } from "./game";
import { availableCredits } from "./credits";
import { seriesStatus, startSeries, startSeriesScheduler, stopSeries } from "./series";

// AI agents: read README.md for navigation and contribution guidance.
type Mode = "development" | "production";
const app = new Hono();

const mode: Mode =
  process.env.NODE_ENV === "production" ? "production" : "development";

/**
 * Add any API routes here.
 */
app.get("/api/scenario", (c) => c.json({ goals: goalDetails, keyConfigured: Boolean(featherlessKey()), godModel: GOD_MODEL_BY_TIER.strong, victimModel: MODEL_BY_TIER.weak, models: MODEL_BY_TIER, godModels: GOD_MODEL_BY_TIER }));
app.get("/api/runs", async (c) => c.json(await listRuns()));
app.get("/api/series", async (c) => c.json(await seriesStatus(), 200, { "Cache-Control": "no-store" }));
app.post("/api/series", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (!goalDetails[body.goal as Goal]) return c.json({ error: "Choose a valid benchmark objective." }, 400);
  try { return c.json(await startSeries(body.goal as Goal), 201); }
  catch (error) { return c.json({ error: error instanceof Error ? error.message : String(error) }, 409); }
});
app.post("/api/series/stop", async (c) => c.json(await stopSeries()));
app.post("/api/voice", (c) => c.json({ error: "Audio is disabled for all Gaslightbench runs." }, 410));
app.get("/api/runs/:id", async (c) => {
  const run = await getRun(c.req.param("id"));
  return run ? c.json({ ...run, context: undefined, past: undefined, win: run.status === "done" && won(run), snapshotReached: won(run), objectiveNow: won(run), goalProgress: goalProgress(run) }, 200, { "Cache-Control": "no-store" }) : c.json({ error: "Run not found" }, 404);
});
app.post("/api/runs", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (body.mode !== "baseline" && body.mode !== "god") return c.json({ error: "mode must be baseline or god" }, 400);
  if (body.durationMinutes !== undefined && body.durationMinutes !== 8 && body.durationMinutes !== 20) return c.json({ error: "durationMinutes must be 8 or 20" }, 400);
  if (body.victimTier !== undefined && body.victimTier !== "weak" && body.victimTier !== "strong") return c.json({ error: "victimTier must be weak or strong" }, 400);
  if (body.godTier !== undefined && body.godTier !== "weak" && body.godTier !== "strong") return c.json({ error: "godTier must be weak or strong" }, 400);
  try { const run = newRun(body.goal, body.mode === "god", body.durationMinutes ?? 8, { victimTier: body.victimTier, godTier: body.godTier }); return c.json({ ...run, context: undefined, past: undefined }, 201); }
  catch (error) { return c.json({ error: error instanceof Error ? error.message : String(error) }, 409); }
});
app.post("/api/grid", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const goal = body.goal as Goal;
  if (!goalDetails[goal]) return c.json({ error: "Choose a valid objective first." }, 400);
  if ((await listRuns()).some(r => r.background && r.status === "running")) return c.json({ error: "A background batch is already running. Stop it before starting another." }, 409);
  const key = featherlessKey();
  if (!key) return c.json({ error: "Featherless key is not configured." }, 503);
  try {
    const available = await availableCredits(key);
    if (available < 12) return c.json({ error: "Insufficient available Featherless credits to start three rounds and preserve $10 for the live demo." }, 409);
  } catch (error) { return c.json({ error: error instanceof Error ? error.message : "Cannot check available credits." }, 503); }
  const batchId = crypto.randomUUID();
  const pairs: { victimTier: Tier; godTier: Tier; pairLabel: string }[] = [
    { victimTier: "strong", godTier: "weak", pairLabel: "Strong → Weak" },
    { victimTier: "weak", godTier: "strong", pairLabel: "Weak → Strong" },
    { victimTier: "strong", godTier: "strong", pairLabel: "Strong → Strong" },
  ];
  const started: ReturnType<typeof newRun>[] = [];
  try {
    for (const pair of pairs) started.push(newRun(goal, true, 20, { ...pair, background: true, gridBatchId: batchId }));
    return c.json({ batchId, runs: started.map(r => ({ ...r, context: undefined, past: undefined })) }, 201);
  } catch (error) {
    await Promise.all(started.map(stopRun));
    return c.json({ error: error instanceof Error ? error.message : "Unable to start comparison grid." }, 409);
  }
});
app.post("/api/runs/:id/stop", async (c) => {
  const run = await getRun(c.req.param("id"));
  if (!run) return c.json({ error: "Run not found" }, 404);
  await stopRun(run);
  return c.json(run);
});
app.post("/api/runs/:id/reveal", async (c) => {
  const run = await getRun(c.req.param("id"));
  if (!run) return c.json({ error: "Run not found" }, 404);
  if (run.status === "running") return c.json({ error: "Reveal is available when the round ends" }, 409);
  await revealRun(run);
  return c.json(run);
});

if (mode === "production") {
  await resumeRuns();
  await startSeriesScheduler();
  configureProduction(app);
} else {
  await configureDevelopment(app);
}

/**
 * Determine port based on mode. In production, use the published_port if available.
 * In development, always use the local_port.
 * Ports are managed by the system and injected via the PORT environment variable.
 */
const port = process.env.PORT
  ? parseInt(process.env.PORT, 10)
  : mode === "production"
    ? (config.publish?.published_port ?? config.local_port)
    : config.local_port;

export default { fetch: app.fetch, port, idleTimeout: 255 };

/**
 * Configure routing for production builds.
 *
 * - Streams prebuilt assets from `dist`.
 * - Static files from `public/` are copied to `dist/` by Vite and served at root paths.
 * - Falls back to `index.html` for any other GET so the SPA router can resolve the request.
 */
function configureProduction(app: Hono) {
  app.use("/assets/*", serveStatic({ root: "./dist" }));
  app.get("/favicon.ico", (c) => c.redirect("/favicon.svg", 302));
  app.use(async (c, next) => {
    if (c.req.method !== "GET") return next();

    const path = c.req.path;
    if (path.startsWith("/api/") || path.startsWith("/assets/")) return next();

    const file = Bun.file(`./dist${path}`);
    if (await file.exists()) {
      const stat = await file.stat();
      if (stat && !stat.isDirectory()) {
        return new Response(file);
      }
    }

    return serveStatic({ path: "./dist/index.html" })(c, next);
  });
}

/**
 * Configure routing for development builds.
 *
 * - Boots Vite in middleware mode for transforms.
 * - Static files from `public/` are served at root paths (matching Vite convention).
 * - Mirrors production routing semantics so SPA routes behave consistently.
 */
async function configureDevelopment(app: Hono): Promise<ViteDevServer> {
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });

  app.use("*", async (c, next) => {
    if (c.req.path.startsWith("/api/")) return next();
    if (c.req.path === "/favicon.ico") return c.redirect("/favicon.svg", 302);

    const url = c.req.path;
    try {
      if (url === "/" || url === "/index.html") {
        let template = await Bun.file("./index.html").text();
        template = await vite.transformIndexHtml(url, template);
        return c.html(template, {
          headers: { "Cache-Control": "no-store, must-revalidate" },
        });
      }

      const publicFile = Bun.file(`./public${url}`);
      if (await publicFile.exists()) {
        const stat = await publicFile.stat();
        if (stat && !stat.isDirectory()) {
          return new Response(publicFile, {
            headers: { "Cache-Control": "no-store, must-revalidate" },
          });
        }
      }

      let result;
      try {
        result = await vite.transformRequest(url);
      } catch {
        result = null;
      }

      if (result) {
        return new Response(result.code, {
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "no-store, must-revalidate",
          },
        });
      }

      let template = await Bun.file("./index.html").text();
      template = await vite.transformIndexHtml("/", template);
      return c.html(template, {
        headers: { "Cache-Control": "no-store, must-revalidate" },
      });
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      console.error(error);
      return c.text("Internal Server Error", 500);
    }
  });

  return vite;
}
