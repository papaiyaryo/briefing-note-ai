import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";
import { fixtureTrace, runtimeFixture } from "./runtimeFixture";
import { id, manualCandidate } from "./fixtures";

type Runtime = Awaited<ReturnType<typeof runtimeFixture>>;
let fixture: Runtime | undefined;
const request = (cookie: string, method = "GET") =>
  new Request("http://localhost/api/v1/auth/session", {
    method,
    headers: { Cookie: cookie, Origin: "http://localhost" },
  });
async function resetSessions(f: Runtime) {
  const sql = await readFile(
    "db/maintenance/reset-restored-sessions.sql",
    "utf8",
  );
  if (!/^u1_test_[a-f0-9]{32}$/.test(f.db.schema))
    throw new Error("restore scope rejected");
  await f.db.admin.query(sql.replaceAll("__SCHEMA__", f.db.schema));
}
async function data(f: Runtime) {
  const result = [];
  for (const table of ["companies", "memos", "write_operations"]) {
    result.push(
      (
        await f.db.admin.query(
          `select to_jsonb(t) as record from ${f.db.schema}.${table} t order by to_jsonb(t)::text`,
        )
      ).rows,
    );
  }
  return result;
}
async function restoreLegacyDump() {
  const trace = fixtureTrace("restore");
  const f = (fixture = await runtimeFixture(trace));
  const stage = (name: string) => {
    trace(name);
    f.db.diagnostic?.stage(name);
  };
  const login = await f.auth.login(
    request("", "POST"),
    "owner@example.test",
    "dummy-password",
  );
  if (!login.ok) throw new Error("second fixture login failed");
  stage("second-login:done");
  const secondCookie = login.value.cookie.split(";")[0];
  const companyId = id(),
    memoId = id(),
    operationId = id();
  await f.repo.createCompany(f.principal, {
    companyId,
    operationId: id(),
    fields: { name: "架空復旧確認" },
  });
  await f.repo.createMemo(f.principal, companyId, {
    memoId,
    operationId,
    candidate: manualCandidate(),
  });
  const before = await data(f);
  stage("company-memo-and-data:done");
  // 古い全schema dumpにあった有効sessionをメモリ内だけに保持する。
  const rows = (
    await f.db.admin.query(
      `select to_jsonb(t) as record from ${f.db.schema}.app_sessions t`,
    )
  ).rows.map((row) => row.record);
  f.identity.failLogout = true;
  expect((await f.auth.logout(request(f.cookie, "POST"))).ok).toBe(true);
  expect((await f.auth.authenticate(request(f.cookie))).ok).toBe(false);
  stage("logout-and-rejection:done");
  await f.db.admin.query(`delete from ${f.db.schema}.app_sessions`);
  await f.db.admin.query(
    `insert into ${f.db.schema}.app_sessions select * from jsonb_populate_recordset(null::${f.db.schema}.app_sessions,$1::jsonb)`,
    [JSON.stringify(rows)],
  );
  // 対照：鍵が残る旧復元ではlogout済みCookieが本物のAccessControlを通る。
  expect((await f.auth.authenticate(request(f.cookie))).ok).toBe(true);
  stage("legacy-session-accepted-control:done");
  await resetSessions(f);
  stage("reset-sessions:done");
  return { f, before, secondCookie, companyId, memoId, operationId };
}
afterEach(async () => {
  await fixture?.close();
  fixture = undefined;
});

describe("RD3 復元後のsession再認証 / 実PG・dummy Auth", () => {
  it("外部logout失敗でもアプリlogout済みCookieは復元再開後に拒否", async () => {
    const { f } = await restoreLegacyDump();
    expect(await f.auth.authenticate(request(f.cookie))).toMatchObject({
      ok: false,
      problem: { error: { code: "unauthenticated" } },
    });
  }, 30000);
  it("dump時に有効だった別sessionも再開前に拒否", async () => {
    const { f, secondCookie } = await restoreLegacyDump();
    expect(await f.auth.authenticate(request(secondCookie))).toMatchObject({
      ok: false,
      problem: { error: { code: "unauthenticated" } },
    });
  }, 30000);
  it("復元されたsession行・暗号token行はゼロ", async () => {
    const { f } = await restoreLegacyDump();
    const counts = (
      await f.db.admin.query(
        `select count(*)::int as sessions,count(encrypted_tokens)::int as tokens from ${f.db.schema}.app_sessions`,
      )
    ).rows[0];
    expect(counts).toEqual({ sessions: 0, tokens: 0 });
  });
  it("企業・メモ・owner・ID・版・成功操作を完全に維持", async () => {
    const { f, before } = await restoreLegacyDump();
    expect(await data(f)).toEqual(before);
  });
  it("新規login後は元の保存データと成功操作へアクセスできる", async () => {
    const { f, companyId, memoId, operationId } = await restoreLegacyDump();
    const login = await f.auth.login(
      request("", "POST"),
      "owner@example.test",
      "dummy-password",
    );
    expect(login.ok).toBe(true);
    if (!login.ok) throw new Error("fresh login rejected");
    const authenticated = await f.auth.authenticate(
      request(login.value.cookie.split(";")[0]),
    );
    expect(authenticated.ok).toBe(true);
    if (!authenticated.ok) throw new Error("fresh authentication rejected");
    expect(
      (await f.repo.readMemo(authenticated.value, companyId, memoId)).markdown,
    ).toBe(manualCandidate().markdown);
    expect(
      (await f.repo.lookupOperation(authenticated.value, operationId)).state,
    ).toBe("committed");
  });
  it("同じ復元SQLの再実行は安全で企業データ不変", async () => {
    const { f, before } = await restoreLegacyDump();
    await resetSessions(f);
    expect(
      (
        await f.db.admin.query(
          `select count(*)::int as count from ${f.db.schema}.app_sessions`,
        )
      ).rows[0].count,
    ).toBe(0);
    expect(await data(f)).toEqual(before);
  });
});
