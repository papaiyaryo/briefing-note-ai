import { createHash, randomBytes } from "node:crypto";
import type {
  AccessControlV1,
  Principal,
  Result,
} from "../../workspace/contracts";
import { contractProblem, WorkspaceError } from "../workspace/errors";
import { logServerEvent } from "../log";
import { assertKeyRing, openTokens, sealTokens, type KeyRing } from "./crypto";
import type { IdentityProvider } from "./provider";
import { SessionStore } from "./session";

export const SESSION_COOKIE = "briefing_session";
export function requireOrigin(request: Request, origin: string) {
  if (request.headers.get("origin") !== origin)
    throw new WorkspaceError("origin_forbidden");
}
function cookieToken(request: Request) {
  const matches = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((x) => x.trim())
    .filter((x) => x.startsWith(`${SESSION_COOKIE}=`));
  if (matches.length !== 1) throw new WorkspaceError("unauthenticated");
  const token = matches[0].slice(SESSION_COOKIE.length + 1);
  if (!/^[a-zA-Z0-9_-]{43}$/.test(token))
    throw new WorkspaceError("unauthenticated");
  return token;
}
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export class AccessControl implements AccessControlV1 {
  constructor(
    readonly store: SessionStore,
    private readonly provider: IdentityProvider,
    private readonly keys: KeyRing,
    readonly options: {
      allowedUserId: string;
      origin: string;
      production: boolean;
    },
  ) {
    assertKeyRing(keys);
  }
  cookie(value: string, clear = false) {
    return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 604800}${this.options.production ? "; Secure" : ""}`;
  }
  async login(
    request: Request,
    email: string,
    password: string,
  ): Promise<Result<{ cookie: string; userId: string }>> {
    try {
      requireOrigin(request, this.options.origin);
      const signal = AbortSignal.timeout(7000);
      const session = await this.provider.signIn(email, password, signal);
      const verified = await this.provider.getUser(
        session.tokens.accessToken,
        signal,
      );
      if (
        verified !== session.userId ||
        verified !== this.options.allowedUserId
      )
        throw new WorkspaceError("unauthenticated");
      const token = randomBytes(32).toString("base64url"),
        sessionHash = digest(token);
      await this.store.create({
        sessionHash,
        userId: verified,
        authSessionId: session.authSessionId,
        encryptedTokens: sealTokens(
          session.tokens,
          { sessionHash, userId: verified },
          this.keys,
        ),
      });
      return {
        ok: true,
        value: { cookie: this.cookie(token), userId: verified },
      };
    } catch (error) {
      return {
        ok: false,
        problem: contractProblem(
          error instanceof WorkspaceError
            ? error
            : new WorkspaceError("unauthenticated"),
        ),
      };
    }
  }
  async authenticate(request: Request): Promise<Result<Principal>> {
    try {
      const sessionHash = digest(cookieToken(request));
      const result = await this.store.lock(
        sessionHash,
        async (row, q): Promise<Result<Principal>> => {
          try {
            const context = { sessionHash, userId: row.userId };
            let tokens = openTokens(row.encryptedTokens, context, this.keys);
            let replace = false;
            const signal = AbortSignal.timeout(7000);
            if (tokens.expiresAt <= Date.now() + 30000) {
              const refreshed = await this.provider.refresh(
                tokens.refreshToken,
                signal,
              );
              if (refreshed.userId !== row.userId)
                throw new WorkspaceError("unauthenticated");
              tokens = refreshed.tokens;
              replace = true;
            }
            const userId = await this.provider.getUser(
              tokens.accessToken,
              signal,
            );
            if (userId !== row.userId || userId !== this.options.allowedUserId)
              throw new WorkspaceError("unauthenticated");
            const keyId = (row.encryptedTokens as { keyId: string }).keyId;
            if (replace || keyId !== this.keys.active)
              await this.store.replaceTokens(
                q,
                sessionHash,
                row.refreshVersion,
                sealTokens(tokens, context, this.keys),
              );
            else await this.store.touch(q, sessionHash);
            return { ok: true, value: { userId, sessionHash } as Principal };
          } catch (error) {
            if (
              error instanceof WorkspaceError &&
              error.code === "unauthenticated"
            ) {
              await this.store.revokeLocked(q, sessionHash);
              return { ok: false, problem: contractProblem(error) };
            }
            throw error;
          }
        },
      );
      return result;
    } catch (error) {
      return {
        ok: false,
        problem: contractProblem(
          error instanceof WorkspaceError
            ? error
            : new WorkspaceError("unavailable"),
        ),
      };
    }
  }
  async logout(request: Request): Promise<Result<{ cookie: string }>> {
    try {
      requireOrigin(request, this.options.origin);
      const hash = digest(cookieToken(request));
      const access = await this.store.lock(hash, async (row, q) => {
        let token: string | null = null;
        try {
          token = openTokens(
            row.encryptedTokens,
            { sessionHash: hash, userId: row.userId },
            this.keys,
          ).accessToken;
        } catch {
          /* 改変tokenでも内部失効を優先する。 */
        }
        await this.store.revokeLocked(q, hash);
        return token;
      });
      if (access) {
        try {
          await this.provider.signOut(access, AbortSignal.timeout(1500));
        } catch {
          logServerEvent("warn", "auth.external_logout_failed", {
            code: "unavailable",
          });
        }
      }
      return { ok: true, value: { cookie: this.cookie("", true) } };
    } catch (error) {
      return { ok: false, problem: contractProblem(error) };
    }
  }
}
