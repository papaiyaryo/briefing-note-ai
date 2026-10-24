import { WorkspaceDatabase, type Transaction } from "../workspace/database";
import { WorkspaceError } from "../workspace/errors";

export interface StoredSession {
  sessionHash: string;
  userId: string;
  authSessionId: string;
  encryptedTokens: unknown;
  absoluteExpiresAt: string;
  lastUsedAt: string;
  revokedAt: string | null;
  refreshVersion: string;
}
export class SessionStore {
  constructor(readonly database: WorkspaceDatabase) {}
  async create(
    input: Pick<
      StoredSession,
      "sessionHash" | "userId" | "authSessionId" | "encryptedTokens"
    >,
  ) {
    await this.database.transaction(null, async (q) => {
      await q.query(
        `select ${this.database.schema}.session_create($1,$2,$3,$4::jsonb)`,
        [
          input.sessionHash,
          input.userId,
          input.authSessionId,
          JSON.stringify(input.encryptedTokens),
        ],
      );
    });
  }
  async lock<T>(
    hash: string,
    body: (session: StoredSession, client: Transaction) => Promise<T>,
  ) {
    return this.database.transaction(null, async (q) => {
      const result = await q.query(
        `select * from ${this.database.schema}.session_lock($1)`,
        [hash],
      );
      const row = result.rows[0];
      if (
        !row ||
        row.revoked_at ||
        new Date(row.absolute_expires_at).getTime() <= Date.now() ||
        new Date(row.last_used_at).getTime() + 86400000 <= Date.now()
      )
        throw new WorkspaceError("unauthenticated");
      return body(
        {
          sessionHash: row.session_hash,
          userId: row.user_id,
          authSessionId: row.auth_session_id,
          encryptedTokens: row.encrypted_tokens,
          absoluteExpiresAt: row.absolute_expires_at.toISOString(),
          lastUsedAt: row.last_used_at.toISOString(),
          revokedAt: row.revoked_at?.toISOString() ?? null,
          refreshVersion: row.refresh_version,
        },
        q,
      );
    });
  }
  async replaceTokens(
    q: Transaction,
    hash: string,
    expectedVersion: string,
    encryptedTokens: unknown,
  ) {
    const result = await q.query(
      `select ${this.database.schema}.session_replace($1,$2,$3::jsonb) as replaced`,
      [hash, expectedVersion, JSON.stringify(encryptedTokens)],
    );
    if (!result.rows[0].replaced) throw new WorkspaceError("unauthenticated");
  }
  async touch(q: Transaction, hash: string) {
    const result = await q.query(
      `select ${this.database.schema}.session_touch($1) as touched`,
      [hash],
    );
    if (!result.rows[0].touched) throw new WorkspaceError("unauthenticated");
  }
  async revoke(hash: string) {
    await this.database.transaction(null, async (q) => {
      await q.query(`select ${this.database.schema}.session_revoke($1)`, [
        hash,
      ]);
    });
  }
  async revokeLocked(q: Transaction, hash: string) {
    await q.query(`select ${this.database.schema}.session_revoke($1)`, [hash]);
  }
}
