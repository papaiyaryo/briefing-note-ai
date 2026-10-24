import { describe, expect, it } from "vitest";
import {
  createCompanySchema,
  updateCompanySchema,
  createMemoSchema,
  structuredContentSchema,
  comparisonSelectionSchema,
} from "../../src/lib/workspace/schema";
import { id, manualCandidate, emptyStructure } from "./fixtures";

describe("U1 入力契約 / BR2 BR5 BR6 BR10", () => {
  const company = (fields: unknown) => ({
    operationId: id(),
    companyId: id(),
    fields,
  });
  it("AC2.1.1 名前だけをtrimして初期値を補う", () => {
    expect(
      createCompanySchema.parse(company({ name: "  架空社  " })).fields,
    ).toMatchObject({
      name: "架空社",
      selectionStatus: "not_applied",
      industry: null,
    });
  });
  it.each(["", "   ", "あ".repeat(201)])("AC2.1.2 不正名を拒否 %s", (name) =>
    expect(createCompanySchema.safeParse(company({ name })).success).toBe(
      false,
    ),
  );
  it("code pointで200の補助面文字を許す", () =>
    expect(
      createCompanySchema.safeParse(company({ name: "😀".repeat(200) }))
        .success,
    ).toBe(true));
  it("AC2.1.2 前後空白を除去してから200 code pointsを判定", () => {
    expect(
      createCompanySchema.parse(company({ name: `  ${"あ".repeat(200)}  ` }))
        .fields.name,
    ).toBe("あ".repeat(200));
  });
  it.each(["2025-02-29", "2026-02-30", "2026-13-01", "26-01-01"])(
    "AC2.2.2 実在しない日付 %s",
    (nextSelectionDate) =>
      expect(
        createCompanySchema.safeParse(
          company({ name: "社", nextSelectionDate }),
        ).success,
      ).toBe(false),
  );
  it("閏日とnull任意欄を保持", () =>
    expect(
      createCompanySchema.parse(
        company({
          name: "社",
          nextSelectionDate: "2028-02-29",
          officialUrl: null,
        }),
      ).fields.nextSelectionDate,
    ).toBe("2028-02-29"));
  it.each([
    "javascript:alert(1)",
    "https://user:pass@example.com",
    "/relative",
  ])("危険URL %s", (officialUrl) =>
    expect(
      createCompanySchema.safeParse(company({ name: "社", officialUrl }))
        .success,
    ).toBe(false),
  );
  it("空changesとowner入力は拒否", () => {
    expect(
      updateCompanySchema.safeParse({
        operationId: id(),
        expectedVersion: id(),
        changes: {},
      }).success,
    ).toBe(false);
    expect(
      createCompanySchema.safeParse({
        ...company({ name: "社" }),
        ownerId: id(),
      }).success,
    ).toBe(false);
  });
  it("AC6.1.1 本文はtrimせず別正本を保持", () => {
    expect(
      createMemoSchema.parse({
        operationId: id(),
        memoId: id(),
        candidate: manualCandidate(),
      }).candidate.markdown,
    ).toBe("本人のメモ\n");
  });
  it.each(["filename", "image", "objectUrl", "ownerId"])(
    "BR5.2 非許可保持キー %s",
    (key) =>
      expect(
        createMemoSchema.safeParse({
          operationId: id(),
          memoId: id(),
          candidate: { ...manualCandidate(), [key]: "x" },
        }).success,
      ).toBe(false),
  );
  it("空白本文と50001文字を拒否", () => {
    for (const markdown of [" \n", "あ".repeat(50001)])
      expect(
        createMemoSchema.safeParse({
          operationId: id(),
          memoId: id(),
          candidate: { ...manualCandidate(), markdown },
        }).success,
      ).toBe(false);
  });
  it("nullと有効な空構造を区別", () =>
    expect(structuredContentSchema.parse(emptyStructure())).toEqual(
      emptyStructure(),
    ));
  it("overview500と配列100の限界を守る", () => {
    const value = emptyStructure();
    expect(
      structuredContentSchema.safeParse({
        ...value,
        overview: { ...value.overview, speakers: "あ".repeat(501) },
      }).success,
    ).toBe(false);
    expect(
      structuredContentSchema.safeParse({
        ...value,
        facts: Array(101).fill("事実"),
      }).success,
    ).toBe(false);
  });
  it("BR8.1 重複企業と0/21社を拒否", () => {
    const companyId = id();
    for (const selected of [
      [],
      Array.from({ length: 21 }, () => ({ companyId: id(), memoId: id() })),
      [
        { companyId, memoId: id() },
        { companyId, memoId: id() },
      ],
    ])
      expect(comparisonSelectionSchema.safeParse({ selected }).success).toBe(
        false,
      );
  });
});
