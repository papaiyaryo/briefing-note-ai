# Issue #43 設計: Web 補足の確認 UI と Markdown 統合を実装する

対象 GitHub Issue: #43（`docs/generated-issues/08-03-web-補足の確認-ui-と-markdown-統合を実装する.md`）
Phase: 8 / 優先度: Low / 実装順: **3 番目**

依存: #42（`POST /api/web-supplement` と `webSupplementClient.ts` が完成していること）

## Issue 概要

#42 で実装した Web 補足 API を使い、**ユーザーが補足候補を確認・採否できる UI** を実装する。
採用した候補のみを `toMarkdown`（#41 実装済み）で変換し、Markdown 末尾の専用セクションに追記する。
紙メモ由来の Markdown セクションと Web 補足セクションは UI・データ両面で明確に分離する。

## スコープ

- `src/components/WebSupplementPanel.tsx` を新規作成する（補足候補リスト・採否 UI）。
- `src/components/steps/WebSupplementStep.tsx` を新規作成する（BriefingNoteFlow のステップとして組み込む）。
- `src/components/BriefingNoteFlow.tsx` にステップを追加する。
- `src/lib/flow.ts`（または状態管理）に Web 補足ステップの状態を追加する。
- 採用候補を `buildWebSupplementMarkdown`（#41）でセクション化し、既存 Markdown 末尾に追記する。

## スコープ外

- 自動一括採用（ユーザー確認なしの統合は禁止）。
- 企業比較機能（Phase 9）。
- Web 補足セクションを紙メモ由来セクションに混入させる変更。

## 共有設計判断（Phase 計画より）

- ユーザー確認なしに補足が本文へ混ざらない（自動統合禁止）。
- 出典 URL と取得日は採用後の Markdown にも残す。
- 信頼度または要確認表示を UI でも明確に表示する。
- UI では紙メモ由来情報と Web 補足を別パネルで扱い、混在しないようにする。

## 実装ステップ

### 1. `src/components/WebSupplementPanel.tsx` を新規作成する

補足候補を一覧表示し、各候補に採用 / 却下ボタンを持つパネル。

```tsx
import type { WebSupplementItem } from "@/lib/webSupplement/schema";

interface Props {
  companyName: string;
  items: WebSupplementItem[];
  approvedIds: Set<string>;
  onToggle: (id: string) => void;
}

// 各 WebSupplementItem の表示に含めること:
// - category（見出し）
// - content（本文）
// - confidence バッジ（high/medium/low を色で区別: green/yellow/red）
// - 要確認バッジ（needsVerification = true の場合に黄色バッジ表示）
// - 出典 URL（クリックで新規タブ）
// - 取得日
// - 採用 / 却下 トグルボタン（採用済みは青背景、未採用はグレー）
```

### 2. `src/components/steps/WebSupplementStep.tsx` を新規作成する

Web 補足ステップのコンテナ。

```tsx
// 責務:
// 1. コンポーネントマウント時または「補足情報を取得」ボタン押下時に
//    fetchWebSupplementFromApi(companyName) を呼ぶ
// 2. ローディング・エラー・空状態を表示する
// 3. WebSupplementPanel を表示して採否を管理する
// 4. 「採用した補足を追加して次へ」ボタンで親コンポーネントに通知する
//    - 引数: 採用済み WebSupplementItem[]
// 5. 「スキップ」ボタン（Web 補足を一切追加せずに次のステップへ進む）
```

### 3. `src/lib/flow.ts` の更新（または BriefingNoteFlow.tsx の状態更新）

ステップ順を以下に変更する。

```text
Step 1: UploadStep（画像アップロード）
Step 2: OcrReviewStep（OCR 確認）
Step 3: WebSupplementStep（Web 補足確認）← 新規
Step 4: MarkdownEditStep（Markdown 編集・プレビュー）
```

### 4. `src/components/BriefingNoteFlow.tsx` の更新

- `WebSupplementStep` を Step 3 として追加する。
- `approvedWebSupplementItems: WebSupplementItem[]` の状態を追加する。
- WebSupplementStep からの `onApprove(items: WebSupplementItem[])` コールバックで状態を更新する。
- Step 4（MarkdownEditStep）に進む前に `buildWebSupplementMarkdown(approvedItems)` を呼び、
  既存 Markdown 末尾に追記する。
  - 追記のタイミング: 「採用した補足を追加して次へ」ボタン押下時（ユーザー確認後）。
  - `approvedItems` が空の場合は追記しない。

```ts
// Markdown 統合の擬似コード
function buildFinalMarkdown(baseMarkdown: string, approvedItems: WebSupplementItem[]): string {
  const supplementSection = buildWebSupplementMarkdown(approvedItems);
  if (!supplementSection) return baseMarkdown;
  return baseMarkdown + "\n\n" + supplementSection;
}
```

### 5. エラー状態・空状態・ローディング状態

- **ローディング**: スピナー＋「Web補足情報を取得中...」メッセージ。
- **エラー**: `ErrorNotice` コンポーネントを再利用。エラーコードを日本語メッセージに変換する（`src/lib/errorMessages.ts` を更新）。
- **空状態**: 取得結果が 0 件の場合は「補足情報が見つかりませんでした。」と表示し、スキップを促す。
- **スキップ**: ユーザーがいつでも Web 補足なしで次のステップに進める。

### 6. `src/lib/errorMessages.ts` への追記

```ts
company_not_found: "企業情報を取得できませんでした。企業名を確認してください。",
```

## 変更が想定されるファイル

- `src/components/WebSupplementPanel.tsx`（新規）
- `src/components/steps/WebSupplementStep.tsx`（新規）
- `src/components/BriefingNoteFlow.tsx`（ステップ追加・状態追加）
- `src/lib/flow.ts`（ステップ定義更新、存在する場合）
- `src/lib/errorMessages.ts`（`company_not_found` 追加）

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| ユーザー確認なしに補足が本文へ混ざらない | 「採用した補足を追加して次へ」ボタンで明示的に承認しないと追記されない |
| 出典 URL と取得日が Markdown に残る | `buildWebSupplementMarkdown` が `sourceUrl` / `retrievedAt` を必ず含む |
| 信頼度または要確認表示が確認できる | `WebSupplementPanel` に confidence バッジ・要確認バッジを表示 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

手動確認（実 OpenAI キー設定時）:

1. OCR 確認後に「次へ」→ Web 補足ステップが表示される
2. 「補足情報を取得」ボタン → ローディング → 候補一覧が表示される
3. 各候補に confidence バッジ・要確認バッジ・出典 URL・取得日が表示される
4. 採用 / 却下トグルを操作できる
5. 「採用した補足を追加して次へ」→ Markdown 末尾に `## Web補足情報（出典付き）` セクションが追記される
6. 紙メモ由来セクションに Web 情報が混入しない
7. 「スキップ」押下で Web 補足なしに次へ進める
8. 企業名不明の場合に適切なエラーメッセージが表示される

## リスク / 不明点

- **ステップ追加の UI 変更**: `BriefingNoteFlow.tsx` は Phase 3〜6 の変更が積み重なっているため、ステップ追加による既存フローへの影響を確認してから実装する。
- **Markdown 追記の冪等性**: ユーザーが WebSupplementStep に戻って再採否した場合、Markdown の重複追記を防ぐ。状態管理で「Web 補足セクション追記済みフラグ」を持つか、Step 4 に進む直前に計算する設計を推奨。
- **スキップ後の再アクセス**: ユーザーが Step 4 から Step 3 に戻った場合の状態管理を明確にする（採否状態をリセットするか保持するか）。
