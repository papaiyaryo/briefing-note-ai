import { createClient, type Session } from "@supabase/supabase-js";
import type { AuthTokens } from "./crypto";
import { WorkspaceError } from "../workspace/errors";

export interface AuthSession {
  userId: string;
  authSessionId: string;
  tokens: AuthTokens;
}
export interface IdentityProvider {
  signIn(
    email: string,
    password: string,
    signal?: AbortSignal,
  ): Promise<AuthSession>;
  getUser(accessToken: string, signal?: AbortSignal): Promise<string>;
  refresh(refreshToken: string, signal?: AbortSignal): Promise<AuthSession>;
  signOut(accessToken: string, signal?: AbortSignal): Promise<void>;
}
function authProblem(error: unknown) {
  const status =
    error && typeof error === "object" && "status" in error
      ? Number(error.status)
      : 0;
  return new WorkspaceError(
    [400, 401, 403].includes(status) ? "unauthenticated" : "unavailable",
  );
}
function normalizedSession(session: Session | null): AuthSession {
  if (!session?.user.id || !session.expires_at)
    throw new WorkspaceError("unauthenticated");
  let sessionId: unknown;
  try {
    sessionId = JSON.parse(
      Buffer.from(session.access_token.split(".")[1], "base64url").toString(
        "utf8",
      ),
    ).session_id;
  } catch {
    throw new WorkspaceError("unavailable");
  }
  if (typeof sessionId !== "string" || !sessionId)
    throw new WorkspaceError("unavailable");
  return {
    userId: session.user.id,
    authSessionId: sessionId,
    tokens: {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at * 1000,
    },
  };
}
export class SupabaseIdentity implements IdentityProvider {
  constructor(
    private readonly url: string,
    private readonly publicKey: string,
  ) {
    try {
      const project = new URL(url);
      if (
        project.protocol !== "https:" ||
        project.username ||
        project.password ||
        project.pathname !== "/" ||
        project.search ||
        project.hash
      )
        throw new Error();
      if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publicKey)) {
        const parts = publicKey.split(".");
        if (
          parts.length !== 3 ||
          !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part)) ||
          JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"))
            .role !== "anon"
        )
          throw new Error();
      }
    } catch {
      throw new WorkspaceError("unavailable");
    }
  }
  private client(signal?: AbortSignal) {
    return createClient(this.url, this.publicKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input, init) =>
          fetch(input, {
            ...init,
            signal: signal ?? AbortSignal.timeout(7000),
          }),
      },
    });
  }
  async signIn(email: string, password: string, signal?: AbortSignal) {
    const { data, error } = await this.client(signal).auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw authProblem(error);
    return normalizedSession(data.session);
  }
  async getUser(accessToken: string, signal?: AbortSignal) {
    const { data, error } = await this.client(signal).auth.getUser(accessToken);
    if (error) throw authProblem(error);
    if (!data.user) throw new WorkspaceError("unauthenticated");
    return data.user.id;
  }
  async refresh(refreshToken: string, signal?: AbortSignal) {
    const { data, error } = await this.client(signal).auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error) throw authProblem(error);
    return normalizedSession(data.session);
  }
  async signOut(accessToken: string, signal?: AbortSignal) {
    // pinned SDKのlogout endpointは本人JWT＋local scopeを使用し、管理鍵は不要。
    const { error } = await this.client(signal).auth.admin.signOut(
      accessToken,
      "local",
    );
    if (error) throw authProblem(error);
  }
}
