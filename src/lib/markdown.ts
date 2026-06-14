import type { BriefingNote } from "./types";

export {
  EMPTY_COMPANY_EVENT_INFO,
  type CompanyEventInfo,
} from "./types";

export interface MarkdownTemplateInput {
  companyName?: string;
  eventName?: string;
  eventDate?: string;
  imageFileName?: string;
  ocrText?: string;
}

export type MarkdownTemplateBriefingNoteInput = Pick<
  BriefingNote,
  "companyEventInfo" | "ocrText" | "imageFileName"
>;

function orPending(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? "要確認" : trimmed;
}

// 本文に ``` が含まれてもコードフェンスが途中で閉じないよう、
// 本文中の最長のバッククォート連続より長いフェンスを選ぶ
function fenceFor(text: string): string {
  let longestRun = 0;
  for (const run of text.match(/`+/g) ?? []) {
    longestRun = Math.max(longestRun, run.length);
  }
  return "`".repeat(Math.max(3, longestRun + 1));
}

// docs/output-format.md の基本テンプレートに沿った初期 Markdown を組み立てる。
// LLM 相当の内容生成は行わず、未読取セクションはユーザー編集用の雛形として残す。
export function buildMarkdownTemplate(
  input: MarkdownTemplateInput = {},
): string {
  const companyName = orPending(input.companyName);
  const imageFileName = input.imageFileName?.trim() || "不明";
  const ocrExcerpt = input.ocrText?.trim() || "(OCR 結果なし)";
  const fence = fenceFor(ocrExcerpt);

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
- Post-MVP で追加する場合は、出典 URL と取得日を必ず残す

## 元メモからの抜粋
${fence}text
${ocrExcerpt}
${fence}
`;
}

export function buildMarkdownTemplateFromBriefingNote(
  note: MarkdownTemplateBriefingNoteInput,
): string {
  return buildMarkdownTemplate({
    companyName: note.companyEventInfo.companyName,
    eventName: note.companyEventInfo.eventName,
    eventDate: note.companyEventInfo.eventDate,
    imageFileName: note.imageFileName,
    ocrText: note.ocrText,
  });
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
  let codeFenceLength = 0;

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
      // 開始フェンスと同じ長さ以上のフェンスだけを終了とみなす
      // (コードブロック内に短い ``` が含まれても閉じない)
      const closeMatch = /^(`{3,})\s*$/.exec(line.trim());
      if (closeMatch && closeMatch[1].length >= codeFenceLength) {
        blocks.push({ type: "code", text: codeLines.join("\n") });
        codeLines = null;
      } else {
        codeLines.push(line);
      }
      continue;
    }

    const trimmed = line.trim();
    const fenceMatch = /^(`{3,})/.exec(trimmed);
    if (fenceMatch) {
      flushList();
      flushParagraph();
      codeLines = [];
      codeFenceLength = fenceMatch[1].length;
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
