# Issue #43: Web 補足の確認 UI と Markdown 統合を実装する

## Issue 概要

Web 補足候補をユーザーが一覧確認し、採用・却下を選んだ後に出典付きで Markdown へ統合する UI を実装する。

依存: Issue 08-02（補足取得 API）完了後に着手する。

## スコープ

- Web 補足候補の一覧表示
- 採用・却下のトグル操作
- 採用済み補足を出典付きで Markdown に追記
- 紙メモ由来情報との区別を UI 上で明確化
- `web-supplement` ステップをフローに追加

## スコープ外

- 自動一括採用
- 企業比較機能
- 実際の Web スクレイピング（08-02 の担当）

## 実装ステップ

### Step 1: 型定義の追加

`src/lib/types.ts` に追加:

```typescript
export type WebSupplementConfidence =
  | "high"
  | "medium"
  | "low"
  | "requires_check";

export type WebSupplementStatus = "pending" | "adopted" | "rejected";

export interface WebSupplementItem {
  id: string;
  category: string;
  content: string;
  sourceUrl: string;
  fetchedAt: string;
  confidence: WebSupplementConfidence;
  status: WebSupplementStatus;
}
```

### Step 2: フロー定義の更新

`src/lib/flow.ts`:

```typescript
export const STEP_IDS = ["upload", "ocr", "web-supplement", "markdown"] as const;

// STEPS 配列に追加:
{ id: "web-supplement", number: 3, label: "Web 補足" }
// "markdown" は number: 4 になる
```

### Step 3: APIクライアントの追加

新規ファイル `src/lib/webSupplementClient.ts`:

```typescript
import type { CompanyEventInfo } from "./markdown";
import type { WebSupplementItem } from "./types";

export interface WebSupplementResponse {
  supplements: WebSupplementItem[];
  provider: string;
}

export async function requestWebSupplements(
  companyEventInfo: CompanyEventInfo,
): Promise<WebSupplementResponse> {
  const res = await fetch("/api/web-supplement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyName: companyEventInfo.companyName,
      companyEventInfo,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      body?.error?.message ?? "Web 補足の取得に失敗しました。",
    );
  }
  return res.json() as Promise<WebSupplementResponse>;
}
```

### Step 4: Markdown 生成への統合

`src/lib/structure/toMarkdown.ts` の `ToMarkdownOptions` に追加:

```typescript
import type { WebSupplementItem } from "../types";

export interface ToMarkdownOptions {
  ocrText: string;
  imageFileName?: string;
  webSupplements?: WebSupplementItem[]; // status === "adopted" のみ渡す
}
```

`## Web 補足情報` セクションの更新:

