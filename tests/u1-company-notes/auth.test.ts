import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runtimeFixture, tokenKeys } from "./runtimeFixture";
import { sealTokens } from "../../src/lib/server/auth/crypto";
import { OWNER_A, OWNER_B } from "./fixtures";
import { SupabaseIdentity } from "../../src/lib/server/auth/provider";
import "./runtimeCases";

describe("server-only public Auth configuration", () => {
  const key = (role: string) =>
    `${Buffer.from("{}").toString("base64url")}.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.dummy-signature`;
  it("accepts a publishable key without network access", () => {
    expect(
      () =>
        new SupabaseIdentity("https://project.example", "sb_publishable_dummy"),
    ).not.toThrow();
  });
  it("accepts legacy anon only", () => {
    expect(
      () => new SupabaseIdentity("https://project.example", key("anon")),
    ).not.toThrow();
  });
  it("rejects legacy service_role before any SDK request", () => {
    expect(
      () =>
        new SupabaseIdentity("https://project.example", key("service_role")),
    ).toThrow();
  });
  it("rejects current secret keys", () => {
    expect(
      () => new SupabaseIdentity("https://project.example", "sb_secret_dummy"),
    ).toThrow();
  });
  it("rejects malformed/unknown key formats", () => {
    expect(
      () => new SupabaseIdentity("https://project.example", "unknown-key"),
    ).toThrow();
  });
  it("rejects credentials in project URL", () => {
    expect(
      () =>
        new SupabaseIdentity(
          "https://user:password@project.example",
          "sb_publishable_dummy",
        ),
    ).toThrow();
  });
  it("rejects non-https project URLs", () => {
    expect(
      () =>
        new SupabaseIdentity("http://project.example", "sb_publishable_dummy"),
    ).toThrow();
  });
  it("rejects project URL paths and query parameters", () => {
    expect(
      () =>
        new SupabaseIdentity(
          "https://project.example/path?key=x",
          "sb_publishable_dummy",
        ),
    ).toThrow();
  });
});
describe("本人境界 / US1", () => {
  let f: Awaited<ReturnType<typeof runtimeFixture>>;
  beforeAll(async () => {
    f = await runtimeFixture();
  });
  afterAll(async () => {
    await f?.close();
  });
  const req = () =>
    new Request("http://localhost/api/v1/auth/session", {
      headers: { Cookie: f.cookie, Origin: "http://localhost" },
    });
  it("Cookieなしは401相当で保護本人を返さない", async () => {
    const r = await f.auth.authenticate(new Request("http://localhost"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problem.error.code).toBe("unauthenticated");
  });
  it("本人を検証してtokenを返さない", async () => {
    const r = await f.auth.authenticate(req());
    expect(r.ok).toBe(true);
    expect(JSON.stringify(r)).not.toContain("dummy-access");
  });
  it("CookieをHttpOnly/SameSite/Pathで返す", async () => {
    const r = await f.auth.login(
      new Request("http://localhost/login", {
        method: "POST",
        headers: { Origin: "http://localhost" },
      }),
      "owner@example.test",
      "dummy-password",
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.cookie).toContain("HttpOnly");
      expect(r.value.cookie).toContain("SameSite=Lax");
      expect(r.value.cookie).toContain("Path=/");
      expect(r.value.cookie).not.toContain("Domain=");
    }
  });
  it("不正Originからログインを拒否", async () => {
    const r = await f.auth.login(
      new Request("http://localhost/login", {
        method: "POST",
        headers: { Origin: "https://evil.test" },
      }),
      "owner@example.test",
      "dummy-password",
    );
    expect(r.ok).toBe(false);
  });
  it("管理側の別userを本人として許さない", async () => {
    f.identity.userId = OWNER_B;
    const r = await f.auth.login(
      new Request("http://localhost/login", {
        method: "POST",
        headers: { Origin: "http://localhost" },
      }),
      "owner@example.test",
      "dummy-password",
    );
    f.identity.userId = OWNER_A;
    expect(r.ok).toBe(false);
  });
  it("DBtokenは暗号化だけ", async () => {
    const r = await f.db.admin.query(
      `select encrypted_tokens from ${f.db.schema}.app_sessions`,
    );
    expect(JSON.stringify(r.rows)).not.toContain("dummy-access");
  });
  it("期限切れtokenの同時確認でrefreshを1回だけ", async () => {
    await f.store.lock(f.principal.sessionHash, async (row, q) => {
      await f.store.replaceTokens(
        q,
        row.sessionHash,
        row.refreshVersion,
        sealTokens(
          { ...f.identity.tokens, expiresAt: Date.now() - 1000 },
          { sessionHash: row.sessionHash, userId: row.userId },
          tokenKeys,
        ),
      );
    });
    const before = f.identity.refreshCalls;
    const values = await Promise.all([
      f.auth.authenticate(req()),
      f.auth.authenticate(req()),
    ]);
    expect(values.every((x) => x.ok)).toBe(true);
    expect(f.identity.refreshCalls - before).toBe(1);
  });
  it("外部logout失敗でもアプリsessionを失効", async () => {
    f.identity.failLogout = true;
    const r = await f.auth.logout(req());
    expect(r.ok).toBe(true);
    expect((await f.auth.authenticate(req())).ok).toBe(false);
  });
});
