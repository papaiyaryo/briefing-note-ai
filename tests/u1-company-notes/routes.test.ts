import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { WorkspaceDatabase } from "../../src/lib/server/workspace/database";
import { createWorkspaceHandler } from "../../src/lib/server/workspace/http";
import { runtimeFixture } from "./runtimeFixture";
import { id, manualCandidate, emptyStructure } from "./fixtures";
import { withRequestDeadline } from "../../src/lib/server/workspace/requestScope";

describe("C4 HTTP routes with real persistence", () => {
  let f: Awaited<ReturnType<typeof runtimeFixture>>;
  let handle: ReturnType<typeof createWorkspaceHandler>;
  beforeAll(async () => {
    f = await runtimeFixture();
    handle = createWorkspaceHandler(() => f);
  });
  afterAll(async () => {
    await f?.close();
  });
  const call = (
    path: string,
    method = "GET",
    body?: unknown,
    headers: Record<string, string> = {},
  ) =>
    handle(
      new Request(`http://localhost/api/v1/${path}`, {
        method,
        headers: {
          Cookie: f.cookie,
          Origin: "http://localhost",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      }),
    );
  async function company() {
    const companyId = id();
    const input = {
      operationId: id(),
      companyId,
      fields: { name: "架空企業" },
    };
    const response = await call("companies", "POST", input);
    expect(response.status).toBe(201);
    return { companyId, input };
  }
  it("creates once, replays with 200 and returns no-store", async () => {
    const c = await company();
    const r = await call("companies", "POST", c.input);
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe("private, no-store");
    expect((await r.json()).companyId).toBe(c.companyId);
  });
  it("reads and patches company independently", async () => {
    const c = await company();
    const old = await (await call(`companies/${c.companyId}`)).json();
    const patch = {
      operationId: id(),
      expectedVersion: old.version,
      changes: { personalNote: "本人の印象" },
    };
    expect(
      (await call(`companies/${c.companyId}`, "PATCH", patch)).status,
    ).toBe(200);
    expect(
      (
        await call(`companies/${c.companyId}`, "PATCH", {
          ...patch,
          operationId: id(),
        })
      ).status,
    ).toBe(409);
  });
  it("memo create/list/read/update and comparison snapshot preserve contracts", async () => {
    const c = await company(),
      memoId = id();
    const created = await call(`companies/${c.companyId}/memos`, "POST", {
      operationId: id(),
      memoId,
      candidate: { ...manualCandidate(), structuredContent: emptyStructure() },
    });
    expect(created.status).toBe(201);
    const page = await (
      await call(`companies/${c.companyId}/memos?limit=1`)
    ).json();
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).not.toHaveProperty("markdown");
    const memo = await (
      await call(`companies/${c.companyId}/memos/${memoId}`)
    ).json();
    expect(
      (
        await call(`companies/${c.companyId}/memos/${memoId}`, "PATCH", {
          operationId: id(),
          expectedVersion: memo.version,
          changes: { comparisonReason: "本人の比較理由" },
        })
      ).status,
    ).toBe(200);
    const snapshot = await call("comparison-sources", "POST", {
      selected: [{ companyId: c.companyId, memoId }],
    });
    expect(snapshot.status).toBe(200);
    expect((await snapshot.json()).sources[0].memo.comparisonReason).toBe(
      "本人の比較理由",
    );
  });
  it("confirms deletion, commits atomically and resolves operation", async () => {
    const c = await company();
    const confirmation = await (
      await call("deletion-confirmations", "POST", {
        companyId: c.companyId,
        memoId: null,
      })
    ).json();
    const input = {
      operationId: id(),
      confirmationId: confirmation.confirmationId,
    };
    expect((await call("deletions", "POST", input)).status).toBe(200);
    expect((await call("deletions", "POST", input)).status).toBe(200);
    expect((await call(`companies/${c.companyId}`)).status).toBe(404);
    expect(
      (await (await call(`operations/${input.operationId}`)).json()).state,
    ).toBe("committed");
    expect((await (await call(`operations/${id()}`)).json()).state).toBe(
      "unknown",
    );
  });
  it("unknown operation outcome is not uncommitted", async () => {
    const c = await company();
    const expectedVersion = (await f.repo.readCompany(f.principal, c.companyId))
      .version;
    let commits = 0;
    f.database.faults.afterCommit = () => {
      if (++commits === 2) throw new Error("response lost");
    };
    const operationId = id();
    const r = await call(`companies/${c.companyId}`, "PATCH", {
      operationId,
      expectedVersion,
      changes: { industry: "架空" },
    });
    f.database.faults.afterCommit = undefined;
    expect(r.status).toBe(503);
    expect((await r.json()).error.code).toBe("operation_unknown");
    expect((await (await call(`operations/${operationId}`)).json()).state).toBe(
      "committed",
    );
  });
  it.each([
    "board?showEnded=maybe",
    "board?extra=1",
    "board?showEnded=true&showEnded=false",
    "companies/no-uuid",
    "companies/11111111-1111-4111-8111-111111111111/memos?limit=0",
    "operations/no-uuid",
  ])("rejects malformed path/query %s", async (path) => {
    expect((await call(path)).status).toBe(400);
  });
  it("rejects unknown body keys and invalid JSON/content-type", async () => {
    expect(
      (
        await call("companies", "POST", {
          operationId: id(),
          companyId: id(),
          fields: { name: "x" },
          ownerId: id(),
        })
      ).status,
    ).toBe(400);
    expect(
      (await call("companies", "POST", {}, { "Content-Type": "text/plain" }))
        .status,
    ).toBe(400);
  });
  it("checks authentication and Origin before persistence", async () => {
    expect((await call("board", "GET", undefined, { Cookie: "" })).status).toBe(
      401,
    );
    expect(
      (await call("companies", "POST", {}, { Origin: "https://other.test" }))
        .status,
    ).toBe(403);
  });
  it("enforces actual streamed one MiB bytes, independent of claimed length", async () => {
    const r = await call("companies", "POST", { padding: "あ".repeat(350000) });
    expect(r.status).toBe(413);
    expect((await r.json()).error.code).toBe("payload_too_large");
  });
  it("expires confirmations with 410", async () => {
    const c = await company();
    const confirmation = await (
      await call("deletion-confirmations", "POST", {
        companyId: c.companyId,
        memoId: null,
      })
    ).json();
    await f.db.admin.query(
      `update ${f.db.schema}.deletion_snapshots set expires_at=now()-interval '1 second' where confirmation_id=$1`,
      [confirmation.confirmationId],
    );
    expect(
      (
        await call("deletions", "POST", {
          operationId: id(),
          confirmationId: confirmation.confirmationId,
        })
      ).status,
    ).toBe(410);
  });
  it("board defaults false and returns all status counts", async () => {
    const r = await call("board");
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.showEnded).toBe(false);
    expect(Object.keys(b.countsByStatus)).toHaveLength(8);
  });
  it("Auth time consumes the same remaining server deadline", async () => {
    let entered = false;
    await expect(
      withRequestDeadline(async () => {
        await new Promise((resolve) => setTimeout(resolve, 55));
        return f.database.transaction(f.principal, async () => {
          entered = true;
        });
      }, 25),
    ).rejects.toMatchObject({ code: "unavailable" });
    await new Promise((resolve) => setTimeout(resolve, 70));
    expect(entered).toBe(false);
    expect((await f.repo.listCards(f.principal)).length).toBeGreaterThan(0);
  });
  it("deadline destroys an in-flight write and prevents late commit", async () => {
    const c = await company();
    const before = await f.repo.readCompany(f.principal, c.companyId);
    await expect(
      withRequestDeadline(
        () =>
          f.database.transaction(f.principal, async (q) => {
            await q.query(
              `update ${f.db.schema}.companies set name='timeout-only' where company_id=$1`,
              [c.companyId],
            );
            await q.query("select pg_sleep(0.15)");
          }),
        40,
      ),
    ).rejects.toMatchObject({ code: "unavailable" });
    await new Promise((resolve) => setTimeout(resolve, 180));
    expect((await f.repo.readCompany(f.principal, c.companyId)).name).toBe(
      before.name,
    );
  });
  it("制御transport: COMMIT到達後40msの期限はoperation_unknown", async () => {
    // この1caseだけtransport/時計を制御。原子性・RLS・応答途絶/同ID照会は他の実PGcaseで検証する。
    const realSetTimeout = globalThis.setTimeout,
      realClearTimeout = globalThis.clearTimeout,
      realPerformance = globalThis.performance;
    const barrier = () => {
      let resolve!: () => void;
      const promise = new Promise<void>((done) => {
        resolve = done;
      });
      return { promise, resolve };
    };
    const commitReached = barrier(),
      afterCommitReached = barrier(),
      advanceClock = barrier(),
      clockAdvanced = barrier(),
      resumeAfterCommit = barrier();
    async function bounded<T>(promise: Promise<T>) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          promise,
          new Promise<never>((_, reject) => {
            timer = realSetTimeout(
              () => reject(new Error("制御barrierが有限上限内に完了しません")),
              1000,
            );
          }),
        ]);
      } finally {
        if (timer !== undefined) realClearTimeout(timer);
      }
    }
    const query = vi.fn(async (sql: string) => {
      if (sql === "COMMIT") commitReached.resolve();
      if (sql.includes("from pg_roles"))
        return { rows: [{ rolsuper: false, rolbypassrls: false }] };
      if (sql.includes(".session_lock("))
        return {
          rows: [
            {
              user_id: f.principal.userId,
              revoked_at: null,
              absolute_expires_at: new Date(Date.now() + 60000),
              last_used_at: new Date(),
            },
          ],
        };
      return { rows: [] };
    });
    const release = vi.fn(),
      client = { query, release },
      connect = vi.fn(async () => client),
      end = vi.fn(async () => undefined),
      database = new WorkspaceDatabase({
        schema: f.db.schema,
        pool: { options: { max: 3 }, connect, end } as unknown as Pool,
      });
    let observed: Promise<unknown> | undefined,
      continuation: Promise<void> | undefined,
      continued = false;
    database.faults.afterCommit = () => {
      afterCommitReached.resolve();
      continuation = (async () => {
        await advanceClock.promise;
        // fake timerのcallbackも本来のrequest AsyncLocalStorage内で実行する。
        await vi.advanceTimersByTimeAsync(40);
        clockAdvanced.resolve();
        await resumeAfterCommit.promise;
        continued = true;
      })();
      return continuation;
    };
    try {
      vi.useFakeTimers({
        toFake: ["setTimeout", "clearTimeout", "performance"],
      });
      const started = performance.now();
      const request = withRequestDeadline(
        () => database.transaction(f.principal, async () => true),
        40,
      );
      // clockを進める前に拒否を観測し、未処理rejectionを残さない。
      observed = request.then(
        (value) => ({ state: "fulfilled", value }),
        (error) => ({ state: "rejected", error }),
      );
      await bounded(commitReached.promise);
      await bounded(afterCommitReached.promise);
      expect(query.mock.calls.filter(([sql]) => sql === "COMMIT")).toHaveLength(
        1,
      );
      expect(continued).toBe(false);
      expect(performance.now() - started).toBe(0);
      advanceClock.resolve();
      await bounded(clockAdvanced.promise);
      expect(performance.now() - started).toBe(40);
      expect(await bounded(observed)).toMatchObject({
        state: "rejected",
        error: { code: "operation_unknown" },
      });
      expect(continued).toBe(false);
    } finally {
      advanceClock.resolve();
      resumeAfterCommit.resolve();
      try {
        if (observed) await bounded(observed);
        if (continuation) await bounded(continuation);
        await Promise.resolve();
        await database.close();
        if (vi.isFakeTimers()) expect(vi.getTimerCount()).toBe(0);
      } finally {
        if (vi.isFakeTimers()) vi.clearAllTimers();
        vi.useRealTimers();
      }
    }
    expect(continued).toBe(true);
    expect(connect).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledExactlyOnceWith(true);
    expect(end).toHaveBeenCalledOnce();
    expect(query.mock.calls.filter(([sql]) => sql === "COMMIT")).toHaveLength(
      1,
    );
    expect(vi.isFakeTimers()).toBe(false);
    expect(globalThis.setTimeout).toBe(realSetTimeout);
    expect(globalThis.performance).toBe(realPerformance);
    expect((await f.repo.listCards(f.principal)).length).toBeGreaterThan(0);
  });
});
