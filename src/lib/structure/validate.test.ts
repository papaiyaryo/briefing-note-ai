import { describe, expect, it } from "vitest";

import { validateCompanyMemo } from "./validate";

const validMemo = {
  overview: {
    companyName: "青葉フューチャーリンク株式会社",
    eventName: "会社説明会",
    eventDate: "2026-06-12",
    speakers: "採用担当",
  },
  facts: ["事実"],
  emphasizedPoints: ["強調点"],
  business: ["事業"],
  strengths: ["強み"],
  idealCandidate: ["人物像"],
  impressions: [],
  concerns: ["懸念"],
  questions: ["質問"],
  esPoints: [],
  nextResearch: ["要確認"],
};

describe("validateCompanyMemo", () => {
  it("validates a complete CompanyMemoStructured object", () => {
    expect(validateCompanyMemo(validMemo)).toEqual({ ok: true, memo: validMemo });
  });

  it("rejects missing or incorrectly typed fields", () => {
    expect(validateCompanyMemo({ ...validMemo, facts: "事実" })).toEqual({
      ok: false,
      code: "validation_failed",
    });
    const { questions, ...missingQuestions } = validMemo;
    void questions;
    expect(validateCompanyMemo(missingQuestions)).toEqual({
      ok: false,
      code: "validation_failed",
    });
  });
});
