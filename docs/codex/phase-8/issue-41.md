# Issue #41 設計: Web 補足機能の仕様と取得方針を整理する

対象 GitHub Issue: #41（`docs/generated-issues/08-01-web-補足機能の仕様と取得方針を整理する.md`）
Phase: 8 / 優先度: Low / 実装順: **1 番目（基盤）**

## Issue 概要

Phase 8 全体の土台として、Web 補足機能の**取得方針・出典管理ルール・信頼度基準・型定義・ダミー実装**を確立する。
GitHub Issue の Out of Scope に「Web スクレイピング実装」が含まれるため、**この Issue ではネットワーク呼び出しを実装しない**。
成果物は方針ドキュメント・型定義（zod スキーマ）・ダミー実装・プロバイダー判定関数に限る。

## スコープ

- `docs/web-supplement.md` を新規作成し、取得方針・出典管理・信頼度基準を定義する。
- `src/lib/webSupplement/schema.ts` に `WebSupplementItem` / `WebSupplementResult` 型と zod スキーマを定義する。
- `src/lib/webSupplement/validate.ts` に zod を使った検証関数を定義する。
- `src/lib/webSupplement/dummy.ts` にダミー実装（サンプルデータ）を定義する。
- `src/lib/webSupplement/toMarkdown.ts` に採用済み補足 → Markdown 変換の純粋関数を定義する。
- `src/lib/openai/provider.ts` に `getWebSupplementProvider()` を追加する。
- `src/lib/openai/contracts.ts` の `ApiErrorCode` に `"company_not_found"` を追加する。
- `.env.example` に Phase 8 で使う変数を追記する。

## スコープ外

- Web fetch / OpenAI API 呼び出し（#42）。
- API ルート `POST /api/web-supplement`（#42）。
- フロントエンド確認 UI・Markdown 統合（#43）。

## 共有設計判断（Phase 計画より）

- 入力は企業名のみ（個人情報・OCR テキストは送らない）。
- `confidence: "high"` は公式サイト・採用ページ、`"medium"` はプレスリリース・ニュース、`"low"` はその他。
- `needsVerification = true`: confidence が medium 以下、または非公式ソース。
- Web 情報と紙メモ由来情報は常に分離して管理する（型レベルで混在させない）。
- プロバイダー切替: `WEB_SUPPLEMENT_PROVIDER` 環境変数（`"dummy"` | `"openai"`）と `OPENAI_API_KEY` で判定。

## 実装ステップ

1. `docs/web-supplement.md` を新規作成し、以下を記述する。
   - 取得対象の優先順位（公式サイト > 採用ページ > プレスリリース > その他）
   - 出典 URL・取得日の管理ルール
   - 信頼度（`high` / `medium` / `low`）と `needsVerification` の判定基準
   - 紙メモ由来情報との分離方針
   - ユーザー確認フロー概要（採用 / 却下 → 採用のみ Markdown に追記）
   - MVP 外機能であることの明記

2. `src/lib/webSupplement/schema.ts` を新規作成する。

   ```ts
   import { z } from "zod";

   export const WebSupplementSourceTypeSchema = z.enum([
     "official",
     "career",
     "news",
     "other",
   ]);
   export type WebSupplementSourceType = z.infer<typeof WebSupplementSourceTypeSchema>;

   export const WebSupplementConfidenceSchema = z.enum(["high", "medium", "low"]);
   export type WebSupplementConfidence = z.infer<typeof WebSupplementConfidenceSchema>;

   export const WebSupplementItemSchema = z.object({
     id: z.string().min(1),
     content: z.string().min(1),
     sourceUrl: z.string().url(),
     retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
     sourceType: WebSupplementSourceTypeSchema,
     confidence: WebSupplementConfidenceSchema,
     needsVerification: z.boolean(),
     category: z.string().min(1),
   });
   export type WebSupplementItem = z.infer<typeof WebSupplementItemSchema>;

   export const WebSupplementResultSchema = z.object({
     companyName: z.string().min(1),
     items: z.array(WebSupplementItemSchema),
   });
   export type WebSupplementResult = z.infer<typeof WebSupplementResultSchema>;
   ```

3. `src/lib/webSupplement/validate.ts` を新規作成する。

   ```ts
   import { WebSupplementResultSchema } from "./schema";
   import type { WebSupplementResult } from "./schema";

   export type ValidationSuccess = { ok: true; result: WebSupplementResult };
   export type ValidationFailure = { ok: false; error: string };
   export type ValidationOutcome = ValidationSuccess | ValidationFailure;

   export function validateWebSupplementResult(raw: unknown): ValidationOutcome {
     const parsed = WebSupplementResultSchema.safeParse(raw);
     if (!parsed.success) {
       return { ok: false, error: parsed.error.message };
     }
     return { ok: true, result: parsed.data };
   }
   ```

