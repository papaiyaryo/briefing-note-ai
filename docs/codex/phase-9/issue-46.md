# Issue #46 設計: 面接前復習モードと ES 接続ポイント生成を実装する

対象 GitHub Issue: #46(`docs/generated-issues/09-03-面接前復習モードと-es-接続ポイント生成を実装する.md`)
Phase: 9 / 優先度: Low

## Issue 概要

面接直前に見返す「志望理由・逆質問・企業理解・自分との接点(ES 接続ポイント)」を、既存の構造化企業メモ(`CompanyMemoStructured`)から短く整理して表示し、復習用 Markdown として書き出す機能を追加する。
ユーザーの判断を置き換える機能ではなく、既にメモにある情報の**整理・言語化支援**であることを前提にする(AGENTS.md の LLM 出力ルール、Notes 「ユーザーの判断を置き換えず、整理を支援する」に従う)。

## 依存関係の現状と本設計の前提

Issue 本文は「Depends on #09-01(#44)」としているが、確認したところ **#44(企業比較用データ構造)・#45(比較テーブル・志望度メモ)は未実装**(Issue のまま、PR/実装なし)。

面接前復習は 1 社ごとの復習ビューであり、複数社比較のためのデータ構造(#44)そのものには依存しない。実際に欲しいのは #44/#45 が定義予定の「志望度メモ(自由記述の志望理由)」のような**将来追加されるかもしれない任意フィールド**だけである。そこで本設計は次の方針で #44/#45 と切り離す。

- 入力は既存の `CompanyMemoStructured`(`src/lib/structure/schema.ts`)と、任意で採用済み `WebSupplementItem[]` のみを必須依存とする。
- 「志望理由」は、#44/#45 で `motivationMemo`(仮称)のようなユーザー入力フィールドが追加された場合はそれを最優先で使う設計にしておくが、無くても動作するように **`esPoints` / `impressions` / `strengths` からの抽出フォールバック**を用意する。
- そのため #46 は #44/#45 の実装を待たずに着手可能。ただし `motivationMemo` フィールドが #44/#45 でどう命名・実装されるかは human confirm が必要(下記「要確認事項」参照)。AGENTS.md の competing-source ルールに従い、命名や型が #44/#45 の実装と食い違った場合は Codex 実装前に human に確認する。

## スコープ(Issue 本文どおり)

- 面接前復習ビュー(志望理由・逆質問・企業理解・自分との接点の 4 区分)を実装する
- 逆質問候補を、既存メモの `questions` / `concerns` / `nextResearch` などから整理する
- ES 接続ポイント(自分との接点)を `esPoints` / `impressions` から整理し、不足時は LLM で候補を補う
- 不確実情報(LLM 推測・未確認)には `要確認` を付ける
- 復習用 Markdown を出力できるようにする

## スコープ外(Issue 本文どおり)

- 面接日程管理
- カレンダー連携
- 複数企業の比較(#44 / #45 の範囲)
- 本文 Markdown(`docs/output-format.md` のテンプレート)自体の変更 — 復習用 Markdown は**別ファイル**として出力し、既存の説明会メモ Markdown 構造は変更しない

## データモデル設計

`src/lib/interviewReview/schema.ts`(新規、`webSupplement/schema.ts` と同じ zod + JSON Schema 併記パターン)

```ts
import { z } from "zod";

export const interviewReviewItemSchema = z.object({
  content: z.string().min(1),
  basis: z.string(), // どのメモ情報に基づくかの根拠(空なら "要確認" 扱い)
  confidence: z.enum(["confirmed", "requires_check"]),
});

export const interviewReviewSchema = z.object({
  motivationPoints: z.array(interviewReviewItemSchema), // 志望理由
  reverseQuestions: z.array(interviewReviewItemSchema), // 逆質問候補
  companyUnderstanding: z.array(interviewReviewItemSchema), // 企業理解
  selfConnectionPoints: z.array(interviewReviewItemSchema), // 自分との接点(ES接続ポイント)
});

export type InterviewReviewItem = z.infer<typeof interviewReviewItemSchema>;
export type InterviewReviewStructured = z.infer<typeof interviewReviewSchema>;
```

対応する `interviewReviewJsonSchema`(`companyMemoJsonSchema` と同様に `additionalProperties: false` + `required` を全プロパティに付与)も同ファイルに定義する。

`confidence` の意味:

| 値 | 意味 |
| --- | --- |
| `confirmed` | 元メモ(`facts` / `esPoints` など)に明記されている内容をそのまま整理したもの |
| `requires_check` | LLM が推測・補完した候補、または元メモの情報が薄く断定できないもの |

`basis` は「どのセクション由来か」を短く残す(例: `esPoints`, `impressions`, `concerns`, `LLM補完`)。UI・Markdown 双方で出典表示に使う。

## 生成ロジック方針(dummy / openai)

Phase 6・Phase 8 と同じ「provider 切替 + dummy 決定的実装」パターンに揃える。

### dummy(`src/lib/interviewReview/dummyInterviewReview.ts`)

ネットワーク呼び出しなし。既存メモ配列を機械的に並び替えるだけで、**新規内容は生成しない**。

- `motivationPoints`: `esPoints` と `impressions` から抽出。空なら `[{ content: "要確認", basis: "", confidence: "requires_check" }]`
- `reverseQuestions`: `questions` をそのまま `confirmed` として採用
- `companyUnderstanding`: `facts` + `business` + `strengths` + `idealCandidate` + 採用済み `webSupplements` を集約
- `selfConnectionPoints`: `esPoints` をそのまま採用

### openai(`src/lib/server/interviewReview.ts`)

`server/webSupplement.ts` と同型の実装(`OPENAI_INTERVIEW_REVIEW_MODEL` 環境変数、`json_schema` strict、`AbortController` によるタイムアウト)。

プロンプト方針(AGENTS.md「LLM Output Rules」準拠):

- 入力は `CompanyMemoStructured` 全体 + 採用済み `webSupplements` + (あれば)`motivationMemo` のみ。それ以外の企業情報を知っている前提で補完させない
- 逆質問候補は `concerns` / `nextResearch` / `business` を根拠に**新規提案してよい**が、必ず `confidence: "requires_check"` を付ける
- 自分との接点(ES 接続ポイント)は `esPoints` / `impressions` / `strengths` の再構成を優先し、それらが薄い場合のみ LLM が候補を補う(その場合も `requires_check`)
- 企業情報を捏造しない、断定しない、メモにない事実を作らない
- 出力は `interviewReviewJsonSchema` に厳密準拠(`strict: true`)

Provider 切替は既存の `src/lib/openai/provider.ts` に追加する。

```ts
export function getInterviewReviewProvider(env = process.env): LlmProvider {
  return resolveProvider(env.INTERVIEW_REVIEW_PROVIDER, Boolean(env.OPENAI_API_KEY));
}
```

`.env.example` に追記:

```env
INTERVIEW_REVIEW_PROVIDER=
OPENAI_INTERVIEW_REVIEW_MODEL=
```

## API 設計

`src/lib/openai/contracts.ts` に追記(既存 `ApiErrorCode` を再利用、新規コード追加は不要)。

```ts
export interface InterviewReviewApiRequest {
  memo: CompanyMemoStructured;
  webSupplements?: WebSupplementItem[];
  motivationMemo?: string; // #44/#45 で追加され次第つなぐ任意フィールド
}

export interface InterviewReviewApiResponse {
  review: InterviewReviewStructured;
  provider: LlmProvider;
}
```

ルート: `POST /api/interview-review`(`app/api/interview-review/route.ts`、既存の `/api/structure`・`/api/web-supplement` ルートと同じエラーハンドリング方針)。

## UI 設計

新規コンポーネント `src/components/InterviewReviewView.tsx`(ステップウィザードの一部にはせず、Markdown 生成完了後にモーダル/別ビューとして開く想定。ステップ番号を持たない独立ビューにすることで、メイン MVP フロー(Step 1〜3)や Web 補足ステップの番号付けに影響を与えない)。

- 4 セクション(志望理由 / 逆質問候補 / 企業理解 / 自分との接点)をカード表示
- 各項目に `WebSupplementStep` と同じ見た目の信頼度バッジ(`確認済み` / `要確認`)と `basis` を小さく表示
- 生成中は `isLoading` 表示(`WebSupplementStep` のローディング文言パターンを踏襲)
- フッターに「復習用 Markdown を出力」ボタン(`downloadMarkdownFile` を再利用)
- エントリーポイント: `BriefingNoteFlow.tsx` の Markdown 編集ステップ完了後に「面接前復習を見る」ボタンを追加(未生成なら生成 API を呼ぶ、生成済みならキャッシュを表示)

## Markdown 出力設計

`src/lib/interviewReview/toMarkdown.ts` に `toInterviewReviewMarkdown(review, companyName)` を新規実装。既存 `output-format.md` のテンプレートは変更せず、**復習専用の別ファイル**として出力する。

```md
# {{企業名}} 面接前復習

## 志望理由
- {{content}}（要確認）※ requires_check の場合のみ末尾に付与

## 逆質問候補
- {{content}}

## 企業理解
- {{content}}

## 自分との接点（ES 接続ポイント）
- {{content}}
```

ファイル名は `src/lib/download.ts` の `buildMarkdownDownloadFileName` と同じ sanitize ロジックを再利用し、`{{企業名}}-interview-review.md` 形式の専用ヘルパー `buildInterviewReviewFileName` を追加する(既存関数の改修ではなく新規関数で分離し、MVP のダウンロード仕様に影響を与えない)。

## 変更が想定されるファイル

- `src/lib/interviewReview/schema.ts`(新規)
- `src/lib/interviewReview/dummyInterviewReview.ts`(新規)
- `src/lib/interviewReview/toMarkdown.ts`(新規)
- `src/lib/interviewReview/validate.ts`(新規、`webSupplement/validate.ts` と同型)
- `src/lib/server/interviewReview.ts`(新規)
- `src/lib/openai/contracts.ts`(追記)
- `src/lib/openai/provider.ts`(追記)
- `src/lib/download.ts`(`buildInterviewReviewFileName` 追加)
- `app/api/interview-review/route.ts`(新規)
- `src/components/InterviewReviewView.tsx`(新規)
- `src/components/BriefingNoteFlow.tsx`(エントリーポイントのボタン追加)
- `.env.example`(追記)
- テスト: `dummyInterviewReview.test.ts` / `toMarkdown.test.ts` / `validate.test.ts` / `provider.test.ts` への追記

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 志望理由・逆質問・企業理解・自分との接点が確認できる | `InterviewReviewStructured` の 4 フィールド + `InterviewReviewView` の 4 セクション |
| 不確実情報は要確認として表示される | `confidence: "requires_check"` + UI バッジ + Markdown 末尾 `（要確認）` 表記 |
| 復習用 Markdown を出力できる | `toInterviewReviewMarkdown` + `downloadMarkdownFile` + `buildInterviewReviewFileName` |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## リスク・要確認事項(human 確認が必要)

1. **「志望理由」の入力源**: #44/#45 の「志望度メモ」フィールドが未確定のため、本設計では `motivationMemo?: string` という仮の型・フォールバック抽出(`esPoints`/`impressions`)で暫定設計している。#44/#45 の実装が先に確定した場合、フィールド名・型が変わる可能性がある。実装着手前に human に確認する。
2. **実装順序**: #44 → #45 → #46 の順が Phase 9 の想定順(roadmap.md)。#46 を先に実装する場合、#44/#45 とのフィールド名の食い違いが生じ得るため、Codex 実装時に一度 human 確認を挟む運用を推奨する。
3. **復習ビューの導線**: メインステップフローに組み込むか、独立ビュー(モーダル/別ページ)にするかは UI 設計判断。本設計では独立ビュー(既存ステップ番号に影響させない)を採用したが、UX 上ステップに組み込みたい場合は再設計が必要。
4. **LLM 補完の許容範囲**: 逆質問・自分との接点で「メモにない新規候補」をどこまで LLM に提案させてよいかは、AGENTS.md の「企業情報を捏造しない」原則とのバランスが必要。本設計では常に `requires_check` を付ける前提としたが、ユーザー体験として妥当か human レビューが必要。
