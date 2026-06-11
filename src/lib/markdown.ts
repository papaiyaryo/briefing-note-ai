export interface MarkdownTemplateInput {
  companyName?: string;
  eventName?: string;
  eventDate?: string;
  imageFileName?: string;
  ocrText?: string;
}

function orPending(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? "要確認" : trimmed;
}

// docs/output-format.md の基本テンプレートに沿った初期 Markdown を組み立てる。
// 実際の LLM 生成は Phase 4 で接続し、ここでは編集の土台になる構造だけを返す。
export function buildMarkdownTemplate(
  input: MarkdownTemplateInput = {},
): string {
  const companyName = orPending(input.companyName);
  const imageFileName = input.imageFileName?.trim() || "不明";
  const ocrExcerpt = input.ocrText?.trim() || "(OCR 結果なし)";

  return `# ${companyName}

## 説明会概要
- 企業名: ${companyName}
- イベント名: ${orPending(input.eventName)}
- 日時: ${orPending(input.eventDate)}
- 登壇者: 要確認
- メモ元画像: ${imageFileName}

## 説明会で得た事実
- (説明会メモから確認できる事実を書く)

## HR・社員が強調していた点
- (HR または社員が強調していた内容を書く)

## 事業内容
- (説明会メモに基づく事業内容を書く)

## 強み・特徴
- (説明会メモに基づく強みや特徴を書く)

## 求める人物像
- (説明会で言及された人物像を書く)

## 自分の印象・感じたこと
- (自分の印象を書く)

## 気になった点
- (気になった点、違和感、確認したい懸念を書く)

## 次に聞きたい質問
- (説明会後や面接で聞きたい質問を書く)

## ES・面接で使えそうな材料
- (志望理由、自己PR、逆質問などに使えそうな材料を書く)

## 次に調べること
- (追加で調べるべきことを書く)

## Web 補足情報
- MVP では未使用

## 元メモからの抜粋
\`\`\`text
${ocrExcerpt}
\`\`\`
`;
}

export type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; text: string }
  | { type: "paragraph"; text: string };

// プレビュー用の簡易パーサー。見出し・箇条書き・コードブロック・段落のみ扱う。
export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let listItems: string[] | null = null;
  let paragraphLines: string[] | null = null;
  let codeLines: string[] | null = null;

  const flushList = () => {
    if (listItems) {
      blocks.push({ type: "list", items: listItems });
      listItems = null;
    }
  };
  const flushParagraph = () => {
    if (paragraphLines) {
      blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
      paragraphLines = null;
    }
  };

  for (const line of markdown.split("\n")) {
    if (codeLines) {
      if (line.trim().startsWith("```")) {
        blocks.push({ type: "code", text: codeLines.join("\n") });
        codeLines = null;
      } else {
        codeLines.push(line);
      }
      continue;
    }

    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      flushList();
      flushParagraph();
      codeLines = [];
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      flushList();
      flushParagraph();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      continue;
    }

    const listMatch = /^[-*]\s+(.*)$/.exec(trimmed);
    if (listMatch) {
      flushParagraph();
      listItems = listItems ?? [];
      listItems.push(listMatch[1]);
      continue;
    }

    if (trimmed === "") {
      flushList();
      flushParagraph();
      continue;
    }

    flushList();
    paragraphLines = paragraphLines ?? [];
    paragraphLines.push(trimmed);
  }

  if (codeLines) {
    blocks.push({ type: "code", text: codeLines.join("\n") });
  }
  flushList();
  flushParagraph();

  return blocks;
}
