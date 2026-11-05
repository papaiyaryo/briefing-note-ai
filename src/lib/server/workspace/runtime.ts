import { Pool } from "pg";
import { createHmac } from "node:crypto";
import { AccessControl } from "../auth/accessControl";
import { SupabaseIdentity, type IdentityProvider } from "../auth/provider";
import { SessionStore } from "../auth/session";
import { assertKeyRing, type KeyRing } from "../auth/crypto";
import { idSchema } from "../../workspace/schema";
import { WorkspaceDatabase } from "./database";
import { WorkspaceRepository } from "./repository";
import { CompanyWorkspace } from "./service";
import { WorkspaceError } from "./errors";
import { issueGenerationReceipt } from "./generationReceipt";
import { describeError, logServerEvent } from "../log";

export interface WorkspaceRuntime {
  auth: AccessControl;
  service: CompanyWorkspace;
  repo: WorkspaceRepository;
  issueGenerationReceipt(
    userId: string,
    providerOrigin: "dummy" | "openai",
  ): string;
}
const loopback = (host: string) =>
  ["localhost", "127.0.0.1", "[::1]"].includes(host);
// 失敗理由は「変数名:種類」だけにし、設定値そのものはログへ出さない。
const invalid = (name: string, kind = "invalid") =>
  new WorkspaceError("unavailable", undefined, `${name}:${kind}`);
function required(name: string) {
  const value = process.env[name];
  if (!value) throw invalid(name, "missing");
  return value;
}
function parsedUrl(name: string) {
  const value = required(name);
  try {
    return { value, url: new URL(value) };
  } catch {
    throw invalid(name);
  }
}
function keyRing(name: string): KeyRing {
  const value = required(name);
  try {
    const raw = JSON.parse(value) as {
      active: string;
      keys: Record<string, string>;
    };
    const ring = {
      active: raw.active,
      keys: Object.fromEntries(
        Object.entries(raw.keys).map(([id, key]) => {
          const value = Buffer.from(key, "base64");
          if (value.toString("base64") !== key) throw new Error();
          return [id, value];
        }),
      ),
    };
    assertKeyRing(ring);
    return ring;
  } catch {
    throw invalid(name);
  }
}
class LocalIdentity implements IdentityProvider {
  constructor(
    private readonly userId: string,
    private readonly password: string,
  ) {}
  async signIn(email: string, password: string) {
    if (email !== "owner@example.test" || password !== this.password)
      throw new WorkspaceError("unauthenticated");
    return {
      userId: this.userId,
      authSessionId: "local-dummy-auth",
      tokens: {
        accessToken: "local-dummy-access",
        refreshToken: "local-dummy-refresh",
        expiresAt: Date.now() + 3600000,
      },
    };
  }
  async getUser(token: string) {
    if (token !== "local-dummy-access")
      throw new WorkspaceError("unauthenticated");
    return this.userId;
  }
  async refresh(token: string) {
    if (token !== "local-dummy-refresh")
      throw new WorkspaceError("unauthenticated");
    return this.signIn("owner@example.test", this.password);
  }
  async signOut() {}
}
let runtime: WorkspaceRuntime | undefined;
export function getWorkspaceRuntime(): WorkspaceRuntime {
  if (typeof window !== "undefined") throw new WorkspaceError("unavailable");
  if (runtime) return runtime;
  try {
    const production = process.env.NODE_ENV === "production";
    const { value: origin, url } = parsedUrl("WORKSPACE_ORIGIN");
    if (
      url.origin !== origin ||
      url.username ||
      url.password ||
      (!production && !["http:", "https:"].includes(url.protocol)) ||
      (production && url.protocol !== "https:")
    )
      throw invalid("WORKSPACE_ORIGIN");
    const allowedUserId = idSchema.safeParse(
      required("WORKSPACE_ALLOWED_USER_ID"),
    );
    if (!allowedUserId.success) throw invalid("WORKSPACE_ALLOWED_USER_ID");
    const { url: databaseUrl } = parsedUrl("WORKSPACE_DATABASE_URL");
    if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol))
      throw invalid("WORKSPACE_DATABASE_URL");
    if (
      [...databaseUrl.searchParams.keys()].some((key) =>
        key.toLowerCase().startsWith("ssl"),
      )
    )
      throw invalid("WORKSPACE_DATABASE_URL", "ssl_param");
    const local = process.env.WORKSPACE_DB_ALLOW_LOCAL === "true";
    if (local && (production || !loopback(databaseUrl.hostname)))
      throw invalid("WORKSPACE_DB_ALLOW_LOCAL");
    const ssl = local
      ? undefined
      : {
          rejectUnauthorized: true,
          ca: required("WORKSPACE_DATABASE_CA").replace(/\\n/g, "\n"),
        };
    const keys = keyRing("WORKSPACE_TOKEN_KEYS"),
      receiptKeys = keyRing("WORKSPACE_RECEIPT_KEYS");
    // token用と出自用の鍵は、旧鍵も含めて独立させる。
    if (
      Object.values(keys.keys).some((a) =>
        Object.values(receiptKeys.keys).some((b) => a.equals(b)),
      )
    )
      throw invalid("WORKSPACE_RECEIPT_KEYS", "shared_key");
    let provider: IdentityProvider;
    if (process.env.WORKSPACE_AUTH_MODE === "dummy") {
      if (
        production ||
        process.env.NODE_ENV !== "development" ||
        !loopback(url.hostname) ||
        !local
      )
        throw invalid("WORKSPACE_AUTH_MODE");
      provider = new LocalIdentity(
        allowedUserId.data,
        required("WORKSPACE_DUMMY_PASSWORD"),
      );
    } else if (
      !process.env.WORKSPACE_AUTH_MODE ||
      process.env.WORKSPACE_AUTH_MODE === "supabase"
    )
      provider = new SupabaseIdentity(
        required("SUPABASE_URL"),
        required("SUPABASE_PUBLISHABLE_KEY"),
      );
    else throw invalid("WORKSPACE_AUTH_MODE");
    const schema = required("WORKSPACE_DB_SCHEMA");
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(schema))
      throw invalid("WORKSPACE_DB_SCHEMA");
    const database = new WorkspaceDatabase({
      pool: new Pool({
        connectionString: databaseUrl.toString(),
        ssl,
        max: 3,
        connectionTimeoutMillis: 8000,
        idleTimeoutMillis: 10000,
      }),
      schema,
    });
    const cursorKey = createHmac("sha256", receiptKeys.keys[receiptKeys.active])
      .update("workspace-cursor:v1")
      .digest();
    const repo = new WorkspaceRepository(database, cursorKey);
    runtime = {
      auth: new AccessControl(new SessionStore(database), provider, keys, {
        allowedUserId: allowedUserId.data,
        origin,
        production,
      }),
      repo,
      service: new CompanyWorkspace(repo, receiptKeys),
      issueGenerationReceipt: (userId, providerOrigin) =>
        issueGenerationReceipt(userId, providerOrigin, receiptKeys),
    };
    return runtime;
  } catch (error) {
    const reason =
      (error instanceof WorkspaceError && error.reason) || "unknown";
    logServerEvent("error", "workspace.runtime_unavailable", {
      code: "unavailable",
      // 想定外の例外だけ詳細を残す（設定値は reason に含めない設計を維持）
      ...(error instanceof WorkspaceError ? {} : describeError(error)),
      reason,
    });
    throw new WorkspaceError("unavailable", undefined, reason);
  }
}
