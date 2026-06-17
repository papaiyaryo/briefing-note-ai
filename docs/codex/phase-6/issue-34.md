# Issue #34 設計: OCR / Vision API 接続を実装する

対象 GitHub Issue: #34(`docs/generated-issues/06-02-ocr-vision-api-接続を実装する.md`)
Phase: 6 / 優先度: High / 実装順: **2 番目**
依存: #33(契約・プロバイダー判定)、MVP アップロードフロー

## Issue 概要

アップロード画像から、サーバー経由で OpenAI Vision により実 OCR テキストを取得し、既存 UI に返す。
`OPENAI_API_KEY` 未設定時はダミー OCR にフォールバックし、ダミーと実プロバイダーを切替可能にする。
Phase 6 で最初に「実 OpenAI 呼び出し + API ルート + プロバイダー切替」の中核パターンを確立する。

## スコープ

- `POST /api/ocr` ルートを App Router で実装する(Node.js ランタイム)。
- サーバー側で画像を検証する(`src/lib/upload.ts` の形式・サイズ検証を再利用)。
- サーバー側で OpenAI Vision を呼び出し OCR テキストを取得する(プロバイダー = `openai` の場合)。
- プロバイダー = `dummy` の場合はサンプル(`DEMO_OCR_TEXT`)を返す。
- クライアント([BriefingNoteFlow.tsx](../../../src/components/BriefingNoteFlow.tsx))を `/api/ocr` 呼び出しに接続する。
- 失敗時に安全なエラーを返す / 表示する(詳細なエラー分類・ログ秘匿は #36 で強化)。

## スコープ外

- 構造化 JSON / Markdown 生成(#35)。
- エラー分類の網羅・コスト docs・ログ秘匿ヘルパー(#36。本 Issue では最小限のエラー処理に留める)。
- Web 補足(Phase 8)、Google Drive(Phase 7)。

## 共有設計判断(Phase 計画より)

- OpenAI SDK・`OPENAI_API_KEY` を触れるのはサーバー専用レイヤー(`src/lib/server/`・`route.ts`)のみ。
- プロバイダー判定は #33 の `getOcrProvider()` を使う。
- レスポンスは `{ text, provider }`(#33 `OcrApiResponse`)。エラーは `{ error: { code, message } }`。
- ボディ上限はアップロード制限(10MB)と整合。超過は `payload_too_large`。

## 実装ステップ

1. `openai` を `dependencies` に追加する(導入時の安定版)。

2. OpenAI クライアント生成をサーバー専用に隔離する `src/lib/server/openaiClient.ts` を作る。

   ```ts
   import OpenAI from "openai";

   // サーバー専用。クライアントから import しない。
   export function createOpenAiClient(env = process.env): OpenAI {
     const apiKey = env.OPENAI_API_KEY;
     if (!apiKey) {
       throw new Error("OPENAI_API_KEY is not configured");
     }
     return new OpenAI({ apiKey });
   }
   ```

3. OCR プロバイダー境界 `src/lib/server/ocr.ts` を作る。

   ```ts
   import type { OcrResult } from "../types";
   import { runDummyOcr } from "../dummyOcr";
   import { getOcrProvider } from "../openai/provider";

   export interface OcrInput {
     bytes: Uint8Array;
     mimeType: string;
   }

   export async function runOcr(input: OcrInput): Promise<OcrResult> {
     const provider = getOcrProvider();
     if (provider === "dummy") {
       const result = runDummyOcr("success");
       return { text: result.status === "success" ? result.text : "" };
     }
     return runOpenAiOcr(input); // 下記 §4
   }
   ```

   - 実 OCR は OpenAI の Vision 対応モデル(既定 `OPENAI_OCR_MODEL`、未設定時はコード内既定)に、画像を base64 data URL で渡す。
   - プロンプトは「手書き日本語メモを**そのまま文字起こし**する。解釈・要約・補完をしない。読めない箇所は `[判読不可]` とする」方針(構造化や創作は #35 で行う)。
   - モデル名・呼び出し方法は実装時に最新 OpenAI docs で確認する。

4. `app/api/ocr/route.ts` を実装する。

   ```ts
   export const runtime = "nodejs";

   export async function POST(request: Request) {
     // 1. multipart/form-data から file を取り出す
     // 2. src/lib/upload.ts の検証(MIME / 拡張子 / サイズ)をサーバー側で再適用
     //    NG → 400 { error: { code: "invalid_input" | "payload_too_large", message } }
     // 3. provider === "openai" かつ未設定 → 500 { error: { code: "not_configured", ... } }
     // 4. runOcr() を呼び、{ text, provider } を 200 で返す
     // 5. 例外 → 安全なエラー本文(#36 で分類を強化)
   }
   ```

   - 画像バイト・OCR 全文・キーをログに出さない。

5. クライアント側 fetch ヘルパー `src/lib/ocrClient.ts` を作る。

   ```ts
   import type { OcrApiResponse } from "./openai/contracts";

   export async function requestOcr(file: File): Promise<OcrApiResponse> {
     const form = new FormData();
     form.append("file", file);
     const res = await fetch("/api/ocr", { method: "POST", body: form });
     if (!res.ok) {
       // body の error.code を読み、呼び出し側で日本語メッセージへ写像
       throw await toOcrError(res);
     }
     return res.json();
   }
   ```

6. [BriefingNoteFlow.tsx](../../../src/components/BriefingNoteFlow.tsx) を接続する。

   - `startDummyOcr` の `setTimeout` + `runDummyOcr` を `requestOcr(selectedImage.file)` に置き換える。
   - 成功: `setOcrText(res.text)`、`ocr` ステップへ遷移。
   - 失敗: `setHasOcrError(true)` + 安全なメッセージ。
   - 「OCR 失敗を試す」操作は、ダミープロバイダー時の失敗確認として維持する(実プロバイダーでは実エラーで代替)。
   - アンマウント時の `pendingTimerRef` クリア相当として、fetch の中断/破棄後 state 更新防止に注意する(`AbortController` か `ignore` フラグ)。

7. テストを追加する(実 API キー不要)。
   - `src/lib/server/ocr.ts`: プロバイダー = `dummy` でサンプルを返すこと(OpenAI 呼び出しはモック)。
   - ルートの入力検証(不正 MIME / サイズ超過 → 対応エラーコード)。

## 変更が想定されるファイル

- `package.json`(`openai` 追加)
- `app/api/ocr/route.ts`(新規)
- `src/lib/server/openaiClient.ts`(新規)
- `src/lib/server/ocr.ts`(新規)
- `src/lib/ocrClient.ts`(新規)
- `src/components/BriefingNoteFlow.tsx`(`/api/ocr` 接続に置き換え)
- 関連テスト(新規)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| API キーがフロントエンドに露出しない | OpenAI 呼び出しは `route.ts` / `src/lib/server/` のみ。クライアントは fetch のみ。`NEXT_PUBLIC_` 不使用 |
| 失敗時に安全なエラーを返す | ルートは `{ error: { code, message } }` を返し、内部情報・キーを含めない。UI は安全メッセージ表示 |
| MVP のダミー OCR と切り替え可能である | `getOcrProvider()` により `OPENAI_API_KEY` 未設定でダミー、明示フラグで切替。ダミー時は `DEMO_OCR_TEXT` |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

手動(実キー設定時): 画像アップロード → 実 OCR テキスト表示。キーを外すとダミーに戻る。

## リスク / 不明点

- **モデル / Vision API 仕様**: モデル名・画像入力形式は実装時に最新 docs で確認。`OPENAI_OCR_MODEL` で上書き可能にし固定しない。
- **ペイロード上限**: Next.js のボディ上限と 10MB 制限の整合。超過は `payload_too_large` で安全に返す。
- **非同期遷移**: fetch 中のアンマウント / 画像差し替えで破棄後 state 更新が起きないよう中断制御する。
- **プライバシー**: 実画像を OpenAI に送る。画像バイト・OCR 全文をログに出さない。
- **エラー分類は最小限**: 本 Issue では基本的な成功/失敗のみ。レート制限・タイムアウトの細分類は #36。
