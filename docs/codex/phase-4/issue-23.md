# Issue #23 設計: Markdown 生成ロジックを UI から分離して実装する

対象 GitHub Issue: #23(`docs/generated-issues/04-02-markdown-生成ロジックを-ui-から分離して実装する.md`)
Phase: 4 / 優先度: High / 実装順: **2 番目**
依存: #22(型)、#00-01(`docs/output-format.md`)

## Issue 概要

OCR テキストと入力情報から企業研究向け Markdown を生成する **純粋ロジック** を、UI から独立した
関数として整備する。LLM 導入前の deterministic な生成を確立する。

既に `src/lib/markdown.ts` に `buildMarkdownTemplate` が存在し UI 非依存で動いているため、
本 Issue は **新規作成ではなく、型付き入力への整理と output-format.md 整合の確認** が中心になる。

## スコープ

- `buildMarkdownTemplate` の入力を #22 の型に沿って整理する。
- 不明情報を `要確認` / `不明` として扱うルールを徹底する(`orPending` の方針を維持・明文化)。
- UI(`BriefingNoteFlow.tsx`)が lib 関数を呼ぶだけになるようにし、ロジックの二重定義を残さない。
- `docs/output-format.md` のテンプレートと節構成が一致していることを再確認する。

## スコープ外

- OpenAI API 呼び出し、LLM による内容生成(Phase 6)。
- Web 補足情報の統合(Phase 8)。
- プレビュー用パーサー `parseMarkdownBlocks` の仕様変更(現状維持)。

## 共有設計判断(Phase 計画より)

- 生成は決定的(同じ入力 → 同じ出力)。ネットワーク不使用。
- LLM 相当の「内容の創作」はしない。テンプレート + 既知情報(企業名・イベント・日時・画像名・OCR 抜粋)の差し込みに留める。
- セクションのプレースホルダ(箇条書きの雛形行)はユーザーが後で埋める前提で残す。

## 実装ステップ

1. 生成関数のシグネチャを #22 の型に揃える。`MarkdownTemplateInput` を維持しつつ、
   `BriefingNote` の部分集合から組み立てられるようにする(`CompanyEventInfo` + `ocrText` + `imageFileName`)。

   ```ts
   export interface MarkdownTemplateInput {
     companyName?: string;
     eventName?: string;
     eventDate?: string;
     imageFileName?: string;
     ocrText?: string;
   }
   export function buildMarkdownTemplate(input?: MarkdownTemplateInput): string;
   ```

2. `orPending`(空 → `要確認`)を維持し、未読取セクションは雛形プレースホルダ行を残す方針を
   コメントで明文化する。OCR 抜粋は `要確認` ではなく `(OCR 結果なし)` を保つ。
3. `docs/output-format.md` の基本テンプレートと、生成結果の見出し順・項目を突き合わせる。
   差異があれば **output-format.md を正としてコードを合わせる**(ドキュメントを勝手に変えない)。
4. `BriefingNoteFlow.tsx` の `handleGenerateMarkdown` が `buildMarkdownTemplate` を呼ぶだけに保たれているか確認し、
   ロジックがコンポーネント側に漏れていないことを保証する。
5. 生成ロジックの基本テストを `src/lib/markdown.test.ts` に追加する(後述)。

## 変更が想定されるファイル

- `src/lib/markdown.ts`(入力型の整理、コメント明文化、必要なら微修正)
- `src/lib/markdown.test.ts`(新規・基本テスト)
- `src/components/BriefingNoteFlow.tsx`(呼び出し整合の確認。大きな変更は不要)

## テスト方針(基本ケースのみ。網羅は Phase 5)

- 企業名あり: `# {企業名}` と概要セクションに反映される。
- 企業名/イベント/日時が空: 該当箇所が `要確認` になる。
- OCR テキストあり: 「元メモからの抜粋」に含まれる。OCR 空: `(OCR 結果なし)`。
- OCR に存在しない事実を断定する文字列を出力しない(雛形プレースホルダのみ)。
- バッククォートを含む OCR テキストでコードフェンスが壊れない(既存 `fenceFor` の回帰確認)。

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 生成ロジックが UI に依存していない | `src/lib/markdown.ts` の純粋関数、UI は呼ぶだけ |
| `docs/output-format.md` と整合している | ステップ3で突き合わせ + テストで見出し確認 |
| OCR にない情報を断定しない | プレースホルダ雛形のみ生成、空入力は `要確認`/`不明` |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## リスク / 不明点

- 既存実装が AC をほぼ満たしているため、**過剰なリファクタを避け**、型整理とテスト・整合確認に集中する。
- output-format.md とコードの差分が見つかった場合の正は **ドキュメント側**(コードを合わせる)。
- 生成の「内容充実」を求めない(LLM は Phase 6)。スコープクリープに注意。
