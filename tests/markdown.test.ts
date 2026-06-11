import { describe, expect, it } from "vitest";

import { buildMarkdownTemplate, parseMarkdownBlocks } from "../src/lib/markdown";

describe("buildMarkdownTemplate", () => {
  it("uses 要確認 defaults when no input is given", () => {
    const markdown = buildMarkdownTemplate();
    expect(markdown).toContain("# 要確認");
    expect(markdown).toContain("- 企業名: 要確認");
    expect(markdown).toContain("- イベント名: 要確認");
    expect(markdown).toContain("- メモ元画像: 不明");
    expect(markdown).toContain("(OCR 結果なし)");
  });

  it("fills in company, event, image, and OCR excerpt", () => {
    const markdown = buildMarkdownTemplate({
      companyName: "サンプル株式会社",
      eventName: "夏季説明会",
      eventDate: "2026-06-01",
      imageFileName: "memo.png",
      ocrText: "事業内容: ITサービス",
    });
    expect(markdown).toContain("# サンプル株式会社");
    expect(markdown).toContain("- 企業名: サンプル株式会社");
    expect(markdown).toContain("- イベント名: 夏季説明会");
    expect(markdown).toContain("- 日時: 2026-06-01");
    expect(markdown).toContain("- メモ元画像: memo.png");
    expect(markdown).toContain("事業内容: ITサービス");
  });

  it("treats whitespace-only input as missing", () => {
    const markdown = buildMarkdownTemplate({ companyName: "  " });
    expect(markdown).toContain("# 要確認");
  });

  it("contains the sections defined in docs/output-format.md", () => {
    const markdown = buildMarkdownTemplate();
    for (const section of [
      "## 説明会概要",
      "## 説明会で得た事実",
      "## HR・社員が強調していた点",
      "## 事業内容",
      "## 強み・特徴",
      "## 求める人物像",
      "## 自分の印象・感じたこと",
      "## 気になった点",
      "## 次に聞きたい質問",
      "## ES・面接で使えそうな材料",
      "## 次に調べること",
      "## Web 補足情報",
      "## 元メモからの抜粋",
    ]) {
      expect(markdown).toContain(`\n${section}\n`);
    }
  });
});

describe("parseMarkdownBlocks", () => {
  it("parses headings with their level", () => {
    expect(parseMarkdownBlocks("# Title\n## Section")).toEqual([
      { type: "heading", level: 1, text: "Title" },
      { type: "heading", level: 2, text: "Section" },
    ]);
  });

  it("groups consecutive list items into one list", () => {
    expect(parseMarkdownBlocks("- a\n- b\n\n- c")).toEqual([
      { type: "list", items: ["a", "b"] },
      { type: "list", items: ["c"] },
    ]);
  });

  it("parses fenced code blocks", () => {
    expect(parseMarkdownBlocks("```text\nline1\nline2\n```")).toEqual([
      { type: "code", text: "line1\nline2" },
    ]);
  });

  it("keeps an unclosed code block instead of dropping it", () => {
    expect(parseMarkdownBlocks("```\nline1")).toEqual([
      { type: "code", text: "line1" },
    ]);
  });

  it("joins consecutive plain lines into a paragraph", () => {
    expect(parseMarkdownBlocks("line1\nline2\n\nline3")).toEqual([
      { type: "paragraph", text: "line1\nline2" },
      { type: "paragraph", text: "line3" },
    ]);
  });

  it("returns no blocks for empty input", () => {
    expect(parseMarkdownBlocks("")).toEqual([]);
  });
});
