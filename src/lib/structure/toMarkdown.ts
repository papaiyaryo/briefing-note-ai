import { fenceFor } from "../markdown";
import type { WebSupplementItem } from "../types";
import type { CompanyMemoStructured } from "./schema";

export interface ToMarkdownOptions {
  ocrText: string;
  imageFileNames?: string[];
  webSupplements?: WebSupplementItem[];
}

function valueOrPending(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? "要確認" : trimmed;
}

function bullets(items: string[]): string {
  const visible = items.map((item) => item.trim()).filter(Boolean);
  if (visible.length === 0) return "- 要確認";
  return visible.map((item) => `- ${item}`).join("\n");
}

function confidenceLabel(confidence: WebSupplementItem["confidence"]): string {
  switch (confidence) {
    case "high":
      return "高";
    case "medium":
      return "中";
    case "low":
      return "低";
    case "requires_check":
      return "要確認";
  }
}

function webSupplementSection(items: WebSupplementItem[] | undefined): string {
  const adopted = items?.filter((item) => item.status === "adopted") ?? [];

  if (adopted.length === 0) {
    return "- 採用済みの Web 補足情報はありません";
  }

  return adopted
    .map((item) =>
      [
        `### ${item.category.trim() || "Web 補足"}`,
        `- 内容: ${item.content.trim() || "要確認"}`,
        `- 出典 URL: ${item.sourceUrl.trim() || "要確認"}`,
        `- 取得日: ${item.fetchedAt.trim() || "要確認"}`,
        `- 信頼度: ${confidenceLabel(item.confidence)}`,
      ].join("\n"),
    )
    .join("\n\n");
}

export function toMarkdown(
  memo: CompanyMemoStructured,
  opts: ToMarkdownOptions,
): string {
  const companyName = valueOrPending(memo.overview.companyName);
  const imageFileNames =
    opts.imageFileNames?.map((name) => name.trim()).filter(Boolean) ?? [];
  const imageFileName =
    imageFileNames.length > 0 ? imageFileNames.join(", ") : "不明";
  const ocrExcerpt = opts.ocrText.trim() || "(OCR 結果なし)";
  const fence = fenceFor(ocrExcerpt);

  return `# ${companyName}

## 説明会概要
- 企業名: ${companyName}
- イベント名: ${valueOrPending(memo.overview.eventName)}
- 日時: ${valueOrPending(memo.overview.eventDate)}
- 登壇者: ${valueOrPending(memo.overview.speakers)}
- メモ元画像: ${imageFileName}

## 説明会で得た事実
${bullets(memo.facts)}

## HR・社員が強調していた点
${bullets(memo.emphasizedPoints)}

## 事業内容
${bullets(memo.business)}

## 強み・特徴
${bullets(memo.strengths)}

## 求める人物像
${bullets(memo.idealCandidate)}

## 自分の印象・感じたこと
${bullets(memo.impressions)}

## 気になった点
${bullets(memo.concerns)}

## 次に聞きたい質問
${bullets(memo.questions)}

## ES・面接で使えそうな材料
${bullets(memo.esPoints)}

## 次に調べること
${bullets(memo.nextResearch)}

## Web 補足情報
${webSupplementSection(opts.webSupplements)}

## 元メモからの抜粋
${fence}text
${ocrExcerpt}
${fence}
`;
}