```typescript
function renderWebSupplements(items: WebSupplementItem[] | undefined): string {
  if (!items || items.length === 0) {
    return "## Web 補足情報\n\n採用した Web 補足なし\n";
  }

  const confidenceLabel: Record<WebSupplementConfidence, string> = {
    high: "高",
    medium: "中",
    low: "低",
    requires_check: "要確認",
  };

  const byCategory = items.reduce<Record<string, WebSupplementItem[]>>(
    (acc, item) => {
      (acc[item.category] ??= []).push(item);
      return acc;
    },
    {},
  );

  const sections = Object.entries(byCategory)
    .map(([cat, catItems]) => {
      const bullets = catItems
        .map(
          (item) =>
            `- ${item.content}\n` +
            `  - 出典: ${item.sourceUrl}\n` +
            `  - 取得日: ${item.fetchedAt}\n` +
            `  - 信頼度: ${confidenceLabel[item.confidence]}`,
        )
        .join("\n");
      return `### ${cat}（Web 補足）\n${bullets}`;
    })
    .join("\n\n");

  return (
    "## Web 補足情報\n\n" +
    "> Web 由来情報です。説明会で得た事実とは分けて参照してください。\n\n" +
    sections +
    "\n"
  );
}
```

### Step 5: UI コンポーネントの作成

新規ファイル `src/components/steps/WebSupplementStep.tsx`:

**表示要素:**
- ページ上部に「紙メモと Web 補足の区別について」の注意書き
- ローディング状態: スピナー + "Web 補足候補を取得中..."
- エラー状態: エラーメッセージ + 再試行ボタン
- 候補リスト: カテゴリ・本文・出典 URL・取得日・信頼度バッジ
- 採用/却下ボタン（toggle、`status` に応じてハイライト）
- 「スキップ（補足なしで続ける）」ボタン
- 「次へ」ボタン

**信頼度バッジの配色:**

| confidence | ラベル | 色 |
|---|---|---|
| `high` | 高 | green |
| `medium` | 中 | yellow |
| `low` | 低 | orange |
| `requires_check` | 要確認 | red |

**ステータス表示:**
- `pending`: 通常表示、採用/却下ボタン両方 available
- `adopted`: 緑ハイライト、採用ボタン active
- `rejected`: グレーアウト、却下ボタン active、本文を薄く表示

**Props:**
```typescript
interface WebSupplementStepProps {
  companyEventInfo: CompanyEventInfo;
  supplements: WebSupplementItem[];
  isFetching: boolean;
  hasError: boolean;
  errorMessage: string;
  onFetch: () => void;
  onToggleStatus: (id: string, next: WebSupplementStatus) => void;
  onNext: () => void;
  onBack: () => void;
}
```

### Step 6: BriefingNoteFlow の更新

`src/components/BriefingNoteFlow.tsx` に追加:

**新規 state:**
```typescript
const [webSupplements, setWebSupplements] = useState<WebSupplementItem[]>([]);
const [isFetchingSupplements, setIsFetchingSupplements] = useState(false);
const [hasSupplementError, setHasSupplementError] = useState(false);
const [supplementErrorMessage, setSupplementErrorMessage] = useState("");
```

**`handleFetchSupplements`:**
- `requestWebSupplements(companyEventInfo)` を呼び出す
- 結果を `setWebSupplements` に格納
- エラーは state に反映

**`handleToggleSupplementStatus`:**
- `id` と次の `status` を受け取り、`webSupplements` 配列を更新

**`handleGenerateMarkdown` の更新:**
```typescript
const adoptedSupplements = webSupplements.filter(
  (s) => s.status === "adopted"
);
setMarkdownText(
  toMarkdown(result.memo, {
    imageFileName: selectedImage?.file.name,
    ocrText,
    webSupplements: adoptedSupplements,
  }),
);
```

**ステップ遷移:**
- OCR 確認ステップの「次へ」→ `web-supplement` ステップへ移動
- `handleFetchSupplements` を `web-supplement` ステップ入場時に自動実行
- Web 補足ステップの「次へ」→ `handleGenerateMarkdown` → `markdown` ステップ

### Step 7: テストの追加

- `tests/webSupplement.test.ts`: `requestWebSupplements` のモック検証
- `src/lib/structure/toMarkdown.test.ts` に `webSupplements` ありのケース追加
- `tests/flow.test.ts` に `web-supplement` ステップのケース追加

## 変更対象ファイル

| ファイル | 変更種別 |
|----------|----------|
| `src/lib/types.ts` | 追加: `WebSupplementItem` 等 |
| `src/lib/flow.ts` | 変更: `STEP_IDS`・`STEPS` に `web-supplement` 追加 |
| `src/lib/webSupplementClient.ts` | 新規 |
| `src/lib/structure/toMarkdown.ts` | 変更: `webSupplements` オプション対応 |
| `src/components/steps/WebSupplementStep.tsx` | 新規 |
| `src/components/BriefingNoteFlow.tsx` | 変更: 新ステップ・state 追加 |
| `src/components/StepIndicator.tsx` | 変更確認: step 数増加への対応 |
| `tests/webSupplement.test.ts` | 新規 |
| `src/lib/structure/toMarkdown.test.ts` | 追加: 補足ありケース |
| `tests/flow.test.ts` | 追加: `web-supplement` ステップ |

## Acceptance Criteria 対応

| Criteria | 対応箇所 |
|----------|----------|
| ユーザー確認なしに補足が本文へ混ざらない | `status === "adopted"` のみ `toMarkdown` に渡す |
| 出典 URL と取得日が Markdown に残る | `renderWebSupplements` で `sourceUrl`, `fetchedAt` を出力 |
| 信頼度または要確認表示が確認できる | UI バッジ + Markdown に信頼度ラベルを出力 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Dummy モードで `web-supplement` ステップが正常に動作することをブラウザで確認する。
採用した補足が Markdown の `## Web 補足情報` セクションに含まれることを確認する。
却下した補足が Markdown に含まれないことを確認する。

## リスク・不明点

- `StepIndicator` がステップ数の動的変化に対応できているか実装時に確認する
- 08-02 で実 OpenAI プロバイダーを実装する際に、API コスト・レート制限を考慮する
- `web-supplement` ステップへの自動遷移タイミング（OCR 完了直後か手動トリガーか）は実装時に UX を見て判断する
