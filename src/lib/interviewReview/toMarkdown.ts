import type { InterviewReviewItem, InterviewReviewStructured } from "./schema";
import type { CompanyMemoStructured } from "../structure/schema";
import type { WebSupplementItem } from "../types";

export interface ToInterviewReviewMarkdownOptions {
  companyName?: string;
  memo?: CompanyMemoStructured;
  webSupplements?: WebSupplementItem[];
}

function valueOrPending(value?: string): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? "要確認" : trimmed;
}

function itemLine(item: InterviewReviewItem): string {
  const suffix = item.confidence === "requires_check" ? "（要確認）" : "";
  return `- ${valueOrPending(item.content)}${suffix}\n  - 根拠: ${valueOrPending(item.basis)}`;
}

function bulletLines(items: string[] | undefined): string {
  const visible = items?.map((item) => item.trim()).filter(Boolean) ?? [];
  if (visible.length === 0) return "- 要確認";
  return visible.map((item) => `- ${item}`).join("\n");
}

function section(title: string, items: InterviewReviewItem[]): string {
  if (items.length === 0) return `## ${title}\n- 要確認`;
  return `## ${title}\n${items.map(itemLine).join("\n")}`;
}

function sourceSeparationSection(
  memo: CompanyMemoStructured | undefined,
  webSupplements: WebSupplementItem[] | undefined,
): string {
  const adoptedWebSupplements =
    webSupplements?.filter((item) => item.status === "adopted") ?? [];
  const webLines =
    adoptedWebSupplements.length === 0
      ? "- 採用済みの Web 補足情報はありません"
      : adoptedWebSupplements
          .map((item) =>
            [
              `- ${valueOrPending(item.category)}: ${valueOrPending(item.content)}（要確認）`,
              `  - 出典 URL: ${valueOrPending(item.sourceUrl)}`,
              `  - 取得日: ${valueOrPending(item.fetchedAt)}`,
            ].join("\n"),
          )
          .join("\n");

  return `## 情報区分別メモ
### 説明会で得た事実
${bulletLines(memo?.facts)}

### 自分の印象・感じたこと
${bulletLines(memo?.impressions)}

### HR・社員が強調していた点
${bulletLines(memo?.emphasizedPoints)}

### 後で聞きたい質問
${bulletLines(memo?.questions)}

### ES・面接で使えそうな材料
${bulletLines(memo?.esPoints)}

### Web 由来の補足情報
${webLines}`;
}

export function toInterviewReviewMarkdown(
  review: InterviewReviewStructured,
  options: ToInterviewReviewMarkdownOptions | string = {},
): string {
  const normalizedOptions =
    typeof options === "string" ? { companyName: options } : options;

  return `# ${valueOrPending(normalizedOptions.companyName)} 面接前復習メモ

${section("志望理由", review.motivationPoints)}

${section("逆質問候補", review.reverseQuestions)}

${section("企業理解", review.companyUnderstanding)}

${section("自分との接点（ES 接続ポイント）", review.selfConnectionPoints)}

${sourceSeparationSection(normalizedOptions.memo, normalizedOptions.webSupplements)}
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
