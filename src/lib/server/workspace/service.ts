import { randomUUID } from "node:crypto";
import { z } from "zod";
import type {
  ComparisonSelection,
  ComparisonWorkspaceV1,
  CreateMemo,
  GenerationWorkspaceV1,
  Principal,
  Result,
  UpdateCompany,
  UpdateMemo,
} from "../../workspace/contracts";
import { buildBoardSnapshot } from "../../workspace/board";
import {
  comparisonSelectionSchema,
  createCompanySchema,
  createMemoSchema,
  deleteRequestSchema,
  deleteTargetSchema,
  idSchema,
  updateCompanySchema,
  updateMemoSchema,
} from "../../workspace/schema";
import type { KeyRing } from "../auth/crypto";
import { contractProblem, WorkspaceError } from "./errors";
import { verifyGenerationReceipt } from "./generationReceipt";
import { WorkspaceRepository } from "./repository";
export type MutationKind =
  | "company_create"
  | "company_update"
  | "memo_create"
  | "memo_update"
  | "delete";
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fields = Object.fromEntries(
    result.error.issues.map((issue) => [
      issue.path.map(String).join("."),
      "入力内容を確認してください。",
    ]),
  );
  throw new WorkspaceError("invalid_input", fields);
}
async function result<T>(body: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await body() };
  } catch (error) {
    return { ok: false, problem: contractProblem(error) };
  }
}
export class CompanyWorkspace
  implements GenerationWorkspaceV1, ComparisonWorkspaceV1
{
  constructor(
    readonly repository: WorkspaceRepository,
    private readonly receiptKeys: KeyRing,
  ) {}
  async mutate(
    kind: MutationKind,
    p: Principal,
    input: unknown,
    target: { companyId?: string; memoId?: string } = {},
  ) {
    switch (kind) {
      case "company_create":
        return this.repository.createCompany(
          p,
          parse(createCompanySchema, input),
        );
      case "company_update":
        return this.repository.updateCompany(
          p,
          parse(idSchema, target.companyId),
          parse(updateCompanySchema, input),
        );
      case "memo_create": {
        const value = parse(createMemoSchema, input);
        return this.repository.createMemo(
          p,
          parse(idSchema, target.companyId),
          value,
          () => {
            const c = value.candidate;
            if (c.origin === "generated")
              verifyGenerationReceipt(
                c.generationReceipt,
                p.userId,
                c.providerOrigin,
                this.receiptKeys,
              );
          },
        );
      }
      case "memo_update":
        return this.repository.updateMemo(
          p,
          parse(idSchema, target.companyId),
          parse(idSchema, target.memoId),
          parse(updateMemoSchema, input),
        );
      case "delete":
        return this.repository.deleteConfirmed(
          p,
          parse(deleteRequestSchema, input),
        );
    }
  }
  requireCompany(p: Principal, companyId: string) {
    return result(() =>
      this.repository.readCompany(p, parse(idSchema, companyId)),
    );
  }
  createMemo(p: Principal, companyId: string, input: CreateMemo) {
    return result(
      async () =>
        (await this.mutate("memo_create", p, input, { companyId })).outcome,
    );
  }
  readMemo(p: Principal, companyId: string, memoId: string) {
    return result(() =>
      this.repository.readMemo(
        p,
        parse(idSchema, companyId),
        parse(idSchema, memoId),
      ),
    );
  }
  updateCompany(p: Principal, companyId: string, input: UpdateCompany) {
    return result(
      async () =>
        (await this.mutate("company_update", p, input, { companyId })).outcome,
    );
  }
  updateMemo(
    p: Principal,
    companyId: string,
    memoId: string,
    input: UpdateMemo,
  ) {
    return result(
      async () =>
        (await this.mutate("memo_update", p, input, { companyId, memoId }))
          .outcome,
    );
  }
  readComparison(p: Principal, selected: ComparisonSelection[]) {
    return result(() =>
      this.repository.readComparison(
        p,
        parse(comparisonSelectionSchema, { selected }).selected,
      ),
    );
  }
  async board(p: Principal, showEnded: boolean) {
    return buildBoardSnapshot(
      await this.repository.listCards(p),
      showEnded,
      randomUUID(),
    );
  }
  confirmDeletion(p: Principal, input: unknown) {
    return this.repository.confirmDeletion(p, parse(deleteTargetSchema, input));
  }
}
