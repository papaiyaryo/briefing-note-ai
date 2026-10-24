import { randomUUID } from "node:crypto";
import type {
  Company,
  Memo,
  ComparisonSnapshot,
} from "../../src/lib/workspace/contracts";
import { emptyStructure } from "../u1-company-notes/fixtures";
export { OWNER_A, OWNER_B } from "../u1-company-notes/fixtures";
export const id = () => randomUUID();
export const instant = "2026-10-17T00:00:00.000Z";
export function company(overrides: Partial<Company> = {}): Company {
  return {
    companyId: id(),
    version: id(),
    name: "同名企業",
    industry: null,
    interestLevel: null,
    personalNote: "企業自由メモ",
    selectionStatus: "not_applied",
    nextSelectionDate: null,
    applicationDeadline: null,
    officialUrl: null,
    createdAt: instant,
    updatedAt: instant,
    ...overrides,
  };
}
export function memo(
  companyId: string,
  overrides: Partial<Memo> = {},
): Memo & { structuredContent: NonNullable<Memo["structuredContent"]> } {
  return {
    memoId: id(),
    companyId,
    version: id(),
    origin: "manual",
    providerOrigin: null,
    markdown: "本文だけの値",
    structuredContent: {
      ...emptyStructure(),
      strengths: ["紙の強み"],
      questions: ["要確認"],
    },
    correctedOcr: "訂正OCR",
    event: null,
    adoptedWebSources: [],
    comparisonReason: null,
    createdAt: instant,
    updatedAt: instant,
    ...overrides,
  } as Memo & { structuredContent: NonNullable<Memo["structuredContent"]> };
}
export function snapshot(count = 2): ComparisonSnapshot {
  return {
    snapshotVersion: id(),
    sources: Array.from({ length: count }, () => {
      const c = company();
      return { company: c, memo: memo(c.companyId) };
    }),
  };
}
export const selection = (value: ComparisonSnapshot) =>
  value.sources.map((s) => ({
    companyId: s.company.companyId,
    memoId: s.memo.memoId,
  }));
export function legacyRecord() {
  return {
    id: "old-fallback-id",
    memo: emptyStructure(),
    markdown: "旧本文",
    interestNote: { level: "undecided", memo: "旧理由" },
    savedAt: "旧日時文字列",
    updatedAt: "旧日時文字列",
  };
}
