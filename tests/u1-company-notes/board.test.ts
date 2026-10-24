import { describe, expect, it } from "vitest";
import {
  buildBoardSnapshot,
  hasActiveWarning,
} from "../../src/lib/workspace/board";
import type {
  CompanyCard,
  SelectionStatus,
} from "../../src/lib/workspace/contracts";
import { id } from "./fixtures";
const card = (selectionStatus: SelectionStatus): CompanyCard => ({
  companyId: id(),
  name: "架空社",
  industry: null,
  interestLevel: null,
  selectionStatus,
  nextSelectionDate: null,
  applicationDeadline: null,
  version: id(),
  updatedAt: "2026-10-15T00:00:00.000Z",
  memoCount: 3,
});
describe("ボード / AC3 AC4", () => {
  it.each([0, 4, 5, 14, 15, 16])("対応中%s社と警告境界", (count) => {
    const b = buildBoardSnapshot(
      Array.from({ length: count }, () => card("interview")),
      false,
      "version",
    );
    expect(b.activeCompanyCount).toBe(count);
    expect(hasActiveWarning(b.activeCompanyCount)).toBe(count >= 15);
  });
  it("終了表示と集計を分ける", () => {
    const cards = [
      card("applied"),
      card("considering"),
      card("withdrawn"),
      card("rejected"),
    ];
    const hidden = buildBoardSnapshot(cards, false, "v"),
      shown = buildBoardSnapshot(cards, true, "v");
    expect(hidden.cards).toHaveLength(2);
    expect(shown.cards).toHaveLength(4);
    expect(hidden.activeCompanyCount).toBe(shown.activeCompanyCount);
  });
  it("メモ3件でも企業1社、検討中を除く", () => {
    const c = card("screening");
    expect(
      buildBoardSnapshot([c, card("considering")], false, "v")
        .activeCompanyCount,
    ).toBe(1);
  });
  it("保存0件と表示対象0件を別値にする", () => {
    expect(buildBoardSnapshot([], false, "v").savedCompanyCount).toBe(0);
    const b = buildBoardSnapshot([card("rejected")], false, "v");
    expect(b.savedCompanyCount).toBe(1);
    expect(b.visibleCompanyCount).toBe(0);
  });
  it("8状態すべての件数", () => {
    const statuses: SelectionStatus[] = [
      "not_applied",
      "considering",
      "applied",
      "screening",
      "interview",
      "offer",
      "withdrawn",
      "rejected",
    ];
    expect(
      Object.values(
        buildBoardSnapshot(statuses.map(card), false, "v").countsByStatus,
      ),
    ).toEqual(Array(8).fill(1));
  });
});
