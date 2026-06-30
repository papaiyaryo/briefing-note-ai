import { describe, expect, it } from "vitest";

import {
  buildMarkdownTemplateFromBriefingNote,
  buildMarkdownTemplate,
  parseMarkdownBlocks,
  type MarkdownBlock,
} from "../src/lib/markdown";
import type { BriefingNote } from "../src/lib/types";

function codeBlocksOf(markdown: string) {
  return parseMarkdownBlocks(markdown).filter(
    (block): block is Extract<MarkdownBlock, { type: "code" }> =>
      block.type === "code",
  );
}

const outputFormatSections = [
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
] as const;

const overviewLabels = [
  "- 企業名:",
  "- イベント名:",
  "- 日時:",
  "- 登壇者:",
  "- メモ元画像:",
] as const;

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
      imageFileNames: ["memo.png"],
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
    const markdown = buildMarkdownTemplate({
      companyName: "  ",
      eventName: "\n\t",
      eventDate: " ",
      imageFileNames: ["   "],
      ocrText: "\n  ",
    });
    expect(markdown).toContain("# 要確認");
    expect(markdown).toContain("- 企業名: 要確認");
    expect(markdown).toContain("- イベント名: 要確認");
    expect(markdown).toContain("- 日時: 要確認");
    expect(markdown).toContain("- メモ元画像: 不明");
    expect(markdown).toContain("(OCR 結果なし)");
  });

  it("does not infer unknown company facts from partial OCR text", () => {
    const markdown = buildMarkdownTemplate({
      companyName: "メモ株式会社",
      ocrText: "クラウド\n社員の雰囲気がよい\n挑戦",
    });

    expect(markdown).toContain("- 登壇者: 要確認");
    expect(markdown).toContain("- (説明会メモに基づく事業内容を書く)");
    expect(markdown).toContain("- (説明会で言及された人物像を書く)");
    expect(markdown).toContain("クラウド\n社員の雰囲気がよい\n挑戦");
    expect(markdown).not.toContain("クラウド事業");
    expect(markdown).not.toContain("挑戦できる人材");
  });

  it("uses a longer fence when the OCR text contains backtick fences", () => {
    const markdown = buildMarkdownTemplate({
      ocrText: "before\n```\ninside\n```\nafter",
    });
    expect(markdown).toContain("````text");
    const codeBlocks = codeBlocksOf(markdown);
    expect(codeBlocks).toHaveLength(1);
    expect(codeBlocks[0].text).toContain("inside");
    expect(codeBlocks[0].text).toContain("after");
  });

  it("contains the sections defined in docs/output-format.md", () => {
    const markdown = buildMarkdownTemplate();
    for (const section of outputFormatSections) {
      expect(markdown).toContain(`\n${section}\n`);
    }
  });

  it("keeps output-format sections in the documented order", () => {
    const markdown = buildMarkdownTemplate();

    const sectionPositions = outputFormatSections.map((section) =>
      markdown.indexOf(section),
    );

    expect(sectionPositions).not.toContain(-1);
    expect(sectionPositions).toEqual(
      [...sectionPositions].sort((a, b) => a - b),
    );
  });

  it("keeps overview labels aligned with docs/output-format.md", () => {
    const markdown = buildMarkdownTemplate();
    const overview = markdown.slice(
      markdown.indexOf("## 説明会概要"),
      markdown.indexOf("## 説明会で得た事実"),
    );

    for (const label of overviewLabels) {
      expect(overview).toContain(label);
    }

    const labelPositions = overviewLabels.map((label) =>
      overview.indexOf(label),
    );
    expect(labelPositions).not.toContain(-1);
    expect(labelPositions).toEqual([...labelPositions].sort((a, b) => a - b));
  });

  it("includes the MVP web supplement placeholder from docs/output-format.md", () => {
    const markdown = buildMarkdownTemplate();
    expect(markdown).toContain("- MVP では未使用");
    expect(markdown).toContain(
      "- Post-MVP で追加する場合は、出典 URL と取得日を必ず残す",
    );
  });

  it("builds from the BriefingNote aggregate subset", () => {
    const note: BriefingNote = {
      companyEventInfo: {
        companyName: "架空テック株式会社",
        eventName: "会社説明会",
        eventDate: "2026-06-14",
      },
      imageFileNames: ["briefing-note.webp"],
      ocrText: "HR強調: 顧客課題から考える",
      markdown: "ignored existing markdown",
    };

    const markdown = buildMarkdownTemplateFromBriefingNote(note);

    expect(markdown).toContain("# 架空テック株式会社");
    expect(markdown).toContain("- イベント名: 会社説明会");
    expect(markdown).toContain("- 日時: 2026-06-14");
    expect(markdown).toContain("- メモ元画像: briefing-note.webp");
    expect(markdown).toContain("HR強調: 顧客課題から考える");
    expect(markdown).not.toContain("ignored existing markdown");
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

  it("closes a code block only with a fence at least as long as the opener", () => {
    expect(parseMarkdownBlocks("````text\n```\ncode\n````")).toEqual([
      { type: "code", text: "```\ncode" },
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
