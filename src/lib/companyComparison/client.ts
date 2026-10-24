import { z } from "zod";
import {
  WorkspaceClient,
  ClientFailure,
  type FixedRequest,
} from "../workspace/client";
import type {
  ComparisonSelection,
  ComparisonSnapshot,
  BoardSnapshot,
  Page,
  MemoSummary,
  MutationOutcome,
  OperationLookup,
  Company,
  Memo,
} from "../workspace/contracts";
import {
  idSchema,
  selectionStatuses,
  updateCompanySchema,
  updateMemoSchema,
} from "../workspace/schema";
import {
  companyResponseSchema,
  memoResponseSchema,
  parseSnapshot,
  validateSelection,
} from "./model";
import type { InterestLevel } from "../comparison";
const integer = z.number().int().nonnegative();
const cardSchema = companyResponseSchema
  .pick({
    companyId: true,
    name: true,
    industry: true,
    interestLevel: true,
    selectionStatus: true,
    nextSelectionDate: true,
    applicationDeadline: true,
    version: true,
    updatedAt: true,
  })
  .extend({ memoCount: integer });
const boardSchema = z.strictObject({
  snapshotVersion: z.string().min(1),
  cards: z.array(cardSchema),
  countsByStatus: z.record(z.enum(selectionStatuses), integer),
  savedCompanyCount: integer,
  visibleCompanyCount: integer,
  activeCompanyCount: integer,
  showEnded: z.boolean(),
});
const summarySchema = z.strictObject({
  memoId: idSchema,
  companyId: idSchema,
  origin: z.enum(["manual", "generated"]),
  providerOrigin: z.enum(["dummy", "openai"]).nullable(),
  version: z.string().min(1),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  hasStructuredContent: z.boolean(),
});
const outcomeSchema = z.strictObject({
  operationId: idSchema,
  action: z.enum([
    "company_create",
    "company_update",
    "memo_create",
    "memo_update",
    "company_delete",
    "memo_delete",
  ]),
  companyId: idSchema,
  memoId: idSchema.nullable(),
  resultingVersion: z.string().min(1).nullable(),
  committedAt: z.iso.datetime({ offset: true }),
});
const lookupSchema = z.discriminatedUnion("state", [
  z.strictObject({ state: z.literal("unknown") }),
  z.strictObject({ state: z.literal("committed"), outcome: outcomeSchema }),
]);

