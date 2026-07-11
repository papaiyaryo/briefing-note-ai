import { describe, expect, it } from "vitest";

import {
  buildInterviewReviewFileName,
  toInterviewReviewMarkdown,
} from "./toMarkdown";
import type { InterviewReviewStructured } from "./schema";

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

  it("builds a dedicated interview review file name", () => {
    expect(buildInterviewReviewFileName("A/B 株式会社")).toBe(
      "A-B-株式会社-interview-review.md",
    );
  });
});
