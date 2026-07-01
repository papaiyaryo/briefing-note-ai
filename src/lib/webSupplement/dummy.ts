import type { WebSupplementResult } from "./schema";
import { normalizeWebSupplementResult } from "./validate";

export function buildDummyWebSupplement(
  companyName: string,
): WebSupplementResult {
  const retrievedAt = new Date().toISOString().slice(0, 10);
  return normalizeWebSupplementResult({
    companyName,
    items: [
      {
        title: `${companyName} 公式サイト確認候補`,
        summary:
          "公式サイトの会社概要・採用情報ページで、事業内容や募集情報の最新内容を確認してください。",
        sourceUrl: "https://example.com/official-company-page",
        retrievedAt,
        confidence: "low",
        needsVerification: true,
        sourceType: "non_official",
      },
    ],
  });
}