4. `src/lib/webSupplement/dummy.ts` を新規作成する（サンプルデータ、ネットワーク呼び出しなし）。

   ```ts
   import type { WebSupplementResult } from "./schema";

   export function buildDummyWebSupplementResult(companyName: string): WebSupplementResult {
     return {
       companyName,
       items: [
         {
           id: "ws-001",
           content: `${companyName}は、テクノロジーを活用した事業展開を行っています。（ダミーデータ）`,
           sourceUrl: "https://example.com/about",
           retrievedAt: "2025-01-01",
           sourceType: "official",
           confidence: "high",
           needsVerification: false,
           category: "事業内容",
         },
         {
           id: "ws-002",
           content: `${companyName}の採用情報: 新卒・中途採用を通年実施しています。（ダミーデータ）`,
           sourceUrl: "https://careers.example.com",
           retrievedAt: "2025-01-01",
           sourceType: "career",
           confidence: "medium",
           needsVerification: true,
           category: "採用情報",
         },
       ],
     };
   }
   ```

5. `src/lib/webSupplement/toMarkdown.ts` を新規作成する（採用された `WebSupplementItem[]` → Markdown セクション変換、純粋関数）。

   ```ts
   import type { WebSupplementItem } from "./schema";

   export function buildWebSupplementMarkdown(items: WebSupplementItem[]): string {
     if (items.length === 0) return "";

     const header = [
       "## Web補足情報（出典付き）",
       "",
       "> **注意**: 以下は Web から取得した参考情報です。説明会メモとは独立して記載しています。",
       "> 情報の正確性はご自身で確認してください。",
       "",
     ].join("\n");

     const sections = items
       .map((item) => {
         const verificationMark = item.needsVerification ? "\n<!-- 要確認 -->" : "";
         return [
           `### ${item.category}`,
           verificationMark,
           item.content,
           `> 出典: ${item.sourceUrl}（取得日: ${item.retrievedAt}）`,
         ]
           .filter(Boolean)
           .join("\n");
       })
       .join("\n\n");

     return header + sections;
   }
   ```

6. `src/lib/openai/provider.ts` に `getWebSupplementProvider()` を追加する。

   ```ts
   export function getWebSupplementProvider(env = process.env): LlmProvider {
     return resolveProvider(env.WEB_SUPPLEMENT_PROVIDER, Boolean(env.OPENAI_API_KEY));
   }
   ```

7. `src/lib/openai/contracts.ts` の `ApiErrorCode` に `"company_not_found"` を追加する。

8. `.env.example` に以下を追記する。

   ```env
   # Web supplement provider switch / model (Phase 8)
   WEB_SUPPLEMENT_PROVIDER=
   WEB_SUPPLEMENT_MODEL=
   ```

9. 各純粋関数の単体テストを追加する。
   - `src/lib/webSupplement/validate.test.ts`
   - `src/lib/webSupplement/toMarkdown.test.ts`
   - `src/lib/webSupplement/dummy.test.ts`
   - `src/lib/openai/provider.ts` の `getWebSupplementProvider()` を既存テストに追加

## 変更が想定されるファイル

- `docs/web-supplement.md`（新規）
- `src/lib/webSupplement/schema.ts`（新規）
- `src/lib/webSupplement/validate.ts`（新規）
- `src/lib/webSupplement/validate.test.ts`（新規）
- `src/lib/webSupplement/dummy.ts`（新規）
- `src/lib/webSupplement/dummy.test.ts`（新規）
- `src/lib/webSupplement/toMarkdown.ts`（新規）
- `src/lib/webSupplement/toMarkdown.test.ts`（新規）
- `src/lib/openai/provider.ts`（`getWebSupplementProvider()` 追加）
- `src/lib/openai/provider.test.ts`（`getWebSupplementProvider()` のテスト追加）
- `src/lib/openai/contracts.ts`（`"company_not_found"` 追加）
- `.env.example`（Phase 8 変数を追記）

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| Web 由来情報と紙メモ由来情報の分離方針がある | `docs/web-supplement.md`・型定義で分離を明記 |
| 出典と取得日を残す仕様がある | `WebSupplementItem.sourceUrl` / `.retrievedAt` フィールド |
| MVP 外機能として整理されている | `docs/web-supplement.md` に明記 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## リスク / 不明点

- zod の `z.string().url()` は `http://` または `https://` を必須とする。ダミーデータが通ることを確認する。
- `toMarkdown` の Markdown フォーマットは #43 の UI 実装と整合させること。変更が必要な場合は #43 で調整する。
- `ApiErrorCode` への追加は #42 の API ルート実装と矛盾しないこと。
