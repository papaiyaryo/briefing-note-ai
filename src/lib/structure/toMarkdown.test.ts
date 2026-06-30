import { describe, expect, it } from "vitest";

import type { CompanyMemoStructured } from "./schema";
import { toMarkdown } from "./toMarkdown";

const memo: CompanyMemoStructured = {
  overview: {
    companyName: "青葉フューチャーリンク株式会社",
    eventName: "会社説明会",
    eventDate: "2026-06-12",
    speakers: "採用担当",
  },
  facts: ["説明会で得た事実"],
  emphasizedPoints: ["HR が強調した点"],
  business: ["事業内容"],
  strengths: ["強み"],
  idealCandidate: ["求める人物像"],
  impressions: [],
  concerns: ["気になった点"],
  questions: ["次に聞きたい質問"],
  esPoints: [],
  nextResearch: ["追加調査"],
};

describe("toMarkdown", () => {
  it("renders separated sections and 要確認 fallback deterministically", () => {
    const first = toMarkdown(memo, {
      ocrText: "元メモ",
      imageFileNames: ["note.webp"],
    });
    const second = toMarkdown(memo, {
      ocrText: "元メモ",
      imageFileNames: ["note.webp"],
    });

    expect(first).toBe(second);
    expect(first).toContain("## 説明会で得た事実\n- 説明会で得た事実");
    expect(first).toContain("## HR・社員が強調していた点\n- HR が強調した点");
    expect(first).toContain("## 自分の印象・感じたこと\n- 要確認");
    expect(first).toContain("## ES・面接で使えそうな材料\n- 要確認");
    expect(first).toContain("- メモ元画像: note.webp");
    expect(first).toContain("```text\n元メモ\n```");
  });
});
