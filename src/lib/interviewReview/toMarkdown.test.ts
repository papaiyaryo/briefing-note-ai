import { describe, expect, it } from "vitest";

import {
  buildInterviewReviewFileName,
  toInterviewReviewMarkdown,
} from "./toMarkdown";
import type { InterviewReviewStructured } from "./schema";
import type { CompanyMemoStructured } from "../structure/schema";

const review: InterviewReviewStructured = {
  motivationPoints: [
    {
      content: "事業成長に関心がある",
      basis: "ES・面接で使えそうな材料",
      confidence: "confirmed",
    },
  ],
  reverseQuestions: [
    {
      content: "若手の裁量について確認する",
      basis: "次に聞きたい質問",
      confidence: "requires_check",
    },
  ],
  companyUnderstanding: [],
  selfConnectionPoints: [],
};

const memo: CompanyMemoStructured = {
  overview: {
    companyName: "サンプル株式会社",
    eventName: "説明会",
    eventDate: "2026-07-01",
    speakers: "人事",
  },
  facts: ["SaaS を提供している"],
  emphasizedPoints: ["顧客志向を重視"],
  business: [],
  strengths: [],
  idealCandidate: [],
  impressions: ["社員の雰囲気が良い"],
  concerns: [],
  questions: ["育成体制を確認したい"],
  esPoints: ["改善提案の経験を話せる"],
  nextResearch: [],
};

describe("toInterviewReviewMarkdown", () => {
  it("outputs four review sections and marks uncertain items", () => {
    const markdown = toInterviewReviewMarkdown(review, "サンプル株式会社");

    expect(markdown).toContain("# サンプル株式会社 面接前復習メモ");
    expect(markdown).toContain("## 志望理由");
    expect(markdown).toContain("## 逆質問候補");
    expect(markdown).toContain("## 企業理解");
    expect(markdown).toContain("## 自分との接点（ES 接続ポイント）");
    expect(markdown).toContain("若手の裁量について確認する（要確認）");
  });

  it("keeps source categories and web-derived information in separate sections", () => {
    const markdown = toInterviewReviewMarkdown(review, {
      companyName: "サンプル株式会社",
      memo,
      webSupplements: [
        {
          id: "1",
          category: "採用情報",
          content: "募集職種は公式サイトで確認する",
          sourceUrl: "https://example.com/recruit",
          fetchedAt: "2026-07-11",
          confidence: "requires_check",
          status: "adopted",
        },
      ],
    });

    expect(markdown).toContain("### 説明会で得た事実\n- SaaS を提供している");
    expect(markdown).toContain(
      "### 自分の印象・感じたこと\n- 社員の雰囲気が良い",
    );
    expect(markdown).toContain(
      "### HR・社員が強調していた点\n- 顧客志向を重視",
    );
    expect(markdown).toContain("### 後で聞きたい質問\n- 育成体制を確認したい");
    expect(markdown).toContain(
      "### ES・面接で使えそうな材料\n- 改善提案の経験を話せる",
    );
    expect(markdown).toContain("### Web 由来の補足情報");
    expect(markdown).toContain(
      "採用情報: 募集職種は公式サイトで確認する（要確認）",
    );
  });

  it("builds a dedicated interview review file name", () => {
    expect(buildInterviewReviewFileName("A/B 株式会社")).toBe(
      "A-B-株式会社-interview-review.md",
    );
  });
});
