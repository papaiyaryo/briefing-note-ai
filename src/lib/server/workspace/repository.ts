import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type {
  Company,
  CompanyCard,
  ComparisonSelection,
  ComparisonSnapshot,
  CreateCompany,
  CreateMemo,
  DeleteRequest,
  DeleteSnapshot,
  Memo,
  MemoSummary,
  MutationOutcome,
  OperationLookup,
  Page,
  Principal,
  UpdateCompany,
  UpdateMemo,
} from "../../workspace/contracts";
import { canonicalJson } from "../../workspace/validation";
import {
  companyFieldsSchema,
  memoFieldsSchema,
  structuredContentSchema,
} from "../../workspace/schema";
import { WorkspaceDatabase, type Transaction } from "./database";
import { WorkspaceError } from "./errors";

type Row = Record<string, unknown>;
type OutcomeTarget = Omit<MutationOutcome, "operationId" | "committedAt">;
export interface MutationResult {
  outcome: MutationOutcome;
  replayed: boolean;
}
const companyColumns: Record<string, string> = {
  name: "name",
  industry: "industry",
  interestLevel: "interest_level",
  personalNote: "personal_note",
  selectionStatus: "selection_status",
  nextSelectionDate: "next_selection_date",
  applicationDeadline: "application_deadline",
  officialUrl: "official_url",
};
const memoColumns: Record<string, string> = {
  markdown: "markdown",
  structuredContent: "structured_content",
  correctedOcr: "corrected_ocr",
  event: "event",
  adoptedWebSources: "adopted_web_sources",
  comparisonReason: "comparison_reason",
};
const jsonFields = new Set(["structuredContent", "event", "adoptedWebSources"]);
const instant = (value: unknown) =>
  value instanceof Date ? value.toISOString() : String(value);
const date = (value: unknown) =>
  value instanceof Date
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
    : value == null
      ? null
      : String(value);
function company(row: Row): Company {
  return {
    ...companyFieldsSchema.parse({
      name: row.name,
      industry: row.industry,
      interestLevel: row.interest_level,
      personalNote: row.personal_note,
      selectionStatus: row.selection_status,
      nextSelectionDate: date(row.next_selection_date),
      applicationDeadline: date(row.application_deadline),
      officialUrl: row.official_url,
    }),
    companyId: String(row.company_id),
    version: String(row.version),
    createdAt: instant(row.created_at),
    updatedAt: instant(row.updated_at),
  };
}
function memo(row: Row): Memo {
  return {
    ...memoFieldsSchema.parse({
      markdown: row.markdown,
      structuredContent: row.structured_content,
      correctedOcr: row.corrected_ocr,
      event: row.event,
      adoptedWebSources: row.adopted_web_sources,
      comparisonReason: row.comparison_reason,
    }),
    memoId: String(row.memo_id),
    companyId: String(row.company_id),
    origin: row.origin as Memo["origin"],
    providerOrigin: row.provider_origin as Memo["providerOrigin"],
    version: String(row.version),
    createdAt: instant(row.created_at),
    updatedAt: instant(row.updated_at),
  };
}
function outcome(row: Row): MutationOutcome {
  return {
    operationId: String(row.operation_id),
    action: row.action as MutationOutcome["action"],
    companyId: String(row.company_id),
    memoId: row.memo_id == null ? null : String(row.memo_id),
    resultingVersion:
      row.resulting_version == null ? null : String(row.resulting_version),
    committedAt: instant(row.committed_at),
  };
}

