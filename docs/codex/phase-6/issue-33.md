# Issue #33 設計: OpenAI API 連携設計とサーバー側境界を整理する

対象 GitHub Issue: #33(`docs/generated-issues/06-01-openai-api-連携設計とサーバー側境界を整理する.md`)
Phase: 6 / 優先度: High / 実装順: **1 番目(基盤)**

## Issue 概要

OpenAI API キーをクライアントに露出せず、OCR と構造化を扱うための**サーバー側境界と契約**を設計する。
Phase 6 の他 3 Issue(#34 OCR ルート、#35 構造化、#36 エラー/コスト/ログ)が参照する土台。
GitHub Issue の Out of Scope に「OpenAI API 実装」が含まれるため、**この Issue ではネットワーク呼び出しを実装しない**。
成果物は設計ドキュメントと、純粋な共有型(契約・エラーコード・プロバイダー判定)に限る。

## スコープ

- API ルートの責務・リクエスト/レスポンス契約を設計ドキュメントに整理する。
- 送信するデータ / 保存しないデータ / ログに出さないデータを定義する。
- 環境変数とプロバイダー切替方針を定義する。
- コスト方針・ログ方針の TODO を整理する(詳細実装は #36)。
- 上記契約を反映した**純粋な共有型**(ネットワーク呼び出しなし)を `src/lib/openai/` に定義する。

## スコープ外

- OpenAI API の実呼び出し(#34 / #35)。
- `openai` / `zod` 依存の追加(それぞれ #34 / #35 で行う)。
- エラー写像・ログ秘匿ヘルパーの実装(#36)。
- Google Drive(Phase 7)、Web 補足(Phase 8)。

## 共有設計判断(Phase 計画より)

- プロバイダーは **OpenAI**。OCR・構造化の両方に使う。
- レイヤー分離: 純粋ロジック(`src/lib/`)/ サーバー専用(`src/lib/server/`・`app/api/*/route.ts`)/ クライアント。
  API キーと OpenAI SDK を触れるのはサーバー専用レイヤーのみ。
- API ルート: `POST /api/ocr`、`POST /api/structure`(契約は Phase 計画 §3 を正準とする)。
- プロバイダー切替: `OPENAI_API_KEY` 未設定なら `"dummy"`、`OCR_PROVIDER` / `STRUCTURE_PROVIDER` 明示があれば優先。
- エラーコードは安定集合(`invalid_input` / `payload_too_large` / `not_configured` / `rate_limited` / `timeout` / `provider_error` / `validation_failed`)。

## 実装ステップ

1. 設計ドキュメント `docs/openai-integration.md` を新規作成し、次を記述する。
   - 全体構成図(Browser → 自アプリ API ルート → OpenAI、キーはサーバーのみ)
   - `POST /api/ocr` / `POST /api/structure` のリクエスト/レスポンス契約とエラー形式
   - 環境変数一覧(`OPENAI_API_KEY`、`OCR_PROVIDER`、`STRUCTURE_PROVIDER`、`OPENAI_OCR_MODEL`、`OPENAI_STRUCTURE_MODEL`)と既定値・上書き規則
   - プロバイダー切替方針(ダミー / 実、MVP を壊さない)
   - 送信データ / 非保存 / 非ログのデータ境界(画像・OCR 全文・生成 Markdown・キーは保存もログもしない)
   - プライバシー注意(実画像・選考情報を OpenAI に送る点)
   - コスト方針の TODO(画像 + 構造化で 2 呼び出し、サイズ/トークン上限、モデル選択 — 詳細は #36)
   - ログ方針の TODO(エラーコードと最小メタデータのみ — 詳細は #36)
   - モデル選定は実装時に最新 OpenAI docs で確認する旨

2. 純粋な共有型を `src/lib/openai/contracts.ts` に定義する(ネットワーク呼び出しなし)。

   ```ts
   import type { CompanyEventInfo } from "../types";

   export type LlmProvider = "dummy" | "openai";

   // POST /api/ocr
   export interface OcrApiResponse {
     text: string;
     provider: LlmProvider;
   }

   // POST /api/structure
   export interface StructureApiRequest {
     ocrText: string;
     companyEventInfo: CompanyEventInfo;
   }
   // memo の型は #35 で定義する CompanyMemoStructured を参照する(ここでは構造化レスポンスの枠のみ)

   // 安定エラーコード(全 API ルート共通)
   export type ApiErrorCode =
     | "invalid_input"
     | "payload_too_large"
     | "not_configured"
     | "rate_limited"
     | "timeout"
     | "provider_error"
     | "validation_failed";

   export interface ApiErrorBody {
     error: { code: ApiErrorCode; message: string };
   }
   ```

3. プロバイダー判定の純粋関数を `src/lib/openai/provider.ts` に定義する(env を読むのみ、呼び出しなし)。

   ```ts
   import type { LlmProvider } from "./contracts";

   function resolveProvider(
     explicit: string | undefined,
     hasApiKey: boolean,
   ): LlmProvider {
     if (explicit === "openai") return "openai";
     if (explicit === "dummy") return "dummy";
     return hasApiKey ? "openai" : "dummy";
   }

   export function getOcrProvider(env = process.env): LlmProvider {
     return resolveProvider(env.OCR_PROVIDER, Boolean(env.OPENAI_API_KEY));
   }

   export function getStructureProvider(env = process.env): LlmProvider {
     return resolveProvider(env.STRUCTURE_PROVIDER, Boolean(env.OPENAI_API_KEY));
   }
   ```

   ※ `env` を引数で受けることで単体テストを決定的にする(実 env に依存しない)。

4. `.env.example` に Phase 6 で使う変数を追記する(値は空のまま)。

   ```env
   # OpenAI provider switch / models (Phase 6)
   OCR_PROVIDER=
   STRUCTURE_PROVIDER=
   OPENAI_OCR_MODEL=
   OPENAI_STRUCTURE_MODEL=
   ```

5. `getOcrProvider` / `getStructureProvider` の単体テストを追加する(env 引数で `dummy` / `openai` の分岐を検証)。

## 変更が想定されるファイル

- `docs/openai-integration.md`(新規)
- `src/lib/openai/contracts.ts`(新規)
- `src/lib/openai/provider.ts`(新規)
- `src/lib/openai/provider.test.ts`(新規)
- `.env.example`(Phase 6 変数を追記)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| OpenAI API キーがサーバー側だけで扱われる設計である | `docs/openai-integration.md` のレイヤー分離 + API キーをサーバー専用に限定、`NEXT_PUBLIC_` を付けない方針を明記 |
| 送信データと保存しないデータが明確である | docs の「データ境界」節 + 契約型(送るのは画像 / OCR テキスト、保存・ログしない) |
| コスト・ログ方針の TODO が整理されている | docs の「コスト方針 TODO」「ログ方針 TODO」節(詳細実装は #36 に委譲) |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## リスク / 不明点

- この Issue で契約を作り込みすぎると #34 / #35 と齟齬が出る → 「Phase 計画 §3 のルート契約」を正準とし、ここでは型と方針の固定に留める。
- モデル名を docs に書く場合は「実装時に最新 docs で確認」を併記し、コードへハードコードしない。
- `process.env` 直参照はテストしにくい → プロバイダー判定は env 引数注入で純粋化する。
