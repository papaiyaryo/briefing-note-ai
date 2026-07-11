import type { InterviewReviewItem, InterviewReviewStructured } from "./schema";

function valueOrPending(value?: string): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? "要確認" : trimmed;
}

function itemLine(item: InterviewReviewItem): string {
  const suffix = item.confidence === "requires_check" ? "（要確認）" : "";
  return `- ${valueOrPending(item.content)}${suffix}\n  - 根拠: ${valueOrPending(item.basis)}`;
}

function section(title: string, items: InterviewReviewItem[]): string {
  if (items.length === 0) return `## ${title}\n- 要確認`;
  return `## ${title}\n${items.map(itemLine).join("\n")}`;
}

export function toInterviewReviewMarkdown(
  review: InterviewReviewStructured,
  companyName?: string,
): string {
  return `# ${valueOrPending(companyName)} 面接前復習メモ

${section("志望理由", review.motivationPoints)}

${section("逆質問候補", review.reverseQuestions)}

${section("企業理解", review.companyUnderstanding)}

${section("自分との接点（ES 接続ポイント）", review.selfConnectionPoints)}
`;
}

export function buildInterviewReviewFileName(companyName?: string): string {
  const sanitized = (companyName ?? "")
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.\-\s]+|[.\-\s]+$/g, "")
    .slice(0, 80)
    .replace(/[.\-\s]+$/g, "");
  return `${sanitized || "briefing-note"}-interview-review.md`;
}
