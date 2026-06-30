# Issue #42 設計: 出典付き Web 補足情報の取得・生成を実装する

対象 GitHub Issue: #42（`docs/generated-issues/08-02-出典付き-web-補足情報の取得-生成を実装する.md`）
Phase: 8 / 優先度: Low / 実装順: **2 番目**

依存: #41（型定義・スキーマ・ダミー実装・プロバイダー判定が完了していること）

## Issue 概要

#41 で確立した型・スキーマ・プロバイダー判定を使い、**サーバー側でのWeb補足情報取得と構造化生成**を実装する。
OpenAI Responses API の `web_search_preview` ビルトインツールを使って企業の公式ページを検索し、
`WebSupplementResult`（出典 URL・取得日・信頼度付き）として返す API ルートを追加する。

## スコープ

- `src/lib/server/webSupplement.ts` を新規作成する（サーバー専用 fetch + LLM 抽出ロジック）。
- `app/api/web-supplement/route.ts` を新規作成する（`POST /api/web-supplement`）。
- `src/lib/webSupplementClient.ts` を新規作成する（クライアント側 fetch ラッパー）。
- 実装時に最新の OpenAI 公式 docs でモデル名・ツール仕様を確認すること。

## スコープ外

- フロントエンド確認 UI・Markdown 追記（#43）。
- 非公式情報の大量収集・スクレイピング。
- ユーザーに無断での Markdown 自動統合。

## 共有設計判断（Phase 計画より）

- レイヤー分離: OpenAI SDK・`process.env` を触れるのはサーバー専用レイヤーのみ。クライアントは `/api/web-supplement` を呼ぶ。
- プロバイダー切替: `getWebSupplementProvider()`（#41 で追加）で `"dummy"` / `"openai"` を判定。
- 入力は企業名のみ。OCR テキスト・画像・個人情報は送らない。
- エラーレスポンスは `{ error: { code: ApiErrorCode, message: string } }` 形式（Phase 6 準拠）。

## 実装ステップ

### 1. `src/lib/server/webSupplement.ts` を新規作成する

```ts
// サーバー専用: Node.js ランタイム限定、OpenAI SDK を使う
import OpenAI from "openai";
import { validateWebSupplementResult } from "../webSupplement/validate";
import { buildDummyWebSupplementResult } from "../webSupplement/dummy";
import { getWebSupplementProvider } from "../openai/provider";
import type { WebSupplementResult } from "../webSupplement/schema";

export async function fetchWebSupplement(
  companyName: string,
  env = process.env,
): Promise<WebSupplementResult> {
  const provider = getWebSupplementProvider(env);
  if (provider === "dummy") {
    return buildDummyWebSupplementResult(companyName);
  }

  // OpenAI Responses API with web_search_preview
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const model = env.WEB_SUPPLEMENT_MODEL ?? "gpt-4o-mini-search-preview"; // 実装時に最新 docs で確認

  const systemPrompt = [
    "あなたは企業の公式情報を調査するアシスタントです。",
    "企業名から公式サイト・採用ページを優先して情報を収集し、",
    "出典 URL・取得日・信頼度を含む構造化データとして返してください。",
    "情報がない場合は推測や捏造をせず、空の配列を返してください。",
    "個人情報・選考情報は収集しないでください。",
  ].join("\n");

  const userPrompt = `「${companyName}」の公式サイトと採用ページから、事業内容・採用情報・企業文化などの補足情報を収集してください。`;

  // Structured Outputs で WebSupplementResult を生成
  // 実装時に最新 OpenAI docs で Responses API + web_search_preview + structured output の組み合わせを確認すること
  const response = await client.responses.create({
    model,
    tools: [{ type: "web_search_preview" }],
    instructions: systemPrompt,
    input: userPrompt,
    text: {
      format: {
        type: "json_schema",
        name: "WebSupplementResult",
        schema: { /* WebSupplementResultSchema を JSON Schema に変換して渡す */ },
        strict: true,
      },
    },
  });

  const raw = JSON.parse(response.output_text);
  const validation = validateWebSupplementResult({ ...raw, companyName });
  if (!validation.ok) {
    throw new Error(`validation_failed: ${validation.error}`);
  }
  return validation.result;
}
```

> **注意**: Responses API の正確なインターフェース・`text.format` の指定方法は実装時に最新の OpenAI 公式 docs で確認すること。
> 上記コードは設計意図を示す**擬似コード**であり、そのままコンパイルできるとは限らない。

### 2. `app/api/web-supplement/route.ts` を新規作成する

