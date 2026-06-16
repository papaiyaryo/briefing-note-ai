# Issue #28 設計: UI コンポーネントの基本テストを追加する

対象 GitHub Issue: #28(`docs/generated-issues/05-02-ui-コンポーネントの基本テストを追加する.md`)
Phase: 5 / 優先度: Medium / 実装順: **2 番目**

## Issue 概要

MVP の主要 UI(アップロード、OCR 結果表示、Markdown 編集)が最低限の操作で壊れていないことを
確認する。現時点で `@testing-library/react` 等は未導入のため、本 Issue でテスト基盤を導入し、
3 つのステップコンポーネントに基本テストを追加する。

## スコープ

- devDependencies を追加する: `@testing-library/react`, `@testing-library/jest-dom`,
  `@testing-library/user-event`, `jsdom`
- `tests/components/UploadStep.test.tsx` を新規作成する
- `tests/components/OcrReviewStep.test.tsx` を新規作成する
- `tests/components/MarkdownEditStep.test.tsx` を新規作成する
- 各テストは「主要な見出し・入力欄・ボタンが表示される」「基本操作で props の callback が呼ばれる」
  ことを確認する

## スコープ外

- 詳細なビジュアルリグレッションテスト
- 外部 API を使うテスト
- `BriefingNoteFlow.tsx` 自体の統合テスト(`window.setTimeout` による擬似遅延を内部に持つため、
  タイマーを含む統合テストは本 Issue では行わない)
- `MarkdownPreview` のレンダリング結果(Markdown → HTML 変換の詳細)の網羅的テスト
  (本 Issue では「タブ切り替えで表示領域が切り替わること」までを確認すれば十分)

## 共有設計判断(Phase 計画より)

- `vitest.config.ts` は追加しない。各テストファイルの先頭に `// @vitest-environment jsdom`
  プラグマを付け、ファイル単位で jsdom 環境に切り替える。
- jest-dom の matcher 拡張は、各テストファイルで
  `import "@testing-library/jest-dom/vitest";` を直接 import して有効化する(グローバル
  `setupFiles` は導入しない)。
- テスト対象はステップコンポーネント単体。親の state 管理には依存せず、props はすべて
  `vi.fn()` などのモックで渡す。
- `URL.createObjectURL` / `URL.revokeObjectURL` は jsdom 未実装のため、`UploadStep` の
  テストでは最小限のスタブを用意する(例: `vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:mock"), revokeObjectURL: vi.fn() })`)。

## 実装ステップ

1. 依存追加:

   ```bash
   npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. `tests/components/UploadStep.test.tsx` を作成する。確認内容の例:
   - 見出し「メモ画像をアップロード」と、企業名・イベント名・説明会日の入力欄が表示される
   - 画像未選択時は「OCR を実行する」ボタンが `disabled` である
   - `URL.createObjectURL` をスタブした上で、`userEvent.upload` によるファイル選択後に
     `onSelectImage` が呼ばれる
   - 企業名入力欄への入力で `onChangeCompanyEventInfo` が呼ばれる
3. `tests/components/OcrReviewStep.test.tsx` を作成する。確認内容の例:
   - OCR 結果が空のとき「Markdown を生成する」ボタンが `disabled` である
   - `hasOcrError` が真のとき、エラーメッセージ(`ErrorNotice`)が表示される
   - テキストエリアへの入力で `onChangeOcrText` が呼ばれる
   - 「アップロードに戻る」クリックで `onBack` が呼ばれる
4. `tests/components/MarkdownEditStep.test.tsx` を作成する。確認内容の例:
   - Markdown が空のとき「.md をダウンロード」ボタンが `disabled` である
   - `hasGenerationError` が真のとき、エラーメッセージが表示される
   - 狭い画面用の「編集」「プレビュー」タブ切り替えで表示領域が切り替わる
   - テキストエリアへの入力で `onChangeMarkdownText` が呼ばれる
5. `npm test` を実行し、既存の node 環境テストと新規の jsdom 環境テストの両方が通ることを
   確認する。

## 変更が想定されるファイル

- `package.json` / `package-lock.json`(devDependencies 追加)
- `tests/components/UploadStep.test.tsx`(新規)
- `tests/components/OcrReviewStep.test.tsx`(新規)
- `tests/components/MarkdownEditStep.test.tsx`(新規)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 主要コンポーネントのレンダリングテストがある | 3 つの `tests/components/*.test.tsx` |
| 重要なボタンや入力欄が確認されている | 各テストの disabled / 表示確認ケース |
| `npm test` で安定して通る | jsdom プラグマ + 最小限のブラウザ API スタブで安定実行 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## リスク / 不明点

- **jsdom 未対応 API**: `URL.createObjectURL` 以外にも、実装中に未対応 API が見つかる場合がある。
  その場合も対象コンポーネントが実際に呼ぶ範囲だけを最小限スタブし、テストの目的(レンダリングと
  基本操作の確認)から外れた網羅的なブラウザ API モックは行わない。
- **lockfile 整合性**: devDependencies 追加に伴い `package-lock.json` が更新される。CI の
  `npm ci` が通ることを確認してからコミットする。
- **テストの肥大化**: 3 ファイル・基本ケースの範囲に留め、Issue #28 の Out of Scope
  (ビジュアルリグレッション等)に踏み込まない。
