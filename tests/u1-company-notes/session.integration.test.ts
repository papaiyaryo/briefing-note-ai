import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { createHash } from "node:crypto";
import { WorkspaceDatabase } from "../../src/lib/server/workspace/database";
import { SessionStore } from "../../src/lib/server/auth/session";
import { setupDatabase } from "./helpers";
import { OWNER_A, id } from "./fixtures";

describe("実session共有排他 / US1.1 NFR1.4", () => {
  let db: Awaited<ReturnType<typeof setupDatabase>>,
    database: WorkspaceDatabase,
    store: SessionStore;
  beforeAll(async () => {
    db = await setupDatabase();
    database = new WorkspaceDatabase({
      schema: db.schema,
      pool: new Pool({
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
      }),
    });
    store = new SessionStore(database);
  });
  afterAll(async () => {
    await database?.close();
    await db?.close();
  });
  const create = async () => {
    const hash = createHash("sha256").update(id()).digest("hex");
    await store.create({
      sessionHash: hash,
      userId: OWNER_A,
      authSessionId: id(),
      encryptedTokens: { test: "encrypted-fixture" },
    });
    return hash;
  };
  it("hash指定の限定入口だけでsession取得", async () => {
    const hash = await create();
    expect(await store.lock(hash, async (row) => row.userId)).toBe(OWNER_A);
  });
  it("直接table参照はnormal roleへ許さない", async () => {
    const c = await db.connect();
    await expect(
      c.query(`select * from ${db.schema}.app_sessions`),
    ).rejects.toMatchObject({ code: "42501" });
    await c.end();
  });
  it("存在しないhashは本人なし", async () => {
    await expect(
      store.lock("f".repeat(64), async () => true),
    ).rejects.toMatchObject({ code: "unauthenticated" });
  });
  it("絶対7日期限を検査", async () => {
    const hash = await create();
    await db.admin.query(
      `update ${db.schema}.app_sessions set absolute_expires_at=clock_timestamp() where session_hash=$1`,
      [hash],
    );
    await expect(store.lock(hash, async () => true)).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });
  it("非操作24時間の期限を検査", async () => {
    const hash = await create();
    await db.admin.query(
      `update ${db.schema}.app_sessions set last_used_at=clock_timestamp()-interval '24 hours' where session_hash=$1`,
      [hash],
    );
    await expect(store.lock(hash, async () => true)).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });
  it("同時refreshを独立接続で直列化", async () => {
    const hash = await create();
    let enter!: () => void, release!: () => void;
    const entered = new Promise<void>((r) => (enter = r)),
      gate = new Promise<void>((r) => (release = r));
    const order: string[] = [];
    const a = store.lock(hash, async () => {
      order.push("a");
      enter();
      await gate;
      order.push("a-end");
    });
    await entered;
    const b = store.lock(hash, async () => {
      order.push("b");
    });
    release();
    await Promise.all([a, b]);
    expect(order).toEqual(["a", "a-end", "b"]);
  });
  it("logoutは現在sessionだけを失効、不要token消去", async () => {
    const a = await create(),
      b = await create();
    await store.revoke(a);
    await expect(store.lock(a, async () => true)).rejects.toMatchObject({
      code: "unauthenticated",
    });
    expect(await store.lock(b, async () => true)).toBe(true);
    expect(
      (
        await db.admin.query(
          `select encrypted_tokens from ${db.schema}.app_sessions where session_hash=$1`,
          [a],
        )
      ).rows[0].encrypted_tokens,
    ).toBeNull();
  });
  it("refresh先行とlogoutの競合後に復活させない", async () => {
    const hash = await create();
    let enter!: () => void, release!: () => void;
    const entered = new Promise<void>((r) => (enter = r)),
      gate = new Promise<void>((r) => (release = r));
    const refresh = store.lock(hash, async (row, q) => {
      enter();
      await gate;
      await store.replaceTokens(q, hash, row.refreshVersion, { test: "new" });
    });
    await entered;
    const logout = store.revoke(hash);
    release();
    await Promise.all([refresh, logout]);
    await expect(store.lock(hash, async () => true)).rejects.toMatchObject({
      code: "unauthenticated",
    });
  });
});
