# Phase 8 実装計画: Web 補足情報（出典付き取得・UI 統合）

## Phase 目的

Phase 6 で確立したサーバー側 OpenAI 境界を基盤に、**企業の公式 Web ページから補足情報を取得し、出典付きで管理する機能**を追加する。

取得した情報はユーザーが 1 件ずつ確認・採否を決め、承認したものだけを Markdown の専用セクションに追記する。
紙メモ由来の情報（OCR・構造化）と Web 由来の情報は常に分離して扱い、混在させない。

## 対象 Issue 一覧

| Issue | 生成元 | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- | --- |
| #41 | 08-01 | Web 補足機能の仕様と取得方針を整理する | Low | 基盤（仕様・方針ドキュメント） |
| #42 | 08-02 | 出典付き Web 補足情報の取得・生成を実装する | Low | バックエンド（API ルート・LLM 連携） |
| #43 | 08-03 | Web 補足の確認 UI と Markdown 統合を実装する | Low | フロントエンド（確認 UI・Markdown 追記） |

## 実装順序と依存関係

```text
#41 (仕様ドキュメント・型契約・ダミー実装: 基盤)
  └─> #42 (サーバー側 fetch + LLM 抽出・API ルート)
         └─> #43 (確認 UI・採否操作・Markdown 追記)
```

推奨実装順: **#41 → #42 → #43**

理由:

- **#41** は Phase 8 の方針・型・ダミー実装を確立する。他 2 Issue が参照する土台。ネットワーク呼び出しは行わない。
- **#42** は #41 で確立した型と方針をもとに、実際のサーバー側 fetch / LLM 抽出・API ルートを実装する。
- **#43** は #42 の API ルートが存在してから、フロントの確認 UI と Markdown 追記を実装する。

## 共有設計判断（Phase 全体で固定）

### 1. Web 補足はユーザー確認が必須

- 取得した補足候補をユーザーが 1 件ずつ確認し、採用 / 却下を選ぶ。
- ユーザーが採用した項目のみ Markdown に追記する（自動統合しない）。
- Markdown の `## Web補足情報（出典付き）` セクションは紙メモ由来セクションと明確に分離する。

### 2. レイヤー分離（Phase 6 と同じ方針）

| レイヤー | 配置 | 責務 | ネットワーク |
| --- | --- | --- | --- |
| 純粋ロジック | `src/lib/webSupplement/` | 型・zod スキーマ・検証・toMarkdown | 不可（単体テスト対象） |
| サーバー専用 | `src/lib/server/webSupplement.ts` | Web fetch / OpenAI 呼び出し・エラー写像 | OpenAI・外部サイトのみ |
| API ルート | `app/api/web-supplement/route.ts` | リクエスト受付・プロバイダー振り分け | — |
| クライアント | `src/lib/webSupplementClient.ts` | `/api/web-supplement` へ fetch | 自アプリ API ルートのみ |

### 3. 型定義（`src/lib/webSupplement/schema.ts`）

```ts
export type WebSupplementSourceType = "official" | "career" | "news" | "other";
export type WebSupplementConfidence = "high" | "medium" | "low";

export interface WebSupplementItem {
  id: string;
  content: string;
  sourceUrl: string;
  retrievedAt: string;           // ISO 8601 date (YYYY-MM-DD)
  sourceType: WebSupplementSourceType;
  confidence: WebSupplementConfidence;
  needsVerification: boolean;    // 要確認フラグ
  category: string;              // "事業内容" / "採用情報" など
}

export interface WebSupplementResult {
  companyName: string;
  items: WebSupplementItem[];
}
```

`needsVerification = true` にする基準:

- `confidence` が `"medium"` 以下
- LLM の補足テキストに不確実表現（「〜と思われる」「〜の可能性」など）が含まれる場合
- `sourceType` が `"other"`（非公式）の場合

### 4. API ルート契約

```text
POST /api/web-supplement
  input:  { companyName: string }
  output: { result: WebSupplementResult, provider: "dummy" | "openai" }
```

エラーレスポンスは Phase 6 と同じ `{ error: { code, message } }` 形式を使う。
`ApiErrorCode` に `"company_not_found"` を追加する（企業名から URL が特定できなかった場合）。

### 5. プロバイダー切替（ダミー / 実）

- `getWebSupplementProvider()` を `src/lib/openai/provider.ts` に追加する。
- 判定ロジック:
  - `WEB_SUPPLEMENT_PROVIDER` 環境変数が `"dummy"` → dummy
  - `WEB_SUPPLEMENT_PROVIDER` が `"openai"` → openai
  - 未設定かつ `OPENAI_API_KEY` あり → openai
  - 未設定かつ `OPENAI_API_KEY` なし → dummy（MVP フォールバック）
