# Issue #28 設計: UI コンポーネントの基本テストを追加する

対象 GitHub Issue: #28(`docs/generated-issues/05-02-ui-コンポーネントの基本テストを追加する.md`)
Phase: 5 / 優先度: Medium / 実装順: **2 番目**
依存: Phase 3 UI(#16-#21)、#27(同 Phase の Markdown ロジックテストと方針を揃える)

## Issue 概要

MVP の主要 UI(アップロード / OCR 結果表示 / Markdown 編集)が、最低限の操作で壊れていないことを
レンダリングテストで保証する。現時点でリポジトリに UI のレンダリングテストは存在せず、
**テスト基盤(jsdom + Testing Library)を新規に追加する**ところから始める Issue である。

## スコープ

- アップロード UI の表示テストを追加する → `src/components/steps/UploadStep.tsx`
- OCR 結果表示のテストを追加する → `src/components/steps/OcrReviewStep.tsx`
- Markdown 編集 UI の基本テストを追加する → `src/components/steps/MarkdownEditStep.tsx`

## スコープ外

- 詳細なビジュアルリグレッション(スナップショット/画像比較)
- 外部 API を使うテスト
- `BriefingNoteFlow`(オーケストレーター)全体の統合テスト・`setTimeout` を含む状態遷移の検証
  (Step コンポーネントは props 駆動のため、単体テストで十分に基本機能を確認できる。
  統合テストは将来 #29 の E2E 方針整理で扱うかどうかを検討する)
- `Button` / `ErrorNotice` / `MarkdownPreview` / `StepIndicator` の専用テストファイル追加
  (これらは Step コンポーネントのテストの中で間接的に検証される。Acceptance Criteria が
  求める「主要コンポーネント」は Issue 本文が明示する 3 つの Step に限定する)

## 現状確認

- `package.json` の devDependencies に `vitest` はあるが、`jsdom` も
  `@testing-library/*` も未導入。`vitest.config.ts` も存在せず、Vitest はデフォルトの
  `node` environment で動いている。
- 既存テスト(`tests/*.test.ts`)はすべて `src/lib/` の純粋関数テストで、DOM 非依存。
- 対象の 3 コンポーネントはすべて `"use client"` 配下ではないが React の関数コンポーネントで、
  状態を持たず props とコールバックのみで駆動される「dumb component」。
  そのため `render` + `fireEvent`/`userEvent` で十分にテストできる。

## 共有設計判断(Phase 計画より、本 Issue 内の適用)

- テスト環境: `vitest.config.ts` を新規作成し `test.environment: "jsdom"` を設定する。
- 追加 devDependencies: `jsdom`, `@testing-library/react`, `@testing-library/dom`,
  `@testing-library/user-event`(React 19 対応バージョンを選定)。
- `tests/setup.ts` を新規作成し、`@testing-library/react` の `cleanup` を `afterEach` で
  登録、`vitest.config.ts` の `test.setupFiles` に登録する。
- テストファイルは `tests/` 直下に `.test.tsx` で配置し、既存の命名規則
  (`upload.test.ts` 等)に合わせて対象コンポーネント名を使う。

## 実装ステップ

1. **テスト基盤の追加**
   - `npm install -D jsdom @testing-library/react @testing-library/dom @testing-library/user-event`
   - `vitest.config.ts` を新規作成:

     ```ts
     import { defineConfig } from "vitest/config";

     export default defineConfig({
       test: {
         environment: "jsdom",
         setupFiles: ["./tests/setup.ts"],
       },
     });
     ```

   - `tests/setup.ts` を新規作成:

     ```ts
     import { afterEach } from "vitest";
     import { cleanup } from "@testing-library/react";

     afterEach(() => {
       cleanup();
     });
     ```

2. **`tests/uploadStep.test.tsx`**(`UploadStep` 対象)
   - 見出し「メモ画像をアップロード」が表示される
   - 画像未選択時は「ファイルを選択」ボタンとドラッグ&ドロップの案内文が表示される
   - 画像選択済み(`selectedImage` あり)では、ファイル名とプレビュー `img`、
     「別の画像を選択」ボタンが表示される
   - 企業名・イベント名・説明会日の各入力欄が `getByLabelText` で取得でき、
     入力すると `onChangeCompanyEventInfo` が更新後の値で呼ばれる
   - 画像未選択のときは「OCR を実行する」「失敗状態を確認」ボタンが disabled になる
   - 画像選択済みのときはボタンが有効になり、クリックで `onNext` / `onSimulateOcrFailure` が呼ばれる
   - `isOcrRunning=true` のときは両ボタンが disabled になり、ボタン文言が
     「OCR を実行しています…」に変わる
   - 検証エラー時(モックの `validateImageFile` が失敗するケースを想定する場合)に
     `role="alert"` のエラー表示が出ること(※ファイル選択を経由するため、`input` への
     ファイル投入は jsdom 上の `FileList` 制約を踏まえ、`fireEvent.change` で
     `files` プロパティを直接定義する方法を使う。困難な場合はこのケースを見送り、
     後述のリスクに明記する)

3. **`tests/ocrReviewStep.test.tsx`**(`OcrReviewStep` 対象)
   - 見出し「OCR 結果を確認」が表示される
   - `ocrText` が渡されたとき、`textarea`(ラベル「OCR 結果」)にその値が表示される
   - `ocrText` が空のときは「OCR 結果が空です。」の案内文が表示され、
     「Markdown を生成する」ボタンが disabled になる
   - `hasOcrError=true` のとき `role="alert"` のエラーメッセージが表示される
     (`ocrErrorMessage` 指定時はその文言、未指定時はデフォルト文言)
   - `selectedImage` がある場合は `img`、ない場合は「画像が選択されていません」が表示される
   - `textarea` を編集すると `onChangeOcrText` が呼ばれる
   - 「アップロードに戻る」クリックで `onBack`、「OCR を再実行」クリックで `onRetryOcr`、
     「Markdown を生成する」クリックで `onNext` が呼ばれる
   - `isOcrRunning` / `isGeneratingMarkdown` が true のとき、操作系ボタンが disabled になり、
     ボタン文言が処理中表示に変わる

4. **`tests/markdownEditStep.test.tsx`**(`MarkdownEditStep` 対象)
   - 見出し「Markdown を編集してダウンロード」が表示される
   - `markdownText` がラベル「Markdown」の `textarea` に表示される
   - `markdownText` が空のときは案内文が表示され、「.md をダウンロード」ボタンが disabled になる
   - `markdownText` があるときはダウンロードボタンが有効になる
   - `textarea` を編集すると `onChangeMarkdownText` が呼ばれる
   - `hasGenerationError=true` のとき `role="alert"` のエラーメッセージが表示される
   - 「OCR 確認に戻る」クリックで `onBack` が呼ばれる
   - プレビュー側に `MarkdownPreview` 経由で見出し等が反映される(簡単な markdown を渡し、
     プレビュー領域にテキストが表示されることを確認する程度に留める。
     `parseMarkdownBlocks` 自体の網羅テストは既存の `tests/markdown.test.ts` の責務とする)
   - 実際のダウンロード処理(`downloadMarkdownFile` が呼ばれた後の Blob/URL 操作)は
     jsdom 環境での再現コストに対して得られる保証が小さいため検証しない
     (ボタンがクリック可能で disabled 制御が正しいことの確認に留める)

5. 4 つのテストファイルすべてで `npm test` がグリーンであることを確認する。

## 変更が想定されるファイル

- `package.json` / `package-lock.json`(devDependencies 追加)
- `vitest.config.ts`(新規)
- `tests/setup.ts`(新規)
- `tests/uploadStep.test.tsx`(新規)
- `tests/ocrReviewStep.test.tsx`(新規)
- `tests/markdownEditStep.test.tsx`(新規)

`src/components/` 配下の実装ファイルは変更しない(テスト容易性のために
不要なリファクタリングは行わない)。

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 主要コンポーネントのレンダリングテストがある | `UploadStep` / `OcrReviewStep` / `MarkdownEditStep` の 3 ファイルで見出し・主要要素の表示を確認 |
| 重要なボタンや入力欄が確認されている | 各ステップの主要ボタン(進む/戻る/再実行/ダウンロード)と入力欄(企業情報・OCR テキスト・Markdown)の表示・disabled・コールバック呼び出しを確認 |
| npm test で安定して通る | `setTimeout` や実ブラウザ API に依存する箇所はテスト対象から除外し、props 駆動の同期的な検証のみ行う |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## リスク / 不明点

- **テストライブラリのバージョン選定**: `@testing-library/react` は React 19 対応版
  (メジャーバージョンが React 19 をサポートするもの)を明示的に選ぶ必要がある。
  実装時に `npm info @testing-library/react peerDependencies` 等で確認すること。
- **`environment: "jsdom"` への変更が既存テストに影響しないか**: 既存の `tests/*.test.ts`
  は DOM 非依存のため影響しない想定だが、PR で `npm test` 全体を実行して確認する。
- **ファイル選択(`<input type="file">`)のテストの難易度**: jsdom は実ファイル I/O を
  サポートしないため、`FileList` を模したオブジェクトを `Object.defineProperty` で
  `input.files` に設定する手法が必要になる場合がある。コストが見積もりより高い場合は、
  「ファイル選択 UI の表示確認」までに留め、「選択後のバリデーションエラー表示」は
  本 Issue のスコープから外し、別途記録する。
- **`BriefingNoteFlow` 自体のテストの扱い**: 本 Issue では対象外としたが、
  Phase 5 全体としてオーケストレーターの統合テストを今後追加するかは、
  #29(E2E テスト方針整理)で検討する。