export class ComparisonClient {
  constructor(
    private readonly workspace: WorkspaceClient = new WorkspaceClient(),
  ) {}
  /** 外側の期限はfetch/bodyが取消を無視しても有限終了し、残る要求にもabortを伝える。 */
  private async bounded<T>(
    run: (signal: AbortSignal) => Promise<T>,
    write = false,
    external?: AbortSignal,
  ): Promise<T> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let remove = () => {};
    try {
      const expired = new Promise<never>((_, reject) => {
        const cancel = () => {
          controller.abort();
          reject(new ClientFailure("cancelled", 0, write));
        };
        if (external?.aborted) {
          cancel();
          return;
        }
        external?.addEventListener("abort", cancel, { once: true });
        remove = () => external?.removeEventListener("abort", cancel);
        timer = setTimeout(() => {
          controller.abort();
          reject(new ClientFailure("unavailable", 0, write));
        }, 15000);
      });
      const value = await Promise.race([expired, run(controller.signal)]);
      if (controller.signal.aborted)
        throw new ClientFailure("cancelled", 0, write);
      return value;
    } catch (error) {
      if (error instanceof ClientFailure)
        throw new ClientFailure(
          error.code,
          error.status,
          write && error.unknown,
        );
      throw new ClientFailure("invalid_input", 0, write);
    } finally {
      clearTimeout(timer);
      remove();
    }
  }
  readComparison(
    selected: ComparisonSelection[],
    signal?: AbortSignal,
  ): Promise<ComparisonSnapshot> {
    return this.bounded(
      async (limited) => {
        const fixed = validateSelection(selected);
        const request = this.workspace.prepare(
          "/api/v1/comparison-sources",
          "POST",
          { selected: fixed },
        );
        return parseSnapshot(
          await this.workspace.send(request, limited),
          fixed,
        );
      },
      false,
      signal,
    );
  }
  readBoard(signal?: AbortSignal): Promise<BoardSnapshot> {
    return this.bounded(
      async (s) => {
        const result = boardSchema.parse(
          await this.workspace.get("/api/v1/board?showEnded=true", s),
        );
        if (
          !result.showEnded ||
          new Set(result.cards.map((c) => c.companyId)).size !==
            result.cards.length ||
          result.savedCompanyCount !== result.cards.length
        )
          throw Error("invalid board");
        return result;
      },
      false,
      signal,
    );
  }
  readMemos(
    companyId: string,
    cursor?: string,
    signal?: AbortSignal,
  ): Promise<Page<MemoSummary>> {
    return this.bounded(
      async (s) => {
        idSchema.parse(companyId);
        if (
          cursor !== undefined &&
          (cursor.length === 0 || cursor.length > 4096)
        )
          throw Error("invalid cursor");
        const result = z
          .strictObject({
            items: z.array(summarySchema).max(100),
            nextCursor: z.string().min(1).max(4096).nullable(),
          })
          .parse(
            await this.workspace.get(
              `/api/v1/companies/${companyId}/memos${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`,
              s,
            ),
          );
        if (
          result.items.some((m) => m.companyId !== companyId) ||
          new Set(result.items.map((m) => m.memoId)).size !==
            result.items.length
        )
          throw Error("invalid page");
        return result;
      },
      false,
      signal,
    );
  }
  readCompany(companyId: string, signal?: AbortSignal): Promise<Company> {
    return this.bounded(
      async (s) => {
        idSchema.parse(companyId);
        const result = companyResponseSchema.parse(
          await this.workspace.get(`/api/v1/companies/${companyId}`, s),
        );
        if (result.companyId !== companyId) throw Error("invalid target");
        return result;
      },
      false,
      signal,
    );
  }
  readMemo(
    companyId: string,
    memoId: string,
    signal?: AbortSignal,
  ): Promise<Memo> {
    return this.bounded(
      async (s) => {
        idSchema.parse(companyId);
        idSchema.parse(memoId);
        const result = memoResponseSchema.parse(
          await this.workspace.get(
            `/api/v1/companies/${companyId}/memos/${memoId}`,
            s,
          ),
        );
        if (result.companyId !== companyId || result.memoId !== memoId)
          throw Error("invalid target");
        return result;
      },
      false,
      signal,
    );
  }
  prepareInterest(
    companyId: string,
    version: string,
    value: InterestLevel | null,
    operationId: string,
  ): FixedRequest {
    idSchema.parse(companyId);
    const body = updateCompanySchema
      .extend({ expectedVersion: z.string().min(1) })
      .parse({
        operationId,
        expectedVersion: version,
        changes: { interestLevel: value },
      });
    return this.workspace.prepare(
      `/api/v1/companies/${companyId}`,
      "PATCH",
      body,
    );
  }
  prepareReason(
    companyId: string,
    memoId: string,
    version: string,
    value: string,
    operationId: string,
  ): FixedRequest {
    idSchema.parse(companyId);
    idSchema.parse(memoId);
    const body = updateMemoSchema
      .extend({ expectedVersion: z.string().min(1) })
      .parse({
        operationId,
        expectedVersion: version,
        changes: { comparisonReason: value },
      });
    return this.workspace.prepare(
      `/api/v1/companies/${companyId}/memos/${memoId}`,
      "PATCH",
      body,
    );
  }
  send(request: FixedRequest, signal?: AbortSignal): Promise<MutationOutcome> {
    return this.bounded(
      async (s) => {
        const result = outcomeSchema.parse(
          await this.workspace.send(request, s),
        );
        const input = JSON.parse(request.body),
          parts = request.path.split("/");
        if (
          result.operationId !== input.operationId ||
          result.companyId !== parts[4] ||
          result.memoId !== (parts[6] ?? null) ||
          result.action !== (parts[6] ? "memo_update" : "company_update") ||
          result.resultingVersion === null
        )
          throw Error("invalid outcome");
        return result;
      },
      true,
      signal,
    );
  }
  lookup(operationId: string, signal?: AbortSignal): Promise<OperationLookup> {
    return this.bounded(
      async (s) => {
        idSchema.parse(operationId);
        const result = lookupSchema.parse(
          await this.workspace.get(`/api/v1/operations/${operationId}`, s),
        );
        if (
          result.state === "committed" &&
          result.outcome.operationId !== operationId
        )
          throw Error("invalid operation");
        return result;
      },
      false,
      signal,
    );
  }
}
