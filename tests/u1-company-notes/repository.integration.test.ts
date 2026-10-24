import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { WorkspaceDatabase } from "../../src/lib/server/workspace/database";
import { WorkspaceRepository } from "../../src/lib/server/workspace/repository";
import type { Principal } from "../../src/lib/workspace/contracts";
import { setupDatabase } from "./helpers";
import { OWNER_A, OWNER_B, id, manualCandidate } from "./fixtures";

describe("実repository / BR6原子性・再送・削除", () => {
  let db: Awaited<ReturnType<typeof setupDatabase>>;
  let database: WorkspaceDatabase;
  let repo: WorkspaceRepository;
  let principal: Principal;
  let other: Principal;
  beforeAll(async () => {
    db = await setupDatabase();
    const pool = new Pool({
      host: "127.0.0.1",
      port: Number(
        new URL(
          process.env.U1_TEST_DATABASE_URL ??
            "postgresql://localhost:55432/workspace_test",
        ).port,
      ),
      database: "workspace_test",
      user: "workspace_test_app",
      password: "local-app-test-only",
      max: 3,
    });
    database = new WorkspaceDatabase({ pool, schema: db.schema });
    repo = new WorkspaceRepository(database, Buffer.alloc(32, 9));
    principal = { userId: OWNER_A, sessionHash: "a".repeat(64) } as Principal;
    other = { userId: OWNER_B, sessionHash: "b".repeat(64) } as Principal;
    for (const p of [principal, other])
      await db.admin.query(
        `insert into ${db.schema}.app_sessions(session_hash,user_id,auth_session_id,absolute_expires_at) values($1,$2,'test',clock_timestamp()+interval '7 days')`,
        [p.sessionHash, p.userId],
      );
  });
  afterAll(async () => {
    await database?.close();
    await db?.close();
  });
  const create = async () => {
    const input = {
      operationId: id(),
      companyId: id(),
      fields: { name: "架空社" },
    };
    const result = await repo.createCompany(principal, input);
    return {
      input,
      result,
      company: await repo.readCompany(principal, input.companyId),
    };
  };
  it("AC2.1/1.2 別クライアント再取得・同名別ID", async () => {
    const a = await create(),
      b = await create();
    expect(a.company.name).toBe("架空社");
    expect(a.company.companyId).not.toBe(b.company.companyId);
    await expect(
      repo.readCompany(other, a.company.companyId),
    ).rejects.toMatchObject({ code: "not_found" });
  });
  it("同時再送は同じ結果1件", async () => {
    const input = {
      operationId: id(),
      companyId: id(),
      fields: { name: "再送社" },
    };
    const [a, b] = await Promise.all([
      repo.createCompany(principal, input),
      repo.createCompany(principal, input),
    ]);
    expect(a.outcome).toEqual(b.outcome);
    expect([a.replayed, b.replayed].filter(Boolean)).toHaveLength(1);
    await expect(
      repo.createCompany(principal, { ...input, fields: { name: "別内容" } }),
    ).rejects.toMatchObject({ code: "operation_reused" });
  });
  it("AC6.3 古い版は変更・操作記録とも残さない", async () => {
    const { company } = await create();
    await repo.updateCompany(principal, company.companyId, {
      operationId: id(),
      expectedVersion: company.version,
      changes: { name: "更新後" },
    });
    const operationId = id();
    await expect(
      repo.updateCompany(principal, company.companyId, {
        operationId,
        expectedVersion: company.version,
        changes: { name: "古い" },
      }),
    ).rejects.toMatchObject({ code: "version_conflict" });
    expect((await repo.readCompany(principal, company.companyId)).name).toBe(
      "更新後",
    );
    expect(await repo.lookupOperation(principal, operationId)).toEqual({
      state: "unknown",
    });
  });
  it("本文だけ更新して構造と企業項目版を保持", async () => {
    const { company } = await create();
    const memoId = id();
    await repo.createMemo(principal, company.companyId, {
      operationId: id(),
      memoId,
      candidate: manualCandidate(),
    });
    const memo = await repo.readMemo(principal, company.companyId, memoId);
    await repo.updateMemo(principal, company.companyId, memoId, {
      operationId: id(),
      expectedVersion: memo.version,
      changes: { markdown: "編集済" },
    });
    expect(
      (await repo.readMemo(principal, company.companyId, memoId))
        .structuredContent,
    ).toBeNull();
    expect((await repo.readCompany(principal, company.companyId)).version).toBe(
      company.version,
    );
  });
  it("AC6.5 確認後の同数メモ編集を検出し全件維持", async () => {
    const { company } = await create();
    const memoId = id();
    await repo.createMemo(principal, company.companyId, {
      operationId: id(),
      memoId,
      candidate: manualCandidate(),
    });
    const snapshot = await repo.confirmDeletion(principal, {
      companyId: company.companyId,
      memoId: null,
    });
    const memo = await repo.readMemo(principal, company.companyId, memoId);
    await repo.updateMemo(principal, company.companyId, memoId, {
      operationId: id(),
      expectedVersion: memo.version,
      changes: { comparisonReason: "本人の理由" },
    });
    await expect(
      repo.deleteConfirmed(principal, {
        operationId: id(),
        confirmationId: snapshot.confirmationId,
      }),
    ).rejects.toMatchObject({ code: "confirmation_changed" });
    expect(
      (await repo.listMemos(principal, company.companyId, {})).items,
    ).toHaveLength(1);
  });
  it("削除成功再送を期限/対象チェックより先に返しID再利用拒否", async () => {
    const { company, input } = await create();
    const snapshot = await repo.confirmDeletion(principal, {
      companyId: company.companyId,
      memoId: null,
    });
    const request = {
      operationId: id(),
      confirmationId: snapshot.confirmationId,
    };
    const result = await repo.deleteConfirmed(principal, request);
    await db.admin.query(
      `update ${db.schema}.deletion_snapshots set expires_at=clock_timestamp()-interval '1 hour' where confirmation_id=$1`,
      [snapshot.confirmationId],
    );
    expect((await repo.deleteConfirmed(principal, request)).outcome).toEqual(
      result.outcome,
    );
    await expect(
      repo.createCompany(principal, { ...input, operationId: id() }),
    ).rejects.toMatchObject({ code: "operation_reused" });
  });
  it("故障で変更と操作結果をともにrollback", async () => {
    const input = {
      operationId: id(),
      companyId: id(),
      fields: { name: "失敗社" },
    };
    database.faults.beforeCommit = () => {
      throw new Error("injected failure");
    };
    await expect(repo.createCompany(principal, input)).rejects.toBeDefined();
    database.faults.beforeCommit = undefined;
    expect(await repo.lookupOperation(principal, input.operationId)).toEqual({
      state: "unknown",
    });
    await expect(
      repo.readCompany(principal, input.companyId),
    ).rejects.toMatchObject({ code: "not_found" });
  });
  const deletionFixture = async (kind: "company" | "memo") => {
    const { company } = await create();
    const memoId = id();
    await repo.createMemo(principal, company.companyId, {
      operationId: id(),
      memoId,
      candidate: manualCandidate(),
    });
    const snapshot = await repo.confirmDeletion(principal, {
      companyId: company.companyId,
      memoId: kind === "memo" ? memoId : null,
    });
    return {
      company,
      memoId,
      snapshot,
      request: {
        operationId: id(),
        confirmationId: snapshot.confirmationId,
      },
    };
  };
  it.each(["company", "memo"] as const)(
    "BR6.6 %s 親ロック待ち中の期限超過は410・対象と操作不変",
    async (kind) => {
      const { company, memoId, snapshot, request } =
        await deletionFixture(kind);
      const expires = Date.now() + 60_000;
      await db.admin.query(
        `update ${db.schema}.deletion_snapshots set expires_at=$1 where confirmation_id=$2`,
        [new Date(expires), snapshot.confirmationId],
      );
      const blocker = await db.connect();
      let pending: Promise<unknown> | undefined;
      let clock: ReturnType<typeof vi.spyOn> | undefined;
      try {
        await blocker.query("BEGIN");
        await blocker.query("select set_config('app.owner_id',$1,true)", [
          principal.userId,
        ]);
        await blocker.query(
          `select company_id from ${db.schema}.companies where company_id=$1 FOR UPDATE`,
          [company.companyId],
        );
        const pid = (await blocker.query("select pg_backend_pid() as pid"))
          .rows[0].pid;
        // 実PGがこの親ロックを待っていることを有限barrierで確認する。
        pending = repo.deleteConfirmed(principal, request);
        void pending.catch(() => undefined);
        let waiting = false;
        for (let attempt = 0; attempt < 100; attempt++) {
          const active = await db.admin.query(
            "select 1 from pg_stat_activity where $1=ANY(pg_blocking_pids(pid)) and wait_event_type='Lock'",
            [pid],
          );
          if (active.rowCount) {
            waiting = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        expect(waiting, "削除処理が親ロックに到達").toBe(true);
        clock = vi.spyOn(Date, "now").mockReturnValue(expires + 1);
        await blocker.query("ROLLBACK");
        await expect(pending).rejects.toMatchObject({
          code: "confirmation_expired",
        });
        expect(await repo.readCompany(principal, company.companyId)).toEqual(
          company,
        );
        expect(
          (await repo.readMemo(principal, company.companyId, memoId)).markdown,
        ).toBe(manualCandidate().markdown);
        expect(
          await repo.lookupOperation(principal, request.operationId),
        ).toEqual({ state: "unknown" });
      } finally {
        clock?.mockRestore();
        await blocker.query("ROLLBACK");
        await pending?.catch(() => undefined);
        await blocker.end();
      }
    },
  );
  it("BR6.6 now=expiryでは対象と操作記録を変更しない", async () => {
    const { company, memoId, snapshot, request } =
      await deletionFixture("company");
    const expires = Date.now() + 60_000;
    await db.admin.query(
      `update ${db.schema}.deletion_snapshots set expires_at=$1 where confirmation_id=$2`,
      [new Date(expires), snapshot.confirmationId],
    );
    const clock = vi.spyOn(Date, "now").mockReturnValue(expires);
    try {
      await expect(
        repo.deleteConfirmed(principal, request),
      ).rejects.toMatchObject({ code: "confirmation_expired" });
      expect(await repo.readCompany(principal, company.companyId)).toEqual(
        company,
      );
      expect(
        (await repo.readMemo(principal, company.companyId, memoId)).memoId,
      ).toBe(memoId);
      expect(
        await repo.lookupOperation(principal, request.operationId),
      ).toEqual({ state: "unknown" });
    } finally {
      clock.mockRestore();
    }
  });
  it("BR6.6 期限内のメモ削除は親を保持する", async () => {
    const { company, memoId, request } = await deletionFixture("memo");
    const result = await repo.deleteConfirmed(principal, request);
    expect(result.outcome.action).toBe("memo_delete");
    expect(await repo.readCompany(principal, company.companyId)).toEqual(
      company,
    );
    await expect(
      repo.readMemo(principal, company.companyId, memoId),
    ).rejects.toMatchObject({ code: "not_found" });
  });
  it("BR6.5 確定メモ削除は期限後も同じ結果を返す", async () => {
    const { snapshot, request } = await deletionFixture("memo");
    const result = await repo.deleteConfirmed(principal, request);
    await db.admin.query(
      `update ${db.schema}.deletion_snapshots set expires_at=clock_timestamp()-interval '1 hour' where confirmation_id=$1`,
      [snapshot.confirmationId],
    );
    expect(await repo.deleteConfirmed(principal, request)).toEqual({
      outcome: result.outcome,
      replayed: true,
    });
  });
  it("COMMIT応答途絶はunknown、別接続で確定操作を照合", async () => {
    const input = {
      operationId: id(),
      companyId: id(),
      fields: { name: "確定社" },
    };
    database.faults.afterCommit = () => {
      throw new Error("response lost");
    };
    await expect(repo.createCompany(principal, input)).rejects.toMatchObject({
      code: "operation_unknown",
    });
    database.faults.afterCommit = undefined;
    expect(
      (await repo.lookupOperation(principal, input.operationId)).state,
    ).toBe("committed");
  });
  it("cursorは本人と企業に結び、重複なく本文なしページ", async () => {
    const { company } = await create();
    for (let i = 0; i < 3; i++)
      await repo.createMemo(principal, company.companyId, {
        operationId: id(),
        memoId: id(),
        candidate: manualCandidate(),
      });
    const first = await repo.listMemos(principal, company.companyId, {
      limit: 2,
    });
    const next = await repo.listMemos(principal, company.companyId, {
      limit: 2,
      cursor: first.nextCursor!,
    });
    expect(
      new Set([...first.items, ...next.items].map((x) => x.memoId)).size,
    ).toBe(3);
    expect(first.items[0]).not.toHaveProperty("markdown");
    const second = await create();
    await expect(
      repo.listMemos(principal, second.company.companyId, {
        cursor: first.nextCursor!,
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });
  it("期限で実DB処理を終了し接続を再利用しない", async () => {
    await expect(
      database.transaction(
        principal,
        async (q) => {
          await q.query("select pg_sleep(1)");
        },
        { timeoutMs: 100 },
      ),
    ).rejects.toBeDefined();
    expect((await repo.listCards(principal)).length).toBeGreaterThan(0);
    expect(database.pool.options.max).toBe(3);
  });
});
