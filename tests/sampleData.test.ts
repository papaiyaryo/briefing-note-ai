import { describe, expect, it } from "vitest";

import {
  DEMO_BRIEFING_NOTE,
  DEMO_MARKDOWN_SAMPLE,
  DEMO_OCR_TEXT,
} from "../src/lib/sampleData";

describe("demo sample data", () => {
  it("provides OCR text for the dummy OCR flow", () => {
    expect(DEMO_OCR_TEXT).toContain("青葉フューチャーリンク株式会社");
    expect(DEMO_OCR_TEXT).toContain("HR 強調");
    expect(DEMO_OCR_TEXT).toContain("自分の印象");
  });

  it("uses fictional and non-personal demo inputs", () => {
    expect(DEMO_BRIEFING_NOTE.companyEventInfo.companyName).toBe(
      "青葉フューチャーリンク株式会社",
    );
    expect(DEMO_OCR_TEXT).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    expect(DEMO_OCR_TEXT).not.toMatch(/\d{2,4}-\d{2,4}-\d{3,4}/);
    expect(DEMO_OCR_TEXT).not.toMatch(/(東京都|大阪府|応募ID|学生番号)/);
  });

  it("provides a generated markdown sample aligned with the template", () => {
    expect(DEMO_MARKDOWN_SAMPLE).toContain("# 青葉フューチャーリンク株式会社");
    expect(DEMO_MARKDOWN_SAMPLE).toContain("## Web 補足情報");
    expect(DEMO_MARKDOWN_SAMPLE).toContain("- MVP では未使用");
    expect(DEMO_MARKDOWN_SAMPLE).toContain("## 元メモからの抜粋");
    expect(DEMO_MARKDOWN_SAMPLE).toContain(DEMO_OCR_TEXT);
  });
});