export class WorkspaceRepository {
  constructor(
    readonly database: WorkspaceDatabase,
    private readonly cursorKey: Buffer,
  ) {
    if (cursorKey.length !== 32) throw new WorkspaceError("unavailable");
  }
  private get schema() {
    return this.database.schema;
  }
  private async companyRow(q: Transaction, companyId: string, lock = false) {
    const r = await q.query(
      `select * from ${this.schema}.companies where company_id=$1${lock ? " FOR UPDATE" : ""}`,
      [companyId],
    );
    if (!r.rows[0]) throw new WorkspaceError("not_found");
    return r.rows[0];
  }
  private async memoRow(
    q: Transaction,
    companyId: string,
    memoId: string,
    lock = false,
  ) {
    const r = await q.query(
      `select * from ${this.schema}.memos where company_id=$1 and memo_id=$2${lock ? " FOR UPDATE" : ""}`,
      [companyId, memoId],
    );
    if (!r.rows[0]) throw new WorkspaceError("not_found");
    return r.rows[0];
  }
  async readCompany(p: Principal, companyId: string) {
    return this.database.transaction(
      p,
      async (q) => company(await this.companyRow(q, companyId)),
      { readOnly: true },
    );
  }
  async readMemo(p: Principal, companyId: string, memoId: string) {
    return this.database.transaction(
      p,
      async (q) => {
        await this.companyRow(q, companyId);
        return memo(await this.memoRow(q, companyId, memoId));
      },
      { readOnly: true },
    );
  }
  private async execute(
    p: Principal,
    operationId: string,
    request: unknown,
    change: (q: Transaction) => Promise<OutcomeTarget>,
  ): Promise<MutationResult> {
    const hash = createHash("sha256")
      .update(canonicalJson(request))
      .digest("hex");
    return this.database.transaction(p, async (q) => {
      await q.query("select pg_advisory_xact_lock(hashtextextended($1,0))", [
        `${p.userId}:${operationId}`,
      ]);
      const prior = await q.query(
        `select * from ${this.schema}.write_operations where owner_id=$1 and operation_id=$2`,
        [p.userId, operationId],
      );
      if (prior.rows[0]) {
        if (prior.rows[0].request_fingerprint !== hash)
          throw new WorkspaceError("operation_reused");
        return { outcome: outcome(prior.rows[0]), replayed: true };
      }
      const target = await change(q);
      const saved = await q.query(
        `insert into ${this.schema}.write_operations(owner_id,operation_id,request_fingerprint,action,company_id,memo_id,resulting_version) values($1,$2,$3,$4,$5,$6,$7) returning *`,
        [
          p.userId,
          operationId,
          hash,
          target.action,
          target.companyId,
          target.memoId,
          target.resultingVersion,
        ],
      );
      return { outcome: outcome(saved.rows[0]), replayed: false };
    });
  }
  async createCompany(p: Principal, input: CreateCompany) {
    return this.execute(
      p,
      input.operationId,
      { kind: "company_create", input },
      async (q) => {
        const f = input.fields;
        const r = await q.query(
          `insert into ${this.schema}.companies(company_id,owner_id,name,industry,interest_level,personal_note,selection_status,next_selection_date,application_deadline,official_url) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning version`,
          [
            input.companyId,
            p.userId,
            f.name,
            f.industry ?? null,
            f.interestLevel ?? null,
            f.personalNote ?? null,
            f.selectionStatus ?? "not_applied",
            f.nextSelectionDate ?? null,
            f.applicationDeadline ?? null,
            f.officialUrl ?? null,
          ],
        );
        return {
          action: "company_create",
          companyId: input.companyId,
          memoId: null,
          resultingVersion: r.rows[0].version,
        };
      },
    );
  }
  private async update(
    q: Transaction,
    table: "companies" | "memos",
    idColumn: string,
    targetId: string,
    changes: object,
    columns: Record<string, string>,
  ) {
    const values: unknown[] = [];
    const sets = Object.entries(changes).map(([key, value]) => {
      if (!columns[key]) throw new WorkspaceError("invalid_input");
      values.push(
        jsonFields.has(key) && value !== null ? JSON.stringify(value) : value,
      );
      return `${columns[key]}=$${values.length}`;
    });
    if (!sets.length) throw new WorkspaceError("invalid_input");
    values.push(targetId);
    const r = await q.query(
      `update ${this.schema}.${table} set ${sets.join(",")},version=gen_random_uuid(),updated_at=clock_timestamp() where ${idColumn}=$${values.length} returning version`,
      values,
    );
    return r.rows[0].version as string;
  }
  async updateCompany(p: Principal, companyId: string, input: UpdateCompany) {
    return this.execute(
      p,
      input.operationId,
      { kind: "company_update", companyId, input },
      async (q) => {
        const row = await this.companyRow(q, companyId, true);
        if (row.version !== input.expectedVersion)
          throw new WorkspaceError("version_conflict");
        return {
          action: "company_update",
          companyId,
          memoId: null,
          resultingVersion: await this.update(
            q,
            "companies",
            "company_id",
            companyId,
            input.changes,
            companyColumns,
          ),
        };
      },
    );
  }
  async createMemo(
    p: Principal,
    companyId: string,
    input: CreateMemo,
    verifyGenerated?: () => void,
  ) {
    return this.execute(
      p,
      input.operationId,
      { kind: "memo_create", companyId, input },
      async (q) => {
        if (input.candidate.origin === "generated") {
          if (!verifyGenerated) throw new WorkspaceError("invalid_input");
          verifyGenerated();
        }
        await this.companyRow(q, companyId, true);
        const c = input.candidate;
        const r = await q.query(
          `insert into ${this.schema}.memos(memo_id,owner_id,company_id,origin,provider_origin,markdown,structured_content,corrected_ocr,event,adopted_web_sources,comparison_reason) values($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11) returning version`,
          [
            input.memoId,
            p.userId,
            companyId,
            c.origin,
            c.providerOrigin,
            c.markdown,
            c.structuredContent === null
              ? null
              : JSON.stringify(c.structuredContent),
            c.correctedOcr,
            c.event === null ? null : JSON.stringify(c.event),
            JSON.stringify(c.adoptedWebSources),
            c.comparisonReason,
          ],
        );
        return {
          action: "memo_create",
          companyId,
          memoId: input.memoId,
          resultingVersion: r.rows[0].version,
        };
      },
    );
  }
  async updateMemo(
    p: Principal,
    companyId: string,
    memoId: string,
    input: UpdateMemo,
  ) {
    return this.execute(
      p,
      input.operationId,
      { kind: "memo_update", companyId, memoId, input },
      async (q) => {
        await this.companyRow(q, companyId, true);
        const row = await this.memoRow(q, companyId, memoId, true);
        if (row.version !== input.expectedVersion)
          throw new WorkspaceError("version_conflict");
        return {
          action: "memo_update",
          companyId,
          memoId,
          resultingVersion: await this.update(
            q,
            "memos",
            "memo_id",
            memoId,
            input.changes,
            memoColumns,
          ),
        };
      },
    );
  }
  async lookupOperation(
    p: Principal,
    operationId: string,
  ): Promise<OperationLookup> {
    return this.database.transaction(
      p,
      async (q) => {
        const r = await q.query(
          `select * from ${this.schema}.write_operations where operation_id=$1`,
          [operationId],
        );
        return r.rows[0]
          ? { state: "committed", outcome: outcome(r.rows[0]) }
          : { state: "unknown" };
      },
      { readOnly: true },
    );
  }
  async listCards(p: Principal): Promise<CompanyCard[]> {
    return this.database.transaction(
      p,
      async (q) => {
        const r = await q.query(
          `select c.*,count(m.memo_id)::int as memo_count from ${this.schema}.companies c left join ${this.schema}.memos m using(owner_id,company_id) group by c.company_id order by c.updated_at desc,c.company_id`,
        );
        return r.rows.map((row) => {
          const c = company(row);
          return {
            companyId: c.companyId,
            name: c.name,
            industry: c.industry,
            interestLevel: c.interestLevel,
            selectionStatus: c.selectionStatus,
            nextSelectionDate: c.nextSelectionDate,
            applicationDeadline: c.applicationDeadline,
            version: c.version,
            updatedAt: c.updatedAt,
            memoCount: row.memo_count,
          };
        });
      },
      { readOnly: true },
    );
  }
  private encodeCursor(value: object) {
    const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
    return `${payload}.${createHmac("sha256", this.cursorKey).update(`memo-page:v1:${payload}`).digest("base64url")}`;
  }
  private decodeCursor(
    cursor: string,
    p: Principal,
    companyId: string,
  ): { at: string; id: string } {
    try {
      const [payload, signature, ...extra] = cursor.split(".");
      const expected = createHmac("sha256", this.cursorKey)
        .update(`memo-page:v1:${payload}`)
        .digest();
      const got = Buffer.from(signature, "base64url");
      if (
        extra.length ||
        got.length !== expected.length ||
        !timingSafeEqual(got, expected)
      )
        throw new Error();
      const value = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8"),
      );
      if (
        value.owner !== p.userId ||
        value.company !== companyId ||
        typeof value.at !== "string" ||
        typeof value.id !== "string"
      )
        throw new Error();
      return value;
    } catch {
      throw new WorkspaceError("invalid_input");
    }
  }
  async listMemos(
    p: Principal,
    companyId: string,
    options: { limit?: number; cursor?: string },
  ): Promise<Page<MemoSummary>> {
    const limit = options.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new WorkspaceError("invalid_input");
    const cursor = options.cursor
      ? this.decodeCursor(options.cursor, p, companyId)
      : null;
    return this.database.transaction(
      p,
      async (q) => {
        await this.companyRow(q, companyId);
        const r = await q.query(
          `select memo_id,company_id,origin,provider_origin,version,created_at,updated_at,structured_content is not null as has_structured_content,to_char(updated_at,'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as cursor_at from ${this.schema}.memos where company_id=$1 and ($2::timestamptz is null or updated_at<$2::timestamptz or (updated_at=$2::timestamptz and memo_id>$3::uuid)) order by updated_at desc,memo_id limit $4`,
          [companyId, cursor?.at ?? null, cursor?.id ?? null, limit + 1],
        );
        const rows = r.rows.slice(0, limit);
        const last = rows.at(-1);
        return {
          items: rows.map((row) => ({
            memoId: row.memo_id,
            companyId: row.company_id,
            origin: row.origin,
            providerOrigin: row.provider_origin,
            version: row.version,
            createdAt: instant(row.created_at),
            updatedAt: instant(row.updated_at),
            hasStructuredContent: row.has_structured_content,
          })),
          nextCursor:
            r.rows.length > limit && last
              ? this.encodeCursor({
                  owner: p.userId,
                  company: companyId,
                  at: last.cursor_at,
                  id: last.memo_id,
                })
              : null,
        };
      },
      { readOnly: true },
    );
  }
  async confirmDeletion(
    p: Principal,
    target: { companyId: string; memoId: string | null },
  ): Promise<DeleteSnapshot> {
    return this.database.transaction(p, async (q) => {
      const parent = await this.companyRow(q, target.companyId, true);
      const r = await q.query(
        `select memo_id,version from ${this.schema}.memos where company_id=$1 and ($2::uuid is null or memo_id=$2) order by memo_id`,
        [target.companyId, target.memoId],
      );
      if (target.memoId && !r.rows.length)
        throw new WorkspaceError("not_found");
      const affected = r.rows.map((row) => ({
        memoId: row.memo_id,
        version: row.version,
      }));
      const targetVersion = target.memoId ? r.rows[0].version : parent.version;
      const saved = await q.query(
        `insert into ${this.schema}.deletion_snapshots(confirmation_id,owner_id,company_id,memo_id,company_name,target_version,company_version,children_version,affected_memos,displayed_memo_count) values($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10) returning expires_at,confirmation_id`,
        [
          randomUUID(),
          p.userId,
          target.companyId,
          target.memoId,
          parent.name,
          targetVersion,
          parent.version,
          parent.children_version,
          JSON.stringify(affected),
          affected.length,
        ],
      );
      return {
        confirmationId: saved.rows[0].confirmation_id,
        companyId: target.companyId,
        memoId: target.memoId,
        companyName: parent.name,
        targetVersion,
        affectedMemos: affected,
        displayedMemoCount: affected.length,
        expiresAt: instant(saved.rows[0].expires_at),
      };
    });
  }
  async deleteConfirmed(p: Principal, input: DeleteRequest) {
    return this.execute(
      p,
      input.operationId,
      { kind: "delete", input },
      async (q) => {
        const r = await q.query(
          `select * from ${this.schema}.deletion_snapshots where confirmation_id=$1`,
          [input.confirmationId],
        );
        const snapshot = r.rows[0];
        if (!snapshot) throw new WorkspaceError("not_found");
        if (new Date(snapshot.expires_at).getTime() <= Date.now())
          throw new WorkspaceError("confirmation_expired");
        const parent = await this.companyRow(q, snapshot.company_id, true);
        // 親ロックの待機中に確認期限を越えた要求も、新規削除を確定しない。
        if (new Date(snapshot.expires_at).getTime() <= Date.now())
          throw new WorkspaceError("confirmation_expired");
        const children = await q.query(
          `select memo_id,version from ${this.schema}.memos where company_id=$1 and ($2::uuid is null or memo_id=$2) order by memo_id`,
          [snapshot.company_id, snapshot.memo_id],
        );
        const actual = children.rows.map((row) => ({
          memoId: row.memo_id,
          version: row.version,
        }));
        if (
          parent.version !== snapshot.company_version ||
          parent.children_version !== snapshot.children_version ||
          canonicalJson(actual) !== canonicalJson(snapshot.affected_memos)
        )
          throw new WorkspaceError("confirmation_changed");
        if (snapshot.memo_id)
          await q.query(`delete from ${this.schema}.memos where memo_id=$1`, [
            snapshot.memo_id,
          ]);
        else
          await q.query(
            `delete from ${this.schema}.companies where company_id=$1`,
            [snapshot.company_id],
          );
        return {
          action: snapshot.memo_id ? "memo_delete" : "company_delete",
          companyId: snapshot.company_id,
          memoId: snapshot.memo_id,
          resultingVersion: null,
        };
      },
    );
  }
  async readComparison(
    p: Principal,
    selected: ComparisonSelection[],
  ): Promise<ComparisonSnapshot> {
    return this.database.transaction(
      p,
      async (q) => {
        const sources = [];
        for (const selection of selected) {
          const c = company(await this.companyRow(q, selection.companyId));
          const m = memo(
            await this.memoRow(q, selection.companyId, selection.memoId),
          );
          if (!m.structuredContent) throw new WorkspaceError("invalid_input");
          sources.push({
            company: c,
            memo: {
              ...m,
              structuredContent: structuredContentSchema.parse(
                m.structuredContent,
              ),
            },
          });
        }
        return { snapshotVersion: randomUUID(), sources };
      },
      { readOnly: true },
    );
  }
}
