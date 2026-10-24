import { Pool, type ClientBase } from "pg";
import { createHmac, randomUUID } from "node:crypto";
import { WorkspaceDatabase } from "../../src/lib/server/workspace/database";
import { WorkspaceRepository } from "../../src/lib/server/workspace/repository";
import { CompanyWorkspace } from "../../src/lib/server/workspace/service";
import { SessionStore } from "../../src/lib/server/auth/session";
import { AccessControl } from "../../src/lib/server/auth/accessControl";
import type {
  IdentityProvider,
  AuthSession,
} from "../../src/lib/server/auth/provider";
import { setupDatabase, type FixtureStageObserver } from "./helpers";
import { OWNER_A, OWNER_B } from "./fixtures";
import { issueGenerationReceipt } from "../../src/lib/server/workspace/generationReceipt";

export const tokenKeys = {
  active: "token1",
  keys: { token1: Buffer.alloc(32, 1) },
};
export const receiptKeys = {
  active: "receipt1",
  keys: { receipt1: Buffer.alloc(32, 2) },
};
export function fixtureReceipt(
  userId = OWNER_A,
  providerOrigin: "dummy" | "openai" = "dummy",
) {
  const body = Buffer.from(
    JSON.stringify({
      purpose: "memo-generation",
      version: 1,
      keyId: "receipt1",
      userId,
      generationId: randomUUID(),
      providerOrigin,
    }),
  ).toString("base64url");
  return `${body}.${createHmac("sha256", receiptKeys.keys.receipt1).update(`memo-generation:v1:${body}`).digest("base64url")}`;
}
export class FakeIdentity implements IdentityProvider {
  userId = OWNER_A;
  refreshCalls = 0;
  failLogout = false;
  invalidUser = false;
  tokens = {
    accessToken: "dummy-access",
    refreshToken: "dummy-refresh",
    expiresAt: Date.now() + 3600000,
  };
  async signIn(email: string, password: string): Promise<AuthSession> {
    if (email !== "owner@example.test" || password !== "dummy-password")
      throw new Error("auth rejected");
    return {
      userId: this.userId,
      authSessionId: "dummy-auth-session",
      tokens: { ...this.tokens },
    };
  }
  async getUser(): Promise<string> {
    if (this.invalidUser) throw new Error("auth rejected");
    return this.userId;
  }
  async refresh(): Promise<AuthSession> {
    this.refreshCalls++;
    this.tokens = {
      ...this.tokens,
      accessToken: `refreshed-${this.refreshCalls}`,
      expiresAt: Date.now() + 3600000,
    };
    return {
      userId: this.userId,
      authSessionId: "dummy-auth-session",
      tokens: { ...this.tokens },
    };
  }
  async signOut() {
    if (this.failLogout) throw new Error("dependency unavailable");
  }
}
// 段階名と経過だけを出し、dummyであってもtokenや試験本文は記録しない。
export function fixtureTrace(label: string): FixtureStageObserver {
  const started = performance.now();
  return (stage) =>
    console.info(
      `[fixture-timing:${label}] ${stage} ${Math.round(performance.now() - started)}ms`,
    );
}
export async function runtimeFixture(observe?: FixtureStageObserver) {
  const db = await setupDatabase(observe);
  const report = (stage: string) => {
    observe?.(stage);
    db.diagnostic?.stage(stage);
  };
  const port = Number(
    new URL(
      process.env.U1_TEST_DATABASE_URL ??
        "postgresql://localhost:55432/workspace_test",
    ).port || 5432,
  );
  const database = new WorkspaceDatabase({
    schema: db.schema,
    pool: new Pool({
      host: "127.0.0.1",
      port,
      database: "workspace_test",
      user: "workspace_test_app",
      password: "local-app-test-only",
      max: 3,
      ...(db.diagnostic ? {
        application_name: db.diagnostic.applicationName("p"),
        onConnect: async (client: ClientBase) => { await db.diagnostic!.register(client, "p"); },
      } : {}),
    }),
  });
  const repo = new WorkspaceRepository(database, Buffer.alloc(32, 7));
  const store = new SessionStore(database);
  const identity = new FakeIdentity();
  const auth = new AccessControl(store, identity, tokenKeys, {
    allowedUserId: OWNER_A,
    origin: "http://localhost",
    production: false,
  });
  const service = new CompanyWorkspace(repo, receiptKeys);
  report("initial-login:start");
  const login = await auth.login(
    new Request("http://localhost/api/v1/auth/login", {
      method: "POST",
      headers: { Origin: "http://localhost" },
    }),
    "owner@example.test",
    "dummy-password",
  );
  if (!login.ok) throw new Error("fixture login failed");
  report("initial-login:done");
  const cookie = login.value.cookie.split(";")[0];
  const verified = await auth.authenticate(
    new Request("http://localhost/api/v1/auth/session", {
      headers: { Cookie: cookie },
    }),
  );
  if (!verified.ok) throw new Error("fixture authentication failed");
  report("initial-authenticate:done");
  return {
    db,
    database,
    repo,
    store,
    identity,
    auth,
    service,
    issueGenerationReceipt: (userId: string, provider: "dummy" | "openai") =>
      issueGenerationReceipt(userId, provider, receiptKeys),
    cookie,
    principal: verified.value,
    otherUserId: OWNER_B,
    async close() {
      report("pool-close:start");
      await database.close();
      report("pool-close:done");
      await db.close();
    },
  };
}
