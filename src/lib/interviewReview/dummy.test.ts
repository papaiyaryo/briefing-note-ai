import { describe, expect, it } from "vitest";

import { buildDummyInterviewReview } from "./dummy";
import type { CompanyMemoStructured } from "../structure/schema";

const memo: CompanyMemoStructured = {
  overview: {
    companyName: "サンプル株式会社",
    eventName: "説明会",
    eventDate: "2026-07-01",
    speakers: "人事",
  },
  facts: ["SaaS を提供している"],
  emphasizedPoints: ["顧客志向"],
  business: ["法人向けプロダクト"],
  strengths: ["改善サイクルが速い"],
  idealCandidate: ["自律的に動ける人"],
  impressions: ["社員の雰囲気が良い"],
  concerns: [],
  questions: ["入社後の育成体制は？"],
  esPoints: ["研究で改善提案を続けた経験が活かせる"],
  nextResearch: ["競合との差分"],
};

describe("buildDummyInterviewReview", () => {
  it("separates motivation, questions, company understanding, and self connection points", () => {
    const review = buildDummyInterviewReview(memo);

    expect(review.motivationPoints[0]?.basis).toBe("ES・面接で使えそうな材料");
    expect(review.reverseQuestions[0]?.content).toBe("入社後の育成体制は？");
    expect(review.companyUnderstanding[0]?.basis).toBe("説明会で得た事実");
    expect(review.selfConnectionPoints.map((item) => item.basis)).toContain(
      "求める人物像",
    );
    expect(
      review.reverseQuestions.some(
        (item) => item.confidence === "requires_check",
      ),
    ).toBe(true);
  });
});
