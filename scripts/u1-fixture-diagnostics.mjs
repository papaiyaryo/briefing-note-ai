import { Client } from "pg";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { observeRun, projectActivity, projectRunnerLine } from "../tests/u1-company-notes/fixtureDiagnostics.ts";

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (args.length !== 5 || args[0] !== "--run" || !["first", "confirm"].includes(args[1]) ||
  args[2] !== "--" || args[3] !== "npm" || args[4] !== "test" || !process.version.startsWith("v22."))
  throw new Error("diagnostic invocation rejected");
const connectionString = "postgresql://workspace_test_admin:local-test-only@127.0.0.1:55432/workspace_test";
const runId = randomUUID();
const directory = join(workspace,
  "aidlc/spaces/default/intents/261011-company-data-management/.aidlc-engine/dispatch/u1-wait-diagnostics", runId);
await mkdir(directory, { recursive: true });
const observer = new Client({ connectionString, connectionTimeoutMillis: 1000,
  query_timeout: 1000, application_name: `u1d_${runId.replaceAll("-", "").slice(0, 12)}_observer`,
  options: "-c default_transaction_read_only=on -c statement_timeout=1000",
});
const registrations = new Map();
const fixtures = new Map();
const fileSizes = new Map();
const snapshots = [];
const summaries = [];
const stages = [];
let remainingSchemas = null;
let child;
let exit = null;
let observerClosed = false;
let childClosed = false;
const started = performance.now();

// JSONLは今回の対応表だけ。任意の子stdoutやDB error detailは保存しない。
async function loadRegistrations() {
  for (const name of await readdir(directory)) {
    if (!/^\d+-[a-f0-9-]{36}\.jsonl$/.test(name)) continue;
    const path = join(directory, name);
    const size = (await stat(path)).size;
    if (fileSizes.get(name) === size) continue;
    if (size > 2000000) throw new Error("diagnostic registration limit");
    const content = await readFile(path, "utf8");
    const lines = content.split("\n");
    if (lines.at(-1) !== "") continue;
    fileSizes.set(name, size);
    for (const line of lines.filter(Boolean)) {
      const event = JSON.parse(line);
      if (event.runId !== runId || !/^[a-f0-9-]{36}$/.test(event.fixtureId) ||
        !/^u1_test_[a-f0-9]{32}$/.test(event.schema)) throw new Error("registration scope rejected");
      const key = `${event.fixtureId}:${event.elapsedMs}:${event.kind}:${event.stage ?? event.pid ?? ""}`;
      if (fixtures.has(key)) continue;
      fixtures.set(key, event.schema);
      if (event.kind === "backend") {
        if ([...registrations.values()].some((item) =>
          item.applicationName === event.applicationName && item.fixtureId !== event.fixtureId))
          throw new Error("application identity collision");
        registrations.set(event.pid, {
        runId, fixtureId: event.fixtureId, schema: event.schema, pid: event.pid,
        applicationName: event.applicationName, backendStart: event.backendStart,
        });
      }
      if (event.kind === "stage" && /^[a-z0-9:-]{1,80}$/.test(event.stage))
        stages.push({ fixtureId: event.fixtureId, schema: event.schema,
          elapsedMs: event.elapsedMs, stage: event.stage });
    }
  }
}