- dummy は `src/lib/webSupplement/dummy.ts` のサンプルデータを返す（ネットワーク呼び出しなし）。

### 6. Web fetch + LLM 抽出方針

OpenAI Responses API の `web_search_preview` ビルトインツールを使って、企業の公式サイト・採用ページを検索・取得する。

```text
1. 企業名を入力に "{{companyName}} 公式サイト 採用情報" などのクエリで検索
2. OpenAI が信頼度の高い公式ページを優先して情報を取得
3. Structured Outputs で WebSupplementItem[] を生成・返却
4. sourceType / confidence / needsVerification は LLM に判定させる
```

使用モデルは `WEB_SUPPLEMENT_MODEL` 環境変数で上書き可能にし、コードへハードコードしない。
実装時に最新の OpenAI 公式 docs でモデル名・ツール仕様を確認すること。

**プライバシー注意**: 入力するのは企業名のみ（個人情報・OCR テキスト・選考情報は送らない）。

### 7. Markdown 統合フォーマット

採用した補足情報は以下のセクションとして Markdown 末尾に追記する。

```markdown
## Web補足情報（出典付き）

> **注意**: 以下は Web から取得した参考情報です。説明会メモとは独立して記載しています。
> 情報の正確性はご自身で確認してください。

### 事業内容
<!-- 要確認 -->
[content]
> 出典: https://example.com/about（取得日: 2025-01-01）

### 採用情報
[content]
> 出典: https://careers.example.com（取得日: 2025-01-01）
```

- `needsVerification = true` の項目には `<!-- 要確認 -->` コメントを付ける。
- 紙メモ由来のセクション（`## 事業内容` など）とは**別セクション**として末尾に追加する。

### 8. セキュリティ / プライバシー / ログ方針

- API キーはサーバー専用レイヤーのみ。`.env` をコミットしない（`.env.example` のみ）。
- 入力は企業名のみ。OCR テキスト・画像・個人情報は Web 補足 API に送らない。
- 取得したページ全文・API レスポンス全体を不用意にログ出力しない。
- エラーログはエラーコードと最小メタデータ（フェーズ・所要時間）に限る。

### 9. テスト方針

- 純粋ロジック（スキーマ・検証・toMarkdown・プロバイダー判定・ダミー）は Vitest で単体テストを追加する。
- テストは実 OpenAI キーを必要としない（プロバイダーをダミー固定 / OpenAI 呼び出しはモック）。
- CI は `lint` / `typecheck` / `test` / `build` が通ること。

## 既存実装との関係

- `src/lib/openai/contracts.ts`: `ApiErrorCode` に `"company_not_found"` を追加する（#41 または #42）。
- `src/lib/openai/provider.ts`: `getWebSupplementProvider()` を追加する（#41）。
- `src/lib/structure/schema.ts`・`src/lib/server/ocr.ts` など Phase 6 資産はそのまま維持する。
- `BriefingNoteFlow.tsx`: Web 補足確認ステップを追加する（#43）。

## Phase 全体の検証方針

各 Issue の PR で以下を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

手動確認（実 OpenAI キー設定時）:

1. 企業名を入力 → `/api/web-supplement` 経由で補足候補一覧が表示される
2. 各候補に出典 URL・取得日・信頼度・要確認フラグが表示される
3. 採用した候補のみ Markdown 末尾に `## Web補足情報（出典付き）` として追記される
4. 紙メモ由来セクションに Web 情報が混入しない
5. `OPENAI_API_KEY` を外すとダミーデータで動作する
6. 企業名不明・検索失敗時に安全なエラーが UI に表示される

## スコープ外（Phase 8 では実装しない）

- ユーザーに無断での Markdown 自動統合
- 非公式情報の大量収集・スクレイピング
- 企業比較データ構造・面接前復習モード（Phase 9）
- Google Drive 保存（Phase 7）
- ユーザーアカウント・複数端末同期

## リスク / 留意点

- **モデル / API 仕様のドリフト**: OpenAI Responses API の `web_search_preview` 仕様は実装時に最新 docs で確認する。設計はモデル名・ツール名を env で上書き可能にし、コードへハードコードしない。
- **Web fetch の不確実性**: 公式サイトが特定できない・情報が取得できない場合は `"company_not_found"` エラーを返す。LLM が企業情報を推測・捏造しないよう、システムプロンプトで明示的に禁止する。
- **コスト**: Web 検索付き API 呼び出しは通常より費用がかかる可能性がある。1 回の呼び出しで完結するよう設計し、追加検索は最小限にする。
- **プライバシー**: 入力は企業名のみとし、選考情報・個人情報は送らない。
