# Issue #36 設計: OpenAI API のエラーハンドリング・コスト・ログ方針を実装する

対象 GitHub Issue: #36(`docs/generated-issues/06-04-openai-api-のエラーハンドリング-コスト-ログ方針を実装する.md`)
Phase: 6 / 優先度: Medium / 実装順: **4 番目(仕上げ)**
依存: #34(OCR ルート)、#35(構造化ルート)

## Issue 概要

OCR(#34)/ 構造化(#35)の両ルートを横断して、API 失敗時や高コスト化を安全に扱える状態にする。
レート制限・タイムアウト・入力不正のエラーを安定コードに分類し、UI に安全に表示する。
コスト方針を docs に記録し、画像・OCR 全文・生成 Markdown・秘密情報をログに残さない。

## スコープ

- 例外 → 安定エラーコード(`invalid_input` / `payload_too_large` / `not_configured` / `rate_limited` / `timeout` / `provider_error` / `validation_failed`)への写像を共通化する。
- タイムアウト(`AbortController`)とレート制限(429)を検出・分類する。
- `app/api/ocr` / `app/api/structure` を共通エラー写像に載せ替える。
- UI(OCR / 生成エラー)でエラーコードを日本語メッセージに写像して表示する。
- 画像・OCR 全文・生成 Markdown・キーをログに出さない秘匿ログ方針を実装する。
- コスト方針を `docs/openai-integration.md` に追記する。

## スコープ外

- 課金ダッシュボード連携、ユーザー別利用量管理(roadmap スコープ外)。
- 新規機能追加。本 Issue は #34 / #35 の品質・安全の横断強化のみ。

## 共有設計判断(Phase 計画より)

- エラーレスポンスは `{ error: { code, message } }`。`message` はユーザーに見せて安全な日本語のみ。内部情報・スタック・キーを含めない。
- ログはエラーコードと最小メタデータ(処理段階・所要時間・プロバイダー)に限る。
- コストは「画像 + 構造化で 1 メモ 2 呼び出し」を前提に、サイズ・トークン・モデルで抑える方針を docs に残す。

## 実装ステップ

1. 共通エラー写像 `src/lib/server/errors.ts` を実装する。

   ```ts
   import type { ApiErrorCode, ApiErrorBody } from "../openai/contracts";

   export class ApiError extends Error {
     constructor(
       readonly code: ApiErrorCode,
       readonly httpStatus: number,
       readonly safeMessage: string,
     ) {
       super(code);
     }
   }

   // OpenAI / fetch 例外などを安定コードへ写像する
   export function toApiError(error: unknown): ApiError {
     // 429 / rate limit        -> rate_limited (429)
     // AbortError / timeout    -> timeout (504)
     // それ以外の provider 例外 -> provider_error (502)
   }

   export function errorResponse(error: ApiError): Response {
     const body: ApiErrorBody = {
       error: { code: error.code, message: error.safeMessage },
     };
     return Response.json(body, { status: error.httpStatus });
   }
   ```

   - `safeMessage` はコードごとの定型日本語(プロバイダー内部情報を含めない)。

2. タイムアウト制御を OpenAI 呼び出しに追加する。

   - `src/lib/server/openaiClient.ts` の呼び出しに `AbortController` + タイムアウト(既定値を定数化、env 上書き可)を渡す。
   - 超過 → `toApiError` が `timeout` に分類。

3. 秘匿ログヘルパー `src/lib/server/logger.ts` を実装する。

   ```ts
   // 画像バイト・OCR 全文・生成 Markdown・キー・個人情報を渡さない。
   // 受け取るのは { stage, code, durationMs, provider } 程度のメタデータのみ。
   export function logApiEvent(meta: {
     stage: "ocr" | "structure";
     code: ApiErrorCode | "ok";
     durationMs: number;
     provider: "dummy" | "openai";
   }): void { /* console.info(JSON.stringify(meta)) など最小限 */ }
   ```

   - 既存ルートで本文や OCR テキストを誤ってログしていないか確認・除去する。

4. ルートをエラー写像・ロガーに載せ替える。
   - `app/api/ocr/route.ts` / `app/api/structure/route.ts` の `try/catch` で `toApiError` → `errorResponse`。
   - 成功・失敗の両方で `logApiEvent`(メタデータのみ)。

5. UI のエラーメッセージ写像。
   - エラーコード → 日本語メッセージのマップを `src/lib/errorMessages.ts`(クライアント可、純粋)に置く。
     - `rate_limited`: 「混み合っています。少し時間をおいて再試行してください。」
     - `timeout`: 「応答に時間がかかりました。再試行してください。」
     - `not_configured`: 「OpenAI が未設定です。ダミーモードで動作しています。」
     - `validation_failed`: 「生成結果を確認できませんでした。再試行してください。」
     - `payload_too_large` / `invalid_input` / `provider_error`: それぞれ安全な定型文。
   - `ocrClient` / `structureClient` がエラーコードを投げ、[BriefingNoteFlow.tsx](../../../src/components/BriefingNoteFlow.tsx) が `ErrorNotice` で表示する。

6. コスト方針を `docs/openai-integration.md` に追記する。
   - 1 メモあたり OCR + 構造化の 2 呼び出しが発生すること。
   - コスト要因: 画像解像度・サイズ、出力トークン数、モデル選択(`gpt-4o` vs `gpt-4o-mini` 等)。
   - 抑制策: 画像サイズ上限(10MB)、出力トークン上限、低コストモデル既定、ダミーモードでの開発。
   - TODO: 利用量上限・ユーザー別管理は Post-MVP(roadmap スコープ外)。

7. テストを追加する(実 API 不要)。
   - `toApiError`: 429 / Abort / 一般例外 → `rate_limited` / `timeout` / `provider_error`。
   - `errorResponse`: ステータスと本文形状。
   - `errorMessages`: 全コードに安全メッセージが存在し、内部情報を含まない。
   - `logApiEvent`: メタデータのみで本文を受け取らない型であること(型レベル含む)。

## 変更が想定されるファイル

- `src/lib/server/errors.ts`(新規)
- `src/lib/server/logger.ts`(新規)
- `src/lib/errorMessages.ts`(新規)
- `app/api/ocr/route.ts` / `app/api/structure/route.ts`(エラー写像・ロガー適用)
- `src/lib/server/openaiClient.ts`(タイムアウト追加)
- `src/components/BriefingNoteFlow.tsx`(エラーコード → メッセージ表示)
- `docs/openai-integration.md`(コスト方針追記)
- 関連テスト(新規)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 主要エラーが UI に安全に表示される | `toApiError` で分類 → `errorResponse` → `errorMessages` 写像 → `ErrorNotice` 表示。内部情報・キーを出さない |
| ログに秘密情報や OCR 全文が残らない | `logApiEvent` はメタデータのみ受領。既存ルートの本文/OCR ログを除去。キーを出さない |
| コスト方針が docs に残っている | `docs/openai-integration.md` のコスト方針節(呼び出し回数・要因・抑制策・Post-MVP TODO) |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

手動(実キー設定時): レート制限 / タイムアウト / 不正入力で安全なエラーが表示され、ログに画像・OCR 全文・キーが出ないことを確認する。

## リスク / 不明点

- **OpenAI エラー形状の差異**: 429 / タイムアウトの判定方法は SDK 仕様に依存 → 実装時に docs / 型を確認し `toApiError` を調整する。
- **ログの抜け漏れ**: 既存ルートやデバッグログで本文を出していないか網羅確認する。
- **メッセージの安全性**: UI メッセージにプロバイダー内部情報を絶対に含めない。`message` はコード由来の定型文のみ。
- **タイムアウト既定値**: 短すぎると正常リクエストを切る → 既定値は余裕を持たせ env で上書き可能にする。
