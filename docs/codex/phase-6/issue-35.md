# Issue #35 設計: Structured Outputs / JSON Schema を定義する

対象 GitHub Issue: #35(`docs/generated-issues/06-03-structured-outputs-json-schema-を定義する.md`)
Phase: 6 / 優先度: High / 実装順: **3 番目**(依存上は #33 完了後に #34 と並行可)
依存: #33(契約・プロバイダー判定)、#04-01(`BriefingNote` 型)

## Issue 概要

OCR 結果を直接 Markdown 化せず、企業研究用の**構造化 JSON(CompanyMemo)** に変換する。
JSON Schema(zod)を定義し、Structured Outputs で生成した LLM 出力を検証してから、決定的に Markdown を組み立てる。
事実・所感・要確認を分離する(`docs/output-format.md` 準拠)。純粋ロジックが中心で、サンプル OCR テキストにより単体テストできる。

## スコープ

- `CompanyMemoStructured` の JSON Schema(zod)を定義する。
- 事実 / HR 強調点 / 印象 / 気になった点 / 質問 / ES 材料 などをフィールドで分離する。
- 不確実情報を `要確認` として表現できるようにする。
- LLM 出力(JSON)を Markdown 化する**前に**検証する(`validation_failed`)。
- 構造化 JSON → Markdown の決定的な純粋関数を実装する。
- `POST /api/structure` ルートを実装し、プロバイダー切替(ダミー/実)に対応する。
- クライアント([BriefingNoteFlow.tsx](../../../src/components/BriefingNoteFlow.tsx))を `/api/structure` 接続に置き換える。

## スコープ外

- OCR 取得(#34)。
- エラー分類の網羅・コスト docs・ログ秘匿(#36)。
- Web 由来情報の統合(Phase 8)、企業比較データ構造(Phase 9)。

## 共有設計判断(Phase 計画より)

- スキーマのセクション構成は `docs/output-format.md` のセクションと 1:1 で対応させる。
- 構造化 JSON → Markdown は決定的(同じ JSON → 同じ Markdown)。`src/lib/markdown.ts` の `fenceFor` 等を再利用。
- 読み取れない項目は空配列または `要確認` にフォールバックし、捏造しない(`AGENTS.md` LLM Output Rules)。
- プロバイダー判定は #33 の `getStructureProvider()`。OpenAI 呼び出しはサーバー専用レイヤーのみ。

## 実装ステップ

1. `zod` を `dependencies` に追加する。

2. スキーマ `src/lib/structure/schema.ts` を定義する(`output-format.md` のセクションに対応)。

   ```ts
   import { z } from "zod";

   export const companyMemoSchema = z.object({
     overview: z.object({
       companyName: z.string(),   // 読み取れなければ "要確認"
       eventName: z.string(),
       eventDate: z.string(),
       speakers: z.string(),
     }),
     facts: z.array(z.string()),            // 説明会で得た事実
     emphasizedPoints: z.array(z.string()), // HR・社員が強調していた点
     business: z.array(z.string()),         // 事業内容
     strengths: z.array(z.string()),        // 強み・特徴
     idealCandidate: z.array(z.string()),   // 求める人物像
     impressions: z.array(z.string()),      // 自分の印象・感じたこと
     concerns: z.array(z.string()),         // 気になった点
     questions: z.array(z.string()),        // 次に聞きたい質問
     esPoints: z.array(z.string()),         // ES・面接で使えそうな材料
     nextResearch: z.array(z.string()),     // 次に調べること
   });

   export type CompanyMemoStructured = z.infer<typeof companyMemoSchema>;
   ```

   - 事実 / 印象 / 強調点を別フィールドにし、混在を構造的に防ぐ。
   - 「自分の印象」「ES 材料」は OCR から断定できないため、LLM には**空配列許容**(ユーザーが後で編集)を許す。

3. 検証 `src/lib/structure/validate.ts` を実装する。

   ```ts
   import { companyMemoSchema, type CompanyMemoStructured } from "./schema";

   export type ValidateResult =
     | { ok: true; memo: CompanyMemoStructured }
     | { ok: false; code: "validation_failed" };

   export function validateCompanyMemo(value: unknown): ValidateResult {
     const parsed = companyMemoSchema.safeParse(value);
     return parsed.success
       ? { ok: true, memo: parsed.data }
       : { ok: false, code: "validation_failed" };
   }
   ```

4. 構造化 → Markdown の純粋関数 `src/lib/structure/toMarkdown.ts` を実装する。

   - `docs/output-format.md` の基本テンプレートに沿って、各セクションを配列から箇条書きに展開する。
   - 空配列のセクションは `要確認` 等のプレースホルダを 1 行入れる(空セクションにしない)。
   - 元メモ抜粋は OCR テキストをコードフェンスで囲む(`markdown.ts` の `fenceFor` を共通利用)。
   - 既存 `buildMarkdownTemplate`(テンプレ骨格)と整合させ、骨格を二重定義しない(共通化または委譲)。

5. ダミー構造化 `src/lib/structure/dummyStructure.ts` を実装する。

   - サンプル OCR(`DEMO_OCR_TEXT`)と入力情報から、決定的に `CompanyMemoStructured` を返す。
   - プロバイダー = `dummy` 時に使う。実 API キーなしでフロー全体を通せるようにする。

6. 構造化プロバイダー境界 `src/lib/server/structure.ts` を実装する。

   ```ts
   import type { CompanyEventInfo } from "../types";
   import type { CompanyMemoStructured } from "../structure/schema";
   import { getStructureProvider } from "../openai/provider";

   export async function runStructure(
     ocrText: string,
     info: CompanyEventInfo,
   ): Promise<CompanyMemoStructured> {
     if (getStructureProvider() === "dummy") {
       return buildDummyStructure(ocrText, info);
     }
     return runOpenAiStructure(ocrText, info); // Structured Outputs + validate
   }
   ```

   - 実構造化は OpenAI の Structured Outputs(JSON Schema / `companyMemoSchema` に対応)で生成し、`validateCompanyMemo` で検証。検証失敗は `validation_failed` を投げる。
   - モデルは `OPENAI_STRUCTURE_MODEL`(未設定時コード内既定)。実装時に最新 docs で Structured Outputs の指定方法を確認する。
   - プロンプトに「OCR にない事実を作らない」「不確実は `要確認`」「印象・ES 材料は空配列可」を明示する。

7. `app/api/structure/route.ts` を実装する(`runtime = "nodejs"`)。

   - 入力 `{ ocrText, companyEventInfo }` を検証(空 / 不正 → `invalid_input`)。
   - `runStructure` を呼び、`{ memo, provider }` を返す。検証失敗 → `validation_failed`、未設定 → `not_configured`。
   - OCR 全文・生成内容をログに出さない。

8. クライアント接続。
   - `src/lib/structureClient.ts`: `requestStructure(ocrText, info)` で `/api/structure` を呼ぶ。
   - [BriefingNoteFlow.tsx](../../../src/components/BriefingNoteFlow.tsx) の `handleGenerateMarkdown` を、`requestStructure` → `toMarkdown(memo, { ocrText, info })` に置き換える。
   - 編集済み(`isMarkdownDirty`)なら再生成で上書きしない既存挙動を維持する。
   - 失敗時は `setHasGenerationError(true)` + 安全メッセージ。

9. テストを追加する(実 API キー不要)。
   - `schema` / `validate`: 正常 JSON 通過、欠落・型不一致で `validation_failed`。
   - `toMarkdown`: 各セクション展開、空配列のフォールバック、`output-format.md` 整合、決定性。
   - `dummyStructure`: サンプルから決定的に構造化されること。

## 変更が想定されるファイル

- `package.json`(`zod` 追加)
- `src/lib/structure/schema.ts` / `validate.ts` / `toMarkdown.ts` / `dummyStructure.ts`(新規)
- `src/lib/server/structure.ts`(新規)
- `app/api/structure/route.ts`(新規)
- `src/lib/structureClient.ts`(新規)
- `src/components/BriefingNoteFlow.tsx`(`/api/structure` 接続に置き換え)
- `src/lib/markdown.ts`(`fenceFor` 等の共通利用 / テンプレ骨格の共通化)
- 関連テスト(新規)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| LLM 出力の JSON Schema が定義されている | `src/lib/structure/schema.ts` の `companyMemoSchema`(`output-format.md` セクション対応) |
| 不確実情報が要確認として表現される | 読み取れない項目を `要確認` / 空配列に倒す。`toMarkdown` で空セクションを `要確認` プレースホルダ化 |
| Markdown 生成前に構造化データを検証できる | `validateCompanyMemo` で検証してから `toMarkdown`。検証失敗時は Markdown を組み立てない |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## リスク / 不明点

- **Structured Outputs の指定方法**: モデル / JSON Schema の渡し方は実装時に最新 docs で確認。zod スキーマと JSON Schema の対応を取る。
- **テンプレ二重定義**: `buildMarkdownTemplate`(Phase 4)と `toMarkdown` で骨格が重複しやすい → 骨格を共通化し、出力を `output-format.md` と一致させる。
- **空入力 / 読み取り不能**: OCR が薄い場合でも捏造しない。空配列 → `要確認` フォールバックで一貫させる。
- **検証失敗の扱い**: LLM が不正 JSON を返したら Markdown を作らず `validation_failed`。UI メッセージは #36 で整える。
- **#34 との順序**: 依存は #33 のみ。`DEMO_OCR_TEXT` を入力にすれば #34 完了前でも単体実装・テスト可能。
