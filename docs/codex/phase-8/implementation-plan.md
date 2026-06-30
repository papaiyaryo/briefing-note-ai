# Phase 8 実装計画: Web 補足情報

## Phase 目的

Web 由来の企業情報を、出典付きで説明会メモと分離して扱えるようにする。
ユーザーが採用した補足情報のみを Markdown に統合し、紙メモ由来情報との混在を防ぐ。

## 対象 Issue 一覧

| 番号 | タイトル | 種別 | 依存 |
|------|----------|------|------|
| 08-01 | Web 補足機能の仕様と取得方針を整理する | docs | なし |
| 08-02 | 出典付き Web 補足情報の取得・生成を実装する | backend | 08-01 |
| 08-03 (GitHub #43) | Web 補足の確認 UI と Markdown 統合を実装する | frontend | 08-02 |

## 実装順序

```
08-01 (仕様整理) → 08-02 (バックエンド) → 08-03 (フロントエンド)
```

Phase 7 (Google Drive) は後回しとする。Phase 8 は Phase 6 完了を前提とする。

## 共有設計方針

### データモデル (`src/lib/types.ts` に追加)

```typescript
export type WebSupplementConfidence =
  | "high"           // 公式サイトから直接取得
  | "medium"         // 公式に近いソース
  | "low"            // 非公式または間接情報
  | "requires_check"; // 不確実・要確認

export type WebSupplementStatus = "pending" | "adopted" | "rejected";

export interface WebSupplementItem {
  id: string;
  category: string;            // "事業内容" "強み" など
  content: string;             // 補足テキスト本文
  sourceUrl: string;           // 出典 URL
  fetchedAt: string;           // ISO 8601 日付文字列 (YYYY-MM-DD)
  confidence: WebSupplementConfidence;
  status: WebSupplementStatus;
}
```

### フロー変更

現在: `upload → ocr → markdown`

Phase 8 追加後: `upload → ocr → web-supplement → markdown`

補足採用はMarkdown生成前に行う。これにより `toMarkdown` が採用済み補足を1パスで組み込める。

### API Route: `POST /api/web-supplement`

**Request:**
```json
{
  "companyName": "企業名",
  "companyEventInfo": {
    "companyName": "企業名",
    "eventName": "説明会名",
    "eventDate": "2026-06-30"
  }
}
```

**Response (成功):**
```json
{
  "supplements": [
    {
      "id": "uuid-string",
      "category": "事業内容",
      "content": "SaaS型の人事管理システムを展開",
      "sourceUrl": "https://example.com/about",
      "fetchedAt": "2026-06-30",
      "confidence": "high",
      "status": "pending"
    }
  ],
  "provider": "dummy"
}
```

エラーレスポンスは `/api/ocr` `/api/structure` と同形式。

**プロバイダー選択:**

| 優先順位 | 条件 | 選択 |
|----------|------|------|
| 1 | `WEB_SUPPLEMENT_PROVIDER=dummy` | dummy |
| 2 | `WEB_SUPPLEMENT_PROVIDER=openai` | openai |
| 3 | `OPENAI_API_KEY` あり | openai |
| 4 | それ以外 | dummy |

### Markdown 統合方針

`toMarkdown` の `ToMarkdownOptions` に `webSupplements?: WebSupplementItem[]` を追加する。
渡すのは `status === "adopted"` のものだけ。

**採用あり:**
```markdown
## Web 補足情報

> Web 由来情報です。説明会で得た事実とは分けて参照してください。

### 事業内容（Web 補足）
- SaaS型の人事管理システムを展開
  - 出典: https://example.com/about
  - 取得日: 2026-06-30
  - 信頼度: 高
```

**採用なし:**
```markdown
## Web 補足情報

採用した Web 補足なし
```

### レイヤー分離

既存の `/api/ocr`、`/api/structure` と同じ方針に従う。

| レイヤー | 場所 | 責務 |
|----------|------|------|
| 純粋ロジック | `src/lib/` | 型定義、Markdown 組み立て |
| サーバー専用 | `src/lib/server/`, `app/api/` | Web 取得、プロバイダー切替 |
| クライアント | `src/components/` | UI、状態管理、APIフェッチ |

## Phase 全体の検証方針

各 Issue で以下を実施する:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Dummy モードで動作確認し、実プロバイダーなしでも UI がフル動作することを確認する。

## スコープ外

- 実際の Web スクレイピング実装（dummy provider で代替）
- 自動一括採用
- 企業比較機能
- 非公式情報の大量収集
- Google Drive 連携（Phase 7）
