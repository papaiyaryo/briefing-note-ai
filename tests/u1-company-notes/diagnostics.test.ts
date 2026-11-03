import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccessControl } from "../../src/lib/server/auth/accessControl";
import { authProblem } from "../../src/lib/server/auth/provider";
import type { SessionStore } from "../../src/lib/server/auth/session";
import {
  sqlProblem,
  WorkspaceError,
} from "../../src/lib/server/workspace/errors";
import { OWNER_A } from "./fixtures";

const SECRET = "do-not-log-this-secret";
const keys = (fill: number) =>
  JSON.stringify({
    active: "k1",
    keys: { k1: Buffer.alloc(32, fill).toString("base64") },
  });
const logged = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.map((call) => String(call[0])).join("\n");

describe("workspace runtime configuration diagnostics", () => {
  let error: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.resetModules();
    error = vi.spyOn(console, "error").mockImplementation(() => {});
    const values = {
      NODE_ENV: "production",
      WORKSPACE_ORIGIN: "https://briefing.example",
      WORKSPACE_ALLOWED_USER_ID: OWNER_A,
      WORKSPACE_DATABASE_URL: `postgresql://app:${SECRET}@db.example:6543/postgres`,
      WORKSPACE_DATABASE_CA:
        "-----BEGIN CERTIFICATE-----\\nZHVtbXk=\\n-----END CERTIFICATE-----",
      WORKSPACE_DB_SCHEMA: "briefing_workspace",
      WORKSPACE_TOKEN_KEYS: keys(1),
      WORKSPACE_RECEIPT_KEYS: keys(2),
      WORKSPACE_AUTH_MODE: "",
      WORKSPACE_DB_ALLOW_LOCAL: "",
      SUPABASE_URL: "https://project.example",
      SUPABASE_PUBLISHABLE_KEY: "sb_publishable_dummy",
    };
    for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    error.mockRestore();
  });
  it.each([
    ["WORKSPACE_DB_SCHEMA", "", "WORKSPACE_DB_SCHEMA:missing"],
    ["WORKSPACE_DB_SCHEMA", "Bad-Schema", "WORKSPACE_DB_SCHEMA:invalid"],
    [
      "WORKSPACE_ORIGIN",
      "https://briefing.example/",
      "WORKSPACE_ORIGIN:invalid",
    ],
    [
      "WORKSPACE_ALLOWED_USER_ID",
      "not-a-uuid",
      "WORKSPACE_ALLOWED_USER_ID:invalid",
    ],
    [
      "WORKSPACE_DATABASE_URL",
      `postgresql://app:${SECRET}@db.example:6543/postgres?sslmode=require`,
      "WORKSPACE_DATABASE_URL:ssl_param",
    ],
    ["WORKSPACE_DATABASE_URL", `[${SECRET}]`, "WORKSPACE_DATABASE_URL:invalid"],
    ["WORKSPACE_DATABASE_CA", "", "WORKSPACE_DATABASE_CA:missing"],
    ["WORKSPACE_TOKEN_KEYS", SECRET, "WORKSPACE_TOKEN_KEYS:invalid"],
    ["WORKSPACE_RECEIPT_KEYS", keys(1), "WORKSPACE_RECEIPT_KEYS:shared_key"],
    ["WORKSPACE_AUTH_MODE", "dummy", "WORKSPACE_AUTH_MODE:invalid"],
    ["SUPABASE_URL", "https://project.example/rest/v1", "SUPABASE_URL:invalid"],
    [
      "SUPABASE_PUBLISHABLE_KEY",
      "sb_secret_dummy",
      "SUPABASE_PUBLISHABLE_KEY:invalid",
    ],
  ])(
    "logs which check failed for %s without its value",
    async (key, value, reason) => {
      vi.stubEnv(key, value);
      const { getWorkspaceRuntime } =
        await import("../../src/lib/server/workspace/runtime");
      expect(() => getWorkspaceRuntime()).toThrow(
        expect.objectContaining({ code: "unavailable", reason }),
      );
      const line = logged(error);
      expect(JSON.parse(line)).toMatchObject({
        level: "error",
        event: "workspace.runtime_unavailable",
        reason,
      });
      expect(line).not.toContain(SECRET);
    },
  );
});

describe("auth and database failure diagnostics", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  let info: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    info = vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    info.mockRestore();
  });
  const access = (provider: object) =>
    new AccessControl(
      {} as SessionStore,
      provider as never,
      {
        active: "k1",
        keys: { k1: Buffer.alloc(32, 1) },
      },
      {
        allowedUserId: OWNER_A,
        origin: "https://briefing.example",
        production: true,
      },
    );
  const request = (headers: Record<string, string> = {}) =>
    new Request("https://briefing.example/api/v1/auth/session", { headers });

  it("records a missing session cookie as an informational rejection", async () => {
    const result = await access({}).authenticate(request());
    expect(result.ok).toBe(false);
    expect(JSON.parse(logged(info))).toMatchObject({
      event: "auth.authenticate_failed",
      code: "unauthenticated",
      reason: "cookie_missing",
    });
  });
  it("records a malformed session cookie as a warning", async () => {
    await access({}).authenticate(
      request({ cookie: "briefing_session=short" }),
    );
    expect(JSON.parse(logged(warn))).toMatchObject({
      event: "auth.authenticate_failed",
      reason: "cookie_malformed",
    });
  });
  it("records the provider reason for a failed login without the password", async () => {
    const result = await access({
      signIn: async () => {
        throw authProblem({ status: 400, code: "invalid_credentials" });
      },
    }).login(
      new Request("https://briefing.example/api/v1/auth/login", {
        method: "POST",
        headers: { origin: "https://briefing.example" },
      }),
      "owner@example.test",
      SECRET,
    );
    expect(result.ok).toBe(false);
    const line = logged(warn);
    expect(JSON.parse(line)).toMatchObject({
      event: "auth.login_failed",
      code: "unauthenticated",
      reason: "supabase_auth:400:invalid_credentials",
    });
    expect(line).not.toContain(SECRET);
    expect(line).not.toContain("owner@example.test");
  });
  it("maps provider outages to unavailable with their status", () => {
    expect(authProblem({ status: 503, code: "upstream" })).toMatchObject({
      code: "unavailable",
      reason: "supabase_auth:503:upstream",
    });
    expect(authProblem(new TypeError("fetch failed"))).toMatchObject({
      code: "unavailable",
      reason: "supabase_auth:0:TypeError",
    });
  });
  it.each([
    [{ code: "28P01" }, "unavailable", "db:28P01"],
    [{ code: "ECONNREFUSED" }, "unavailable", "db:ECONNREFUSED"],
    [
      { code: "SELF_SIGNED_CERT_IN_CHAIN" },
      "unavailable",
      "db:SELF_SIGNED_CERT_IN_CHAIN",
    ],
    [new Error(`password ${SECRET} rejected`), "unavailable", "db:Error"],
    [{ code: "23505" }, "operation_reused", undefined],
  ])("keeps the database error code as the reason", (cause, code, reason) => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const problem = sqlProblem(cause);
    expect(problem).toBeInstanceOf(WorkspaceError);
    expect(problem).toMatchObject({ code, reason });
    const line = logged(error);
    error.mockRestore();
    if (reason)
      expect(JSON.parse(line)).toMatchObject({
        event: "workspace.db_failed",
        reason,
      });
    else expect(line).toBe("");
    expect(line).not.toContain(SECRET);
  });
});
