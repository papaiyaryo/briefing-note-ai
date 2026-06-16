# Issue #28 設計: UI コンポーネントの基本テストを追加する

対象 GitHub Issue: #28(`docs/generated-issues/05-02-ui-コンポーネントの基本テストを追加する.md`)
Phase: 5 / 優先度: Medium / 実装順: **2 番目**
依存: Phase 3 UI、#01-05(Vitest 基盤)、#27(Markdown 生成ロジックのテスト)

## Issue 概要

MVP の主要 UI(アップロード / OCR 結果表示 / Markdown 編集)が、最低限の操作で壊れていないことを
レンダリングテストで確認する。現時点ではコンポーネントのテストが 1 件も存在しないため、
**テスト環境の新規導入**から行う必要がある。

## 現状確認

- `src/components/` には `UploadStep` / `OcrReviewStep` / `MarkdownEditStep` / `BriefingNoteFlow` /
  `StepIndicator` / `Button` / `ErrorNotice` / `MarkdownPreview` が存在するが、対応するテストはない。
- `package.json` の devDependencies に `@testing-library/react` / `jsdom` は含まれていない
  (`jsdom` は `vitest` の peerDependency としてのみ存在し、インストールはされていない)。
- `vitest.config.ts` が存在せず、Vitest はデフォルト設定(`environment: "node"`)で動作している。

## スコープ

- アップロード UI(`UploadStep`)の表示テストを追加する。
- OCR 結果表示(`OcrReviewStep`)のテストを追加する。
- Markdown 編集 UI(`MarkdownEditStep`)の基本テストを追加する。

## スコープ外

- 詳細なビジュアルリグレッション(スナップショット / 画像比較)。
- 外部 API を使うテスト(ダミー OCR 自体は Phase 4 でテスト済みのため対象外)。
- `BriefingNoteFlow` 全体の統合テスト(ステップ遷移は手動確認に委ねる。必要なら別 Issue で検討)。
- ドラッグ&ドロップの実イベント検証(jsdom の制約が大きいため、クリックでのファイル選択のみ対象とする)。

## 共有設計判断(Phase 5 計画より)

- テスト環境として `jsdom` を採用し、`vitest.config.ts` で `test.environment: "jsdom"` を設定する。
- 既存のロジック系テスト(`tests/markdown.test.ts` 等)は DOM に依存しないため、jsdom 環境に統一しても
  回帰しないことを確認する(環境ファイルを分けない)。
- アサーションは `@testing-library/react` の `render` / `screen` / `fireEvent`(または `userEvent`)を使う。
- テストファイルは既存規約に揃えて `tests/` 配下にフラットに置く(例: `tests/uploadStep.test.tsx`)。

## 実装ステップ

1. devDependencies を追加する。

   ```bash
   npm install -D @testing-library/react @testing-library/jest-dom jsdom
   ```

   - `@testing-library/user-event` は必要になった時点で追加を検討する(クリック程度なら `fireEvent` で足りる可能性が高い)。
2. `vitest.config.ts` を新規作成する。

   ```ts
   import { defineConfig } from "vitest/config";

   export default defineConfig({
     test: {
       environment: "jsdom",
       globals: false, // 既存テストは import { describe, it, expect } を明示しているため true にしない
     },
   });
   ```

   - `globals: false` を既存方針に合わせる(`tests/markdown.test.ts` 等は `vitest` からの明示 import を使っている)。
3. `tests/uploadStep.test.tsx` を新規作成する。
   - 見出し「メモ画像をアップロード」が表示される。
   - 画像未選択時は「ファイルを選択」ボタンと対応形式の説明が表示される。
   - 「OCR を実行する」ボタンは `selectedImage` が無いとき disabled になる。
   - 企業名入力欄に入力すると `onChangeCompanyEventInfo` が呼ばれる。
4. `tests/ocrReviewStep.test.tsx` を新規作成する。
   - 見出し「OCR 結果を確認」が表示される。
   - `hasOcrError` が true のとき `ErrorNotice` のメッセージが表示される。
   - OCR テキストが空のとき「OCR 結果が空です。」の案内が表示され、「Markdown を生成する」ボタンが disabled になる。
   - OCR テキストがあるとき「Markdown を生成する」ボタンが有効になり、クリックで `onNext` が呼ばれる。
5. `tests/markdownEditStep.test.tsx` を新規作成する。
   - 見出し「Markdown を編集してダウンロード」が表示される。
   - `markdownText` が空のとき「内容が空のためダウンロードできません。」の案内が表示され、
     ダウンロードボタンが disabled になる。
   - `markdownText` があるときダウンロードボタンが有効になる
     (`downloadMarkdownFile` の実呼び出しは jsdom 内の Blob/URL API 依存のため、
     クリックでエラーにならないことの確認に留め、ダウンロード自体の検証は #04-04 のロジックテストに委ねる)。
   - `hasGenerationError` が true のとき `ErrorNotice` のメッセージが表示される。
6. 追加後、`npm test` で既存テスト(`tests/markdown.test.ts` 等)を含めて全て通ることを確認する
   (jsdom 化による既存テストの回帰がないか必ず確認する)。

## 変更が想定されるファイル

- `package.json` / `package-lock.json`(devDependencies 追加)
- `vitest.config.ts`(新規)
- `tests/uploadStep.test.tsx`(新規)
- `tests/ocrReviewStep.test.tsx`(新規)
- `tests/markdownEditStep.test.tsx`(新規)

## テスト方針

- レンダリング結果に主要な見出し・ボタン・案内文が存在することを確認する(`screen.getByText` / `getByRole`)。
- 主要なボタンの有効・無効状態が props(`selectedImage` / `ocrText` / `markdownText` / `isOcrRunning` 等)に
  応じて切り替わることを確認する。
- コールバック props(`onNext` / `onChangeCompanyEventInfo` 等)がクリック・入力で呼ばれることを確認する。
- 外部 API・ネットワーク・実際のファイルダウンロードは検証しない(jsdom の制約と Issue の Out of Scope に従う)。

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 主要コンポーネントのレンダリングテストがある | `tests/uploadStep.test.tsx` / `tests/ocrReviewStep.test.tsx` / `tests/markdownEditStep.test.tsx` |
| 重要なボタンや入力欄が確認されている | 各テストでボタンの有効/無効、入力欄の `onChange` 呼び出しを確認 |
| `npm test` で安定して通る | jsdom 環境導入後に既存テストを含めて確認 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## リスク / 不明点

- **jsdom 化による既存テストへの影響**: `tests/markdown.test.ts` など既存のロジックテストは
  DOM を使わないため通常は影響しないはずだが、`npm test` 実行で必ず確認する。
- **`URL.createObjectURL` / `Blob` の jsdom 対応**: `UploadStep` は画像選択時に
  `URL.createObjectURL` を呼ぶ。jsdom でこの API が未実装の場合、テストでファイル選択を
  伴うケースだけ failure になる可能性がある。発生した場合は `vi.stubGlobal` 等でモックする。
- **依存追加によるインストール時間/CI 影響**: 軽量な `@testing-library/react` + `jsdom` のみを追加し、
  `user-event` 等の追加は本当に必要になるまで見送る。
