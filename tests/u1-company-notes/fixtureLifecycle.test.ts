import { describe, expect, it, vi } from "vitest";
import {
  observeRun,
  projectActivity,
  projectRunnerLine,
  type ObservationPort,
  type Registration,
} from "./fixtureDiagnostics";

const registration: Registration = {
  runId: "11111111-1111-4111-8111-111111111111",
  fixtureId: "22222222-2222-4222-8222-222222222222",
  schema: "u1_test_22222222222242228222222222222222",
  pid: 100,
  applicationName: "u1d_11111111_22222222_admin",
  backendStart: "2026-10-24T00:00:00.000Z",
};
function observation(exitAt: number, exitCode = 0) {
  let time = 0;
  let stopped = false;
  const port: ObservationPort = {
    now: () => time,
    delay: async (ms) => { time += ms; },
    childExit: () => stopped ? 1 : time >= exitAt ? exitCode : null,
    stopChild: vi.fn(async () => { stopped = true; }),
    sample: vi.fn(async () => {}),
    end: vi.fn(async () => {}),
  };
  return port;
}
describe("B1 / NFR6.1 観測器の所有と有限な寿命", () => {
  it("今回登録したbackendの許可metadataだけを返す", () => {
    const row = {
      pid: 100, application_name: registration.applicationName,
      backend_start: registration.backendStart, state: "active",
      wait_event_type: "Lock", wait_event: "advisory", query_ms: 20,
      xact_ms: 30, blockers: [200], query: "PRIVATE SQL",
      password: "PRIVATE PASSWORD", owner: "PRIVATE OWNER",
    };
    const result = projectActivity([registration], [row, { ...row, pid: 999 }]);
    expect(result).toEqual([{
      pid: 100, fixtureId: registration.fixtureId, schema: registration.schema,
      state: "active", waitType: "Lock", waitEvent: "advisory",
      queryMs: 20, xactMs: 30, blockers: [200],
    }]);
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|password|query"/);
  });
  it("PIDが再利用されたbackendと登録のない資源を拒否する", () => {
    expect(() => projectActivity([registration], [{
      pid: 100, application_name: registration.applicationName,
      backend_start: "2026-10-25T00:00:00.000Z",
    }])).toThrow("backend identity mismatch");
    expect(() => projectActivity([{ ...registration, schema: "public" }], []))
      .toThrow("registration rejected");
  });
  it("raw子出力から集計だけを残しSQLや認証値を保存しない", () => {
    expect(projectRunnerLine("      Tests  635 passed (635)"))
      .toBe("Tests  635 passed (635)");
    for (const value of ["password=PRIVATE", "SELECT private FROM notes", "Error: PRIVATE"])
      expect(projectRunnerLine(value)).toBeNull();
  });
  it("子正常終了の最終snapshot後に接続を1回解放する", async () => {
    const port = observation(250);
    expect(await observeRun(port)).toMatchObject({ complete: true, childExit: 0 });
    expect(port.sample).toHaveBeenCalledTimes(4);
    expect(port.end).toHaveBeenCalledOnce();
    expect(port.stopChild).not.toHaveBeenCalled();
  });
  it("子失敗を成功にせず接続とtimer寿命を終了する", async () => {
    const port = observation(100, 1);
    expect(await observeRun(port)).toMatchObject({ complete: false, childExit: 1 });
    expect(port.end).toHaveBeenCalledOnce();
    expect(port.stopChild).not.toHaveBeenCalled();
  });
  it("観測query失敗時にも子exitを回収し接続を解放する", async () => {
    const port = observation(200);
    vi.mocked(port.sample).mockRejectedValueOnce(new Error("PRIVATE SQL ERROR"));
    const result = await observeRun(port);
    expect(result).toMatchObject({ complete: false, childExit: 0, reason: "observation-failed" });
    expect(JSON.stringify(result)).not.toContain("PRIVATE");
    expect(port.end).toHaveBeenCalledOnce();
    expect(port.sample).toHaveBeenCalledOnce();
  });
  it("観測600回/60秒上限でも子の成功へ置き換えず90秒で自分の子だけ停止する", async () => {
    const port = observation(Infinity);
    expect(await observeRun(port)).toMatchObject({ complete: false, reason: "child-deadline" });
    expect(port.sample).toHaveBeenCalledTimes(600);
    expect(port.now()).toBe(90000);
    expect(port.stopChild).toHaveBeenCalledOnce();
    expect(port.end).toHaveBeenCalledOnce();
  });
  it("観測接続の解放失敗を成功扱いにしない", async () => {
    const port = observation(0);
    vi.mocked(port.end).mockRejectedValueOnce(new Error("PRIVATE CLOSE"));
    expect(await observeRun(port)).toMatchObject({ complete: false, reason: "observer-close-failed" });
  });
});
