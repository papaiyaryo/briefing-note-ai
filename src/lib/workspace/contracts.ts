import type { CompanyMemoStructured } from "../structure/schema";
import type { CompanyEventInfo, WebSupplementItem } from "../types";
import type { InterestLevel } from "../comparison";

export type Id = string;
export type Version = string;
export type DateOnly = string;
export type Instant = string;
export type SelectionStatus =
  | "not_applied"
  | "considering"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "withdrawn"
  | "rejected";
export interface CompanyFields {
  name: string;
  industry: string | null;
  interestLevel: InterestLevel | null;
  personalNote: string | null;
  selectionStatus: SelectionStatus;
  nextSelectionDate: DateOnly | null;
  applicationDeadline: DateOnly | null;
  officialUrl: string | null;
}
export interface Company extends CompanyFields {
  companyId: Id;
  version: Version;
  createdAt: Instant;
  updatedAt: Instant;
}
export interface AdoptedWebSource extends WebSupplementItem {
  status: "adopted";
}
export interface MemoFields {
  markdown: string;
  structuredContent: CompanyMemoStructured | null;
  correctedOcr: string | null;
  event: CompanyEventInfo | null;
  adoptedWebSources: AdoptedWebSource[];
  comparisonReason: string | null;
}
export interface Memo extends MemoFields {
  memoId: Id;
  companyId: Id;
  origin: "manual" | "generated";
  providerOrigin: "dummy" | "openai" | null;
  version: Version;
  createdAt: Instant;
  updatedAt: Instant;
}
export type MemoSummary = Pick<
  Memo,
  | "memoId"
  | "companyId"
  | "origin"
  | "providerOrigin"
  | "version"
  | "createdAt"
  | "updatedAt"
> & { hasStructuredContent: boolean };
export type CompanyCard = Pick<
  Company,
  | "companyId"
  | "name"
  | "industry"
  | "interestLevel"
  | "selectionStatus"
  | "nextSelectionDate"
  | "applicationDeadline"
  | "version"
  | "updatedAt"
> & { memoCount: number };
export interface BoardSnapshot {
  snapshotVersion: Version;
  cards: CompanyCard[];
  countsByStatus: Record<SelectionStatus, number>;
  savedCompanyCount: number;
  visibleCompanyCount: number;
  activeCompanyCount: number;
  showEnded: boolean;
}
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
export type ErrorCode =
  | "invalid_input"
  | "payload_too_large"
  | "unauthenticated"
  | "origin_forbidden"
  | "not_found"
  | "version_conflict"
  | "confirmation_changed"
  | "confirmation_expired"
  | "operation_reused"
  | "operation_unknown"
  | "rate_limited"
  | "unavailable"
  | "internal_error";
export interface ContractError {
  error: {
    code: ErrorCode;
    message: string;
    requestId: Id;
    fields?: Record<string, string>;
    retryAfterSeconds?: number;
  };
}
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; problem: ContractError };
declare const verifiedPrincipal: unique symbol;
export interface Principal {
  readonly userId: Id;
  readonly sessionHash: string;
  readonly [verifiedPrincipal]: true;
}
export interface MutationOutcome {
  operationId: Id;
  action:
    | "company_create"
    | "company_update"
    | "memo_create"
    | "memo_update"
    | "company_delete"
    | "memo_delete";
  companyId: Id;
  memoId: Id | null;
  resultingVersion: Version | null;
  committedAt: Instant;
}
export type OperationLookup =
  | { state: "committed"; outcome: MutationOutcome }
  | { state: "unknown" };
export interface DeleteSnapshot {
  confirmationId: Id;
  companyId: Id;
  memoId: Id | null;
  companyName: string;
  targetVersion: Version;
  affectedMemos: Array<{ memoId: Id; version: Version }>;
  displayedMemoCount: number;
  expiresAt: Instant;
}
export interface DeleteRequest {
  operationId: Id;
  confirmationId: Id;
}
export interface GeneratedCandidate extends MemoFields {
  origin: "generated";
  structuredContent: CompanyMemoStructured;
  correctedOcr: string;
  event: CompanyEventInfo;
  providerOrigin: "dummy" | "openai";
  generationReceipt: string;
}
export interface ManualCandidate extends MemoFields {
  origin: "manual";
  providerOrigin: null;
}
export interface CreateMemo {
  operationId: Id;
  memoId: Id;
  candidate: GeneratedCandidate | ManualCandidate;
}
export interface CreateCompany {
  operationId: Id;
  companyId: Id;
  fields: Pick<CompanyFields, "name"> & Partial<Omit<CompanyFields, "name">>;
}
export interface UpdateCompany {
  operationId: Id;
  expectedVersion: Version;
  changes: Partial<CompanyFields>;
}
export interface UpdateMemo {
  operationId: Id;
  expectedVersion: Version;
  changes: Partial<MemoFields>;
}
export interface ComparisonSelection {
  companyId: Id;
  memoId: Id;
}
export interface ComparisonSnapshot {
  snapshotVersion: Version;
  sources: Array<{
    company: Company;
    memo: Memo & { structuredContent: CompanyMemoStructured };
  }>;
}
export interface AccessControlV1 {
  authenticate(request: Request): Promise<Result<Principal>>;
}
export interface GenerationWorkspaceV1 {
  requireCompany(principal: Principal, companyId: Id): Promise<Result<Company>>;
  createMemo(
    principal: Principal,
    companyId: Id,
    input: CreateMemo,
  ): Promise<Result<MutationOutcome>>;
  readMemo(
    principal: Principal,
    companyId: Id,
    memoId: Id,
  ): Promise<Result<Memo>>;
}
export interface ComparisonWorkspaceV1 {
  readComparison(
    principal: Principal,
    selected: ComparisonSelection[],
  ): Promise<Result<ComparisonSnapshot>>;
  updateCompany(
    principal: Principal,
    companyId: Id,
    input: UpdateCompany,
  ): Promise<Result<MutationOutcome>>;
  updateMemo(
    principal: Principal,
    companyId: Id,
    memoId: Id,
    input: UpdateMemo,
  ): Promise<Result<MutationOutcome>>;
}
