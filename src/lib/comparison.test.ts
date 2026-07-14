import { describe, expect, it } from "vitest";

import type { SavedCompanyMemo } from "./comparison";
import { toComparisonMarkdown } from "./comparison";

const baseMemo: SavedCompanyMemo = {
  id: "memo-1",
  memo: {
    overview: {
      companyName: "青葉フューチャーリンク株式会社",
      eventName: "説明会",
      eventDate: "2026-06-12",
      speakers: "採用担当",
    },
    facts: ["事実"],
    emphasizedPoints: ["顧客理解を重視"],
    business: ["業務支援クラウド"],
    strengths: ["現場観察", "継続改善"],
    idealCandidate: ["改善を続ける人"],
    impressions: ["研究経験とつなげやすい"],
    concerns: ["研修期間は要確認"],
    questions: ["若手の裁量は？"],
    esPoints: ["ヒアリング経験を話せる"],
    nextResearch: ["導入事例"],
  },
  markdown: "# 青葉フューチャーリンク株式会社",
  interestNote: { level: "high", memo: "顧客理解への共感が強い" },
  savedAt: "2026-07-03T00:00:00.000Z",
  updatedAt: "2026-07-03T00:00:00.000Z",
};

describe("toComparisonMarkdown", () => {
  it("compares companies with interest notes without mixing web supplements", () => {
    const markdown = toComparisonMarkdown([baseMemo]);

    expect(markdown).toContain("# 企業比較メモ");
    expect(markdown).toContain("| 比較観点 | 青葉フューチャーリンク株式会社 |");
    expect(markdown).toContain("| 強み・特徴 | 現場観察<br>継続改善 |");
    expect(markdown).toContain("| 志望度 | 高い |");
    expect(markdown).toContain("| 志望度メモ | 顧客理解への共感が強い |");
    expect(markdown).toContain("Web 補足情報はこの比較表には混在させない");
  });
});
