import type { BoardSnapshot, CompanyCard, SelectionStatus } from "./contracts";
import { selectionStatuses } from "./schema";
export const statusLabels: Record<SelectionStatus, string> = {
  not_applied: "未応募",
  considering: "検討中",
  applied: "応募済",
  screening: "書類選考",
  interview: "面接",
  offer: "内定",
  withdrawn: "辞退",
  rejected: "不採用",
};
export const hasActiveWarning = (count: number) => count >= 15;
export function buildBoardSnapshot(
  cards: CompanyCard[],
  showEnded: boolean,
  snapshotVersion: string,
): BoardSnapshot {
  const countsByStatus = Object.fromEntries(
    selectionStatuses.map((status) => [status, 0]),
  ) as Record<SelectionStatus, number>;
  for (const card of cards) countsByStatus[card.selectionStatus]++;
  const visible = cards.filter(
    (card) =>
      showEnded || !["withdrawn", "rejected"].includes(card.selectionStatus),
  );
  return {
    snapshotVersion,
    cards: visible,
    countsByStatus,
    savedCompanyCount: cards.length,
    visibleCompanyCount: visible.length,
    activeCompanyCount:
      countsByStatus.applied +
      countsByStatus.screening +
      countsByStatus.interview,
    showEnded,
  };
}