async function sample() {
  await loadRegistrations();
  const registry = [...registrations.values()];
  projectActivity(registry, []);
  if (!registry.length) return;
  const { rows } = await observer.query(`
    select a.pid,a.application_name,a.backend_start::text,a.state,a.wait_event_type,a.wait_event,
      round(extract(epoch from (clock_timestamp()-a.query_start))*1000)::float8 as query_ms,
      round(extract(epoch from (clock_timestamp()-a.xact_start))*1000)::float8 as xact_ms,
      pg_blocking_pids(a.pid) as blockers,
      (select coalesce(json_agg(json_build_object('type',l.locktype,'mode',l.mode,'granted',l.granted,
        'relationClass',case when n.nspname=any($2::text[]) then 'fixture'
          when n.nspname='auth' and c.relname='users' then 'shared-bootstrap' else 'other' end,
        'classId',case when l.locktype='advisory' then l.classid else null end,
        'objectId',case when l.locktype='advisory' then l.objid else null end)), '[]'::json)
        from pg_locks l left join pg_class c on c.oid=l.relation
        left join pg_namespace n on n.oid=c.relnamespace where l.pid=a.pid) as locks
    from pg_stat_activity a where a.datname=current_database() and a.pid=any($1::int[])
  `, [registry.map((item) => item.pid), registry.map((item) => item.schema)]);
  const projected = projectActivity(registry, rows);
  // 直接blockerだけを、他DBの情報を収集せず分類する。
  const ids = [...new Set(projected.flatMap((row) => row.blockers))];
  const blockers = ids.length ? (await observer.query(
    "select pid,state,wait_event_type,wait_event from pg_stat_activity where datname=current_database() and pid=any($1::int[])", [ids],
  )).rows.map((row) => ({ pid: row.pid, registered: registrations.has(row.pid),
    state: row.state, waitType: row.wait_event_type, waitEvent: row.wait_event })) : [];
  snapshots.push({ elapsedMs: Math.round(performance.now() - started), activity: projected, blockers });
  if (childClosed) remainingSchemas = (await observer.query(
    "select nspname from pg_namespace where nspname=any($1::text[])",
    [[...new Set(registry.map((item) => item.schema))]],
  )).rows.map((row) => row.nspname);
}

function consume(stream) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    if (buffer.length > 4096) buffer = "";
    for (const line of lines) {
      if (line.length > 4096) continue;
      const safe = projectRunnerLine(line);
      if (safe) { summaries.push(safe); console.log(safe); }
    }
  });
}

let result;
try {
  const url = new URL(connectionString);
  if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.port !== "55432" || url.pathname !== "/workspace_test")
    throw new Error("diagnostic database rejected");
  await observer.connect();
  const database = (await observer.query("select current_database() as name")).rows[0].name;
  if (database !== "workspace_test") throw new Error("diagnostic database rejected");
  child = spawn(process.env.ComSpec ?? "C:\\Windows\\System32\\cmd.exe", ["/d", "/s", "/c", "npm test"], {
    cwd: workspace, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PATH: `${dirname(process.execPath)};${process.env.PATH ?? ""}`,
      U1_TEST_DATABASE_URL: connectionString, U1_DIAGNOSTIC_RUN: runId, U1_DIAGNOSTIC_DIR: directory },
  });
  child.on("error", () => { exit = 1; childClosed = true; });
  child.on("close", (code) => { exit = code ?? 1; childClosed = true; });
  consume(child.stdout);
  consume(child.stderr);
  result = await observeRun({ now: () => performance.now(),
    delay: (ms) => new Promise((done) => setTimeout(done, ms)), childExit: () => exit,
    stopChild: async () => { child.kill(); }, sample,
    end: async () => { await observer.end(); observerClosed = true; },
  });
} catch {
  result = { complete: false, childExit: exit, reason: "diagnostic-start-failed" };
} finally {
  if (!observerClosed) {
    try { await observer.end(); observerClosed = true; }
    catch { /* 未解放は結果へ残し、成功へ置き換えない。 */ }
  }
}
const output = { runId, label: args[1], ...result, childClosed, observerClosed,
  registrations: [...registrations.values()], stages, snapshots, summaries, remainingSchemas };
await writeFile(join(directory, "result.json"), JSON.stringify(output, null, 2));
console.log(JSON.stringify({ runId, complete: output.complete, childExit: output.childExit,
  reason: output.reason, samples: output.samples, childClosed, observerClosed }));
process.exitCode = output.complete && childClosed && observerClosed ? 0 : 1;
