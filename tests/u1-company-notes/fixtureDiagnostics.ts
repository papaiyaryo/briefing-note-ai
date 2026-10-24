import { appendFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export type Registration = {
  runId: string;
  fixtureId: string;
  schema: string;
  pid: number;
  applicationName: string;
  backendStart: string;
};
export function projectActivity(
  registrations: Registration[],
  rows: Record<string, unknown>[],
) {
  for (const item of registrations) {
    if (!/^u1_test_[a-f0-9]{32}$/.test(item.schema) ||
      !Number.isSafeInteger(item.pid) || item.pid <= 0 ||
      !/^u1d_[a-z0-9_]+$/.test(item.applicationName) ||
      item.applicationName.length > 63 || !Number.isFinite(Date.parse(item.backendStart)))
      throw new Error("registration rejected");
  }
  return rows.flatMap((row) => {
    const registration = registrations.find((item) => item.pid === row.pid);
    if (!registration) return [];
    if (row.application_name !== registration.applicationName ||
      new Date(String(row.backend_start)).toISOString() !== registration.backendStart)
      throw new Error("backend identity mismatch");
    return [{
      pid: registration.pid, fixtureId: registration.fixtureId,
      schema: registration.schema, state: row.state,
      waitType: row.wait_event_type, waitEvent: row.wait_event,
      queryMs: row.query_ms, xactMs: row.xact_ms,
      blockers: Array.isArray(row.blockers) ? row.blockers.filter(Number.isSafeInteger) : [],
      ...(Array.isArray(row.locks) ? { locks: row.locks.map((lock) => ({
        type: lock.type, mode: lock.mode, granted: lock.granted,
        relationClass: lock.relationClass, classId: lock.classId,
        objectId: lock.objectId,
      })) } : {}),
    }];
  });
}
export function projectRunnerLine(line: string): string | null {
  const clean = line.replace(/\u001b\[[0-9;]*m/g, "").trim();
  if (/^(Test Files|Tests)\s+[0-9 |()a-z]+$/.test(clean)) return clean;
  if (/^Duration\s+[0-9.]+s(?:\s+\([0-9.a-z ,]+\))?$/.test(clean)) return clean;
  if (clean === "Error: Test timed out in 5000ms.") return clean;
  return null;
}
export type ObservationPort = {
  now(): number;
  delay(ms: number): Promise<void>;
  childExit(): number | null;
  stopChild(): Promise<void>;
  sample(): Promise<void>;
  end(): Promise<void>;
};
export async function observeRun(port: ObservationPort) {
  const started = port.now();
  let count = 0;
  let reason: string | undefined;
  let exit: number | null = null;
  try {
    while (true) {
      exit = port.childExit();
      if (port.now() - started >= 90000 && exit === null) {
        reason = "child-deadline";
        await port.stopChild();
        exit = port.childExit();
        break;
      }
      if (!reason && (count >= 600 || port.now() - started >= 60000))
        reason = "observation-deadline";
      if (!reason) {
        count++;
        try { await port.sample(); }
        catch { reason = "observation-failed"; }
      }
      if (exit !== null) break;
      await port.delay(100);
    }
  } catch {
    reason = "control-failed";
  } finally {
    try { await port.end(); }
    catch { reason = "observer-close-failed"; }
  }
  return { complete: exit === 0 && !reason, childExit: exit, reason, samples: count };
}

type DiagnosticClient = {
  query(sql: string): Promise<{ rows: { pid: number; backend_start: string }[] }>;
};

// 通常試験は副作用なし。観測runだけが独立した小さな資源対応表を持つ。
export function fixtureDiagnostic(schema: string) {
  const runId = process.env.U1_DIAGNOSTIC_RUN;
  if (!runId) return undefined;
  const directory = process.env.U1_DIAGNOSTIC_DIR;
  const workspace = resolve(fileURLToPath(new URL("../../", import.meta.url)));
  const expected = resolve(workspace,
    "aidlc/spaces/default/intents/261011-company-data-management/.aidlc-engine/dispatch/u1-wait-diagnostics", runId);
  if (!/^[a-f0-9-]{36}$/.test(runId) || !directory || resolve(directory) !== expected ||
    !/^u1_test_[a-f0-9]{32}$/.test(schema)) throw new Error("diagnostic scope rejected");
  const fixtureId = randomUUID();
  const stem = `u1d_${runId.replaceAll("-", "").slice(0, 12)}_${fixtureId.replaceAll("-", "").slice(0, 12)}`;
  const file = join(directory, `${process.pid}-${fixtureId}.jsonl`);
  const started = performance.now();
  const write = (event: Record<string, unknown>) =>
    appendFileSync(file, JSON.stringify({ runId, fixtureId, schema,
      elapsedMs: Math.round(performance.now() - started), ...event }) + "\n");
  write({ kind: "fixture" });
  return {
    applicationName: (role: "a" | "p") => `${stem}_${role}`,
    stage: (stage: string) => {
      if (!/^[a-z0-9:-]{1,80}$/.test(stage)) throw new Error("stage rejected");
      write({ kind: "stage", stage });
    },
    async register(client: DiagnosticClient, role: "a" | "p") {
      const { rows } = await client.query(
        "select pg_backend_pid() as pid,backend_start::text from pg_stat_activity where pid=pg_backend_pid()",
      );
      const row = rows[0];
      write({ kind: "backend", pid: row.pid, backendStart: new Date(row.backend_start).toISOString(),
        applicationName: `${stem}_${role}` });
    },
  };
}