```ts
import { NextResponse } from "next/server";
import { fetchWebSupplement } from "@/lib/server/webSupplement";
import type { ApiErrorBody } from "@/lib/openai/contracts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ApiErrorBody>(
      { error: { code: "invalid_input", message: "リクエストの形式が正しくありません。" } },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).companyName !== "string" ||
    !(body as Record<string, unknown>).companyName
  ) {
    return NextResponse.json<ApiErrorBody>(
      { error: { code: "invalid_input", message: "企業名を入力してください。" } },
      { status: 400 },
    );
  }

  const { companyName } = body as { companyName: string };

  try {
    const result = await fetchWebSupplement(companyName);
    const provider = process.env.WEB_SUPPLEMENT_PROVIDER ?? (process.env.OPENAI_API_KEY ? "openai" : "dummy");
    return NextResponse.json({ result, provider });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("company_not_found")) {
      return NextResponse.json<ApiErrorBody>(
        { error: { code: "company_not_found", message: "企業情報を取得できませんでした。企業名を確認してください。" } },
        { status: 404 },
      );
    }
    if (message.startsWith("validation_failed")) {
      return NextResponse.json<ApiErrorBody>(
        { error: { code: "validation_failed", message: "取得した情報の検証に失敗しました。" } },
        { status: 500 },
      );
    }
    // rate_limited / timeout / provider_error
    return NextResponse.json<ApiErrorBody>(
      { error: { code: "provider_error", message: "情報の取得中にエラーが発生しました。しばらくしてからお試しください。" } },
      { status: 502 },
    );
  }
}
```

### 3. `src/lib/webSupplementClient.ts` を新規作成する

```ts
import type { WebSupplementResult } from "./webSupplement/schema";
import type { ApiErrorBody, LlmProvider } from "./openai/contracts";

export interface WebSupplementApiResponse {
  result: WebSupplementResult;
  provider: LlmProvider;
}

export async function fetchWebSupplementFromApi(
  companyName: string,
): Promise<WebSupplementApiResponse> {
  const response = await fetch("/api/web-supplement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ companyName }),
  });

  if (!response.ok) {
    const errBody = (await response.json()) as ApiErrorBody;
    throw new Error(errBody.error.message);
  }

  return response.json() as Promise<WebSupplementApiResponse>;
}
```

### 4. エラーハンドリング方針

| 状況 | エラーコード | HTTP |
| --- | --- | --- |
| 企業名が空 / 型不正 | `invalid_input` | 400 |
| 企業情報が見つからない | `company_not_found` | 404 |
| LLM 出力検証失敗 | `validation_failed` | 500 |
| OpenAI レート制限 | `rate_limited` | 429 |
| タイムアウト | `timeout` | 504 |
| その他 OpenAI エラー | `provider_error` | 502 |

### 5. `.env.example` への追記（#41 でまだ追記されていない場合）

```env
# Web supplement provider switch / model (Phase 8)
WEB_SUPPLEMENT_PROVIDER=
WEB_SUPPLEMENT_MODEL=
```

## 変更が想定されるファイル

- `src/lib/server/webSupplement.ts`（新規）
- `app/api/web-supplement/route.ts`（新規）
- `src/lib/webSupplementClient.ts`（新規）
- `.env.example`（#41 で追記されていない場合のみ）

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 補足情報に出典が必ず付く | `WebSupplementItem.sourceUrl` / `.retrievedAt` は必須フィールド。zod でバリデーションしてから返す |
| 紙メモ由来情報と混ざらない | API ルートは `WebSupplementResult` のみを返す。`BriefingNote` / `CompanyMemoStructured` と型を分離 |
| 不確実情報は要確認として扱われる | `WebSupplementItem.needsVerification` フラグを LLM に判定させ、zod で検証してから返す |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

テスト方針:

- `fetchWebSupplement` のテストはプロバイダーをダミー固定（env 注入）で実行し、実 OpenAI キーを必要としない。
- API ルートのテストは `fetchWebSupplement` をモックして入力バリデーションとエラーハンドリングを検証する。
- クライアント(`webSupplementClient.ts`)のテストは `fetch` をモックして正常系・エラー系を検証する。

## リスク / 不明点

- **Responses API + web_search_preview + Structured Outputs の組み合わせ**: 実装時に最新 OpenAI docs でインターフェースを確認する。対応していない場合は `chat.completions.create` + `response_format: { type: "json_schema" }` + 別途 fetch に分割する設計も選択肢。
- **モデル名**: `gpt-4o-mini-search-preview` 等は暫定名。実装時に確認し `WEB_SUPPLEMENT_MODEL` 環境変数経由で設定する。
- **コスト**: Web 検索付き呼び出しは 1 回で完結するよう設計し、再検索は最小限にする。
- **timeoutハンドリング**: OpenAI の web 検索は通常の completion より遅い場合がある。タイムアウトを設定し `timeout` エラーに写像する。
