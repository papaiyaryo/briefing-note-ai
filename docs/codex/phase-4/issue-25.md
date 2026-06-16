# Issue #25 設計: .md ダウンロード機能とファイル名生成を実装する

対象 GitHub Issue: #25(`docs/generated-issues/04-04-md-ダウンロード機能とファイル名生成を実装する.md`)
Phase: 4 / 優先度: High / 実装順: **5 番目(最終)**
依存: #03-05(Markdown 編集 UI)、#23(生成ロジック)

## Issue 概要

編集済み Markdown を、ブラウザからローカルの `.md` ファイルとして保存できるようにする。
企業名ベース・日時ベースのファイル名生成と、OS で問題になる文字の sanitize を実装する。
Phase 3 で配置済み(`disabled`)のダウンロードボタンを有効化する。

## スコープ

- Markdown 文字列から `Blob` を作りブラウザダウンロードを実行する処理を実装する。
- 企業名または日時ベースのファイル名を生成する純粋関数を実装する。
- ファイル名 sanitize(OS で問題になる文字の除去)を実装する。

## スコープ外

- Google Drive 保存、サーバー側保存(Phase 7 / Post-MVP)。

## 共有設計判断(Phase 計画より)

- 配置は `src/lib/download.ts`(新規)。
- **ファイル名生成 `buildMarkdownFileName` は純粋関数**(テスト可能)。
- **ダウンロード実行 `downloadMarkdown` のみ DOM/ブラウザ API 依存**(Blob + a 要素 + `URL.createObjectURL`)。
- 生成した object URL は `URL.revokeObjectURL` で必ず解放する。

## 実装ステップ

1. `src/lib/download.ts` を新規作成する。

   ```ts
   // OS で問題になる文字と制御文字を除去し、前後の空白・ドットを整える。
   // sanitize 後に空になったら null を返し、呼び出し側で日時フォールバックする。
   export function sanitizeFileNameBase(name: string): string | null;

   // 企業名があれば "<企業名>.md"、なければ "briefing-note-<YYYYMMDD-HHmm>.md"。
   // 第2引数 now は省略時 new Date()(テストで固定するため注入可能にする)。
   export function buildMarkdownFileName(
     companyName: string | undefined,
     now?: Date,
   ): string;

   // Blob を作り、一時 a 要素でダウンロードさせ、object URL を解放する。
   export function downloadMarkdown(markdown: string, fileName: string): void;
   ```

   - sanitize 対象: `\ / : * ? " < > |` と制御文字、先頭末尾の空白・ドット。
   - 日時フォーマットはローカル時刻で `YYYYMMDD-HHmm` のような安全な形にする。
   - MIME は `text/markdown;charset=utf-8`。
2. `MarkdownEditStep.tsx` のダウンロードボタンを有効化する。
   - 現在は常時 `disabled`。**Markdown が空のときのみ無効**、内容があれば有効にする
     (既存の `isMarkdownEmpty` 表示と整合)。
   - クリックで `downloadMarkdown(markdownText, buildMarkdownFileName(companyName))` を呼ぶ。
   - 企業名は `BriefingNoteFlow` の `companyEventInfo.companyName` を `MarkdownEditStep` に props で渡す
     (現状 props にないため追加する)。
3. `src/lib/download.test.ts` でファイル名生成・sanitize の単体テストを追加する(後述)。

## 変更が想定されるファイル

- `src/lib/download.ts`(新規)
- `src/lib/download.test.ts`(新規)
- `src/components/steps/MarkdownEditStep.tsx`(ボタン有効化 + 企業名 props 追加 + onClick 接続)
- `src/components/BriefingNoteFlow.tsx`(`companyName` を `MarkdownEditStep` に渡す)

## テスト方針(純粋関数のみ。DOM 依存はテストしない)

- 企業名あり → `<企業名>.md`。
- 企業名なし/空白のみ → `briefing-note-<日時>.md`(固定 `now` で検証)。
- 企業名に `/ : *` 等を含む → 除去された安全な名前になる。
- sanitize 後に空になる企業名(記号のみ)→ 日時フォールバックする。

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 編集後の Markdown が .md としてダウンロードできる | `downloadMarkdown` + ボタン有効化 |
| 企業名がある場合はファイル名に反映される | `buildMarkdownFileName(companyName)` |
| 企業名がない場合は日時ベースで安全なファイル名になる | フォールバック + sanitize |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

加えて手動でダウンロードを実行し、ファイル名と中身(編集後テキスト)を確認する。

## リスク / 不明点

- object URL の解放漏れによるメモリリーク → `downloadMarkdown` 内で必ず `revokeObjectURL`。
- 日本語企業名がファイル名に使えるか OS 依存 → 日本語自体は許容し、禁止文字のみ除去する方針(全置換しない)。
- テストは純粋関数に限定し、ブラウザ DOM 操作部分は手動確認に委ねる(jsdom 依存を増やさない)。
