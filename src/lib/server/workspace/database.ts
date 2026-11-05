import { Pool, type PoolClient } from "pg";
import type { Principal } from "../../workspace/contracts";
import { diagnosticCode, sqlProblem, WorkspaceError } from "./errors";
import { remainingRequestTime, markTransactionCommit } from "./requestScope";
import { logServerEvent } from "../log";

/** reason だけを持つDB層の失敗（期限切れなど）は、ここで記録してから投げる。 */
function reportDbFailure(error: unknown): unknown {
  if (
    error instanceof WorkspaceError &&
    error.reason &&
    (error as { cause?: unknown }).cause === undefined &&
    error.code !== "unauthenticated"
  )
    logServerEvent("error", "workspace.db_failed", {
      code: error.code,
      reason: error.reason,
    });
  return error;
}

export type Transaction = PoolClient;
export class WorkspaceDatabase {
  readonly pool: Pool;
  readonly schema: string;
  readonly faults: {
    beforeCommit?: () => void | Promise<void>;
    afterCommit?: () => void | Promise<void>;
  } = {};
  constructor(options: { pool: Pool; schema: string }) {
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(options.schema))
      throw new WorkspaceError(
        "unavailable",
        undefined,
        "invalid_env:WORKSPACE_DB_SCHEMA",
      );
    if (options.pool.options.max !== 3)
      throw new WorkspaceError("unavailable", undefined, "db_pool_max_not_3");
    this.pool = options.pool;
    this.schema = options.schema;
  }
  async transaction<T>(
    principal: Principal | null,
    body: (client: Transaction) => Promise<T>,
    options: { timeoutMs?: number; readOnly?: boolean } = {},
  ): Promise<T> {
    const timeoutMs = Math.min(
      options.timeoutMs ?? 8000,
      8000,
      remainingRequestTime(),
    );
    if (timeoutMs <= 0)
      throw new WorkspaceError(
        "unavailable",
        undefined,
        "request_deadline_exhausted_before_db",
      );
    const started = performance.now();
    const client = await this.acquire(timeoutMs).catch((error: unknown) => {
      throw reportDbFailure(error);
    });
    let released = false,
      commitStarted = false,
      committed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finishCommit: (() => void) | undefined;
    const destroy = () => {
      if (!released) {
        released = true;
        client.release(true);
      }
    };
    try {
      const remaining = Math.floor(timeoutMs - (performance.now() - started));
      if (remaining <= 0)
        throw new WorkspaceError(
          "unavailable",
          undefined,
          "db_connect_used_whole_deadline",
        );
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          destroy();
          reject(
            new WorkspaceError(
              commitStarted ? "operation_unknown" : "unavailable",
              undefined,
              `db_transaction_deadline_${remaining}ms`,
            ),
          );
        }, remaining);
      });
      const work = async () => {
        await client.query(
          options.readOnly ? "BEGIN ISOLATION LEVEL REPEATABLE READ" : "BEGIN",
        );
        await client.query(
          "select set_config('statement_timeout',$1,true),set_config('transaction_timeout',$1,true),set_config('TimeZone','UTC',true)",
          [`${remaining}ms`],
        );
        const role = await client.query(
          "select rolsuper,rolbypassrls from pg_roles where rolname=current_user",
        );
        if (role.rows[0].rolsuper || role.rows[0].rolbypassrls)
          throw new WorkspaceError(
            "unavailable",
            undefined,
            "db_role_is_superuser_or_bypassrls",
          );
        if (principal) await this.bindPrincipal(client, principal);
        const result = await body(client);
        await this.faults.beforeCommit?.();
        if (released || remainingRequestTime() <= 0)
          throw new WorkspaceError(
            "unavailable",
            undefined,
            "request_deadline_exhausted_before_commit",
          );
        commitStarted = true;
        finishCommit = markTransactionCommit();
        await client.query("COMMIT");
        committed = true;
        await this.faults.afterCommit?.();
        return result;
      };
      return await Promise.race([work(), deadline]);
    } catch (error) {
      if (commitStarted) {
        destroy();
        throw new WorkspaceError(
          "operation_unknown",
          undefined,
          "commit_outcome_unknown",
          { cause: error },
        );
      }
      if (!released && !committed) {
        try {
          // 同じ全体deadline timerがROLLBACKも切断まで制限する。
          await client.query("ROLLBACK");
        } catch {
          destroy();
        }
      }
      throw reportDbFailure(sqlProblem(error));
    } finally {
      finishCommit?.();
      clearTimeout(timer);
      if (!released) client.release();
    }
  }
  private async bindPrincipal(client: Transaction, principal: Principal) {
    const rows = await client.query(
      `select * from ${this.schema}.session_lock($1)`,
      [principal.sessionHash],
    );
    const session = rows.rows[0];
    if (
      !session ||
      session.user_id !== principal.userId ||
      session.revoked_at ||
      Number(new Date(session.absolute_expires_at)) <= Date.now() ||
      Number(new Date(session.last_used_at)) + 86400000 <= Date.now()
    )
      throw new WorkspaceError("unauthenticated");
    await client.query("select set_config('app.owner_id',$1,true)", [
      principal.userId,
    ]);
  }
  private async acquire(timeoutMs: number): Promise<PoolClient> {
    let expired = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pending = this.pool.connect().then((client) => {
      if (expired) {
        client.release();
        throw new WorkspaceError(
          "unavailable",
          undefined,
          "db_connect_arrived_after_timeout",
        );
      }
      return client;
    });
    try {
      return await Promise.race([
        pending,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            expired = true;
            reject(
              new WorkspaceError(
                "unavailable",
                undefined,
                "db_connect_timeout",
              ),
            );
          }, timeoutMs);
        }),
      ]);
    } catch (error) {
      if (error instanceof WorkspaceError) throw error;
      // DB接続エラーの本文は資格情報を含みうるため、コードだけ残す。
      throw new WorkspaceError(
        "unavailable",
        undefined,
        `db_connect_failed:${diagnosticCode(error)}`,
      );
    } finally {
      clearTimeout(timer);
    }
  }
  async close() {
    await this.pool.end();
  }
}
