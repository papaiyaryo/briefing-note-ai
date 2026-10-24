import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { Pool } from "pg";
import { setupDatabase } from "./helpers";
import { OWNER_A, id } from "./fixtures";
import { SupabaseIdentity } from "../../src/lib/server/auth/provider";

const encoded = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const accessToken = `${encoded({ alg: "HS256", typ: "JWT" })}.${encoded({ sub: OWNER_A, session_id: "dummy-sdk-session", exp: Math.floor(Date.now() / 1000) + 3600 })}.dummy-signature`;
const sdkSession = () => ({
  access_token: accessToken,
  refresh_token: "dummy-refresh",
  expires_in: 3600,
  token_type: "bearer",
  user: {
    id: OWNER_A,
    aud: "authenticated",
    role: "authenticated",
    email: "owner@example.test",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  },
});
describe("pinned SDK adapter with fake transport only", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("uses password, verified getUser, refresh and local logout without admin keys", async () => {
    const requests: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        requests.push({ url: String(url), init });
        return String(url).includes("/logout")
          ? new Response(null, { status: 204 })
          : Response.json(
              String(url).includes("/user") ? sdkSession().user : sdkSession(),
            );
      }),
    );
    const provider = new SupabaseIdentity(
      "https://project.example",
      "sb_publishable_dummy",
    );
    const session = await provider.signIn(
      "owner@example.test",
      "dummy-password",
    );
    expect(session).toMatchObject({
      userId: OWNER_A,
      authSessionId: "dummy-sdk-session",
      tokens: { accessToken, refreshToken: "dummy-refresh" },
    });
    expect(await provider.getUser(accessToken)).toBe(OWNER_A);
    expect((await provider.refresh("dummy-refresh")).userId).toBe(OWNER_A);
    await provider.signOut(accessToken);
    expect(requests.map((r) => r.url)).toEqual([
      "https://project.example/auth/v1/token?grant_type=password",
      "https://project.example/auth/v1/user",
      "https://project.example/auth/v1/token?grant_type=refresh_token",
      "https://project.example/auth/v1/logout?scope=local",
    ]);
    for (const request of requests)
      expect(request.init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(requests[0].init?.body))).toMatchObject({
      email: "owner@example.test",
      password: "dummy-password",
    });
  });
  it.each([400, 401, 403, 500])(
    "maps upstream status %i to a sanitized boundary",
    async (status) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({ msg: "dummy upstream detail" }, { status }),
        ),
      );
      const p = new SupabaseIdentity(
        "https://project.example",
        "sb_publishable_dummy",
      );
      await expect(
        p.signIn("owner@example.test", "dummy"),
      ).rejects.toMatchObject({
        code: status === 500 ? "unavailable" : "unauthenticated",
      });
    },
  );
  it("rejects missing Auth session rather than trusting token-shaped text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ user: sdkSession().user })),
    );
    await expect(
      new SupabaseIdentity(
        "https://project.example",
        "sb_publishable_dummy",
      ).signIn("owner@example.test", "dummy"),
    ).rejects.toMatchObject({ code: "unavailable" });
  });
});

