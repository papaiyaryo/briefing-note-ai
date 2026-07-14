import type { CompanyMemoStructured } from "../structure/schema";
import type { WebSupplementItem } from "../types";
import { normalizeInterviewReview } from "./validate";

function firstItems(items: string[], basis: string, limit = 3) {
  return items
    .map((content) => content.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((content) => ({ content, basis, confidence: "confirmed" as const }));
}

export function buildDummyInterviewReview(
  memo: CompanyMemoStructured,
  _webSupplements?: WebSupplementItem[],
  motivationMemo?: string,
) {
  const motivation = motivationMemo?.trim()
    ? [
        {
          content: motivationMemo.trim(),
          basis: "志望度メモ",
          confidence: "confirmed" as const,
        },
      ]
    : [];

  return normalizeInterviewReview({
    motivationPoints: [
      ...motivation,
      ...firstItems(memo.esPoints, "ES・面接で使えそうな材料"),
      ...firstItems(memo.impressions, "自分の印象・感じたこと", 2),
    ],
    reverseQuestions: [
      ...firstItems(memo.questions, "次に聞きたい質問"),
      ...firstItems(memo.nextResearch, "次に調べること", 2).map((item) => ({
        ...item,
        content: `${item.content}について、面接で確認する`,
        confidence: "requires_check" as const,
      })),
    ],
    companyUnderstanding: [
      ...firstItems(memo.facts, "説明会で得た事実"),
      ...firstItems(memo.business, "事業内容", 2),
    ],
    selfConnectionPoints: [
      ...firstItems(memo.strengths, "強み・特徴", 2),
      ...firstItems(memo.idealCandidate, "求める人物像", 2),
      ...firstItems(memo.esPoints, "ES・面接で使えそうな材料", 3),
    ],
  });
}