describe("runtime configuration and real local database", () => {
  let db: Awaited<ReturnType<typeof setupDatabase>>;
  const pools: Pool[] = [];
  beforeAll(async () => {
    db = await setupDatabase();
    vi.doMock("pg", async () => {
      const actual = await vi.importActual<typeof import("pg")>("pg");
      return {
        ...actual,
        Pool: class extends actual.Pool {
          constructor(options: ConstructorParameters<typeof actual.Pool>[0]) {
            super(options);
            pools.push(this);
          }
        },
      };
    });
  });
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("WORKSPACE_ORIGIN", "http://127.0.0.1:3000");
    const url = new URL(
      process.env.U1_TEST_DATABASE_URL ??
        "postgresql://workspace_test_admin:local-test-only@127.0.0.1:55432/workspace_test",
    );
    url.username = "workspace_test_app";
    url.password = "local-app-test-only";
    const values = {
      WORKSPACE_DATABASE_URL: url.toString(),
      WORKSPACE_DB_SCHEMA: db.schema,
      WORKSPACE_DB_ALLOW_LOCAL: "true",
      WORKSPACE_AUTH_MODE: "dummy",
      WORKSPACE_ALLOWED_USER_ID: OWNER_A,
      WORKSPACE_DUMMY_PASSWORD: "dummy-password",
      WORKSPACE_TOKEN_KEYS: JSON.stringify({
        active: "t",
        keys: { t: Buffer.alloc(32, 1).toString("base64") },
      }),
      WORKSPACE_RECEIPT_KEYS: JSON.stringify({
        active: "r",
        keys: { r: Buffer.alloc(32, 2).toString("base64") },
      }),
    };
    for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);
  });
  afterEach(async () => {
    await Promise.all(pools.splice(0).map((pool) => pool.end()));
    vi.unstubAllEnvs();
  });
  afterAll(async () => {
    vi.doUnmock("pg");
    await db.close();
  });
  it("explicit loopback dummy Auth works against actual migrated PostgreSQL", async () => {
    const { getWorkspaceRuntime } =
      await import("../../src/lib/server/workspace/runtime");
    const runtime = getWorkspaceRuntime();
    expect(getWorkspaceRuntime()).toBe(runtime);
    const login = await runtime.auth.login(
      new Request("http://127.0.0.1:3000/api/v1/auth/login", {
        method: "POST",
        headers: { Origin: "http://127.0.0.1:3000" },
      }),
      "owner@example.test",
      "dummy-password",
    );
    expect(login.ok).toBe(true);
    if (!login.ok) throw new Error("login required");
    const principal = await runtime.auth.authenticate(
      new Request("http://127.0.0.1:3000/api/v1/auth/session", {
        headers: { Cookie: login.value.cookie.split(";")[0] },
      }),
    );
    expect(principal.ok).toBe(true);
    if (!principal.ok) throw new Error("verified principal required");
    const result = await runtime.service.mutate(
      "company_create",
      principal.value,
      {
        operationId: id(),
        companyId: id(),
        fields: { name: "runtime架空企業" },
      },
    );
    expect(result.outcome.companyId).toBeDefined();
    expect(pools[0].options.max).toBe(3);
  });
  it.each([
    ["WORKSPACE_ORIGIN", ""],
    ["WORKSPACE_ORIGIN", "http://127.0.0.1:3000/path"],
    ["WORKSPACE_ALLOWED_USER_ID", "bad-id"],
    ["WORKSPACE_DATABASE_URL", "https://project.example"],
    [
      "WORKSPACE_DATABASE_URL",
      "postgresql://localhost/workspace_test?sslmode=disable",
    ],
    ["WORKSPACE_DATABASE_URL", "postgresql://remote.example/workspace_test"],
    ["WORKSPACE_AUTH_MODE", "unexpected"],
    ["WORKSPACE_ORIGIN", "http://remote.example"],
    ["WORKSPACE_TOKEN_KEYS", "invalid-json"],
    [
      "WORKSPACE_TOKEN_KEYS",
      JSON.stringify({ active: "t", keys: { t: "invalid" } }),
    ],
    [
      "WORKSPACE_RECEIPT_KEYS",
      JSON.stringify({
        active: "t",
        keys: { t: Buffer.alloc(32, 1).toString("base64") },
      }),
    ],
    ["NODE_ENV", "production"],
    ["NODE_ENV", "test"],
  ])("fails closed for invalid %s", async (key, value) => {
    vi.stubEnv(key, value);
    const { getWorkspaceRuntime } =
      await import("../../src/lib/server/workspace/runtime");
    expect(() => getWorkspaceRuntime()).toThrow(
      expect.objectContaining({ code: "unavailable" }),
    );
    expect(pools).toHaveLength(0);
  });
});
