# Phase 4 実装計画: MVP データフロー(Markdown 生成・ダミー OCR)

## Phase 目的

Phase 3 で組み立てた MVP UI(アップロード → OCR 確認 → Markdown 編集の 3 ステップ)に、
ローカル完結のデータフローを接続する。外部 API を使わずに、ユーザーが次の一連の操作を
最後まで完了できる状態にする。

1. 画像をアップロードする
2. ダミー OCR テキストを得る
3. 入力情報と OCR テキストから構造化 Markdown を生成する
4. Markdown を編集・プレビューする
5. 編集後の内容を `.md` としてダウンロードする

この Phase は LLM / OpenAI 導入前の **deterministic(決定的)な仮実装** を完成させることが目的であり、
Phase 6 で実 OCR / 実 LLM 境界に差し替えられるよう、型と関数の境界を明確にしておく。

## 対象 Issue 一覧

| Issue | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- |
| #22 | CompanyMemo 型定義とデータ境界を実装する | High | 基盤(型) |
| #23 | Markdown 生成ロジックを UI から分離して実装する | High | 生成ロジック |
| #26 | サンプルデータとデモ用入力を整備する | Medium | テスト/デモ用データ |
| #24 | ダミー OCR フローを実装する | High | OCR 境界(仮実装) |
| #25 | .md ダウンロード機能とファイル名生成を実装する | High | 出力 |

## 実装順序と依存関係

```text
#22 (型定義: 基盤)
  └─> #23 (Markdown 生成ロジック / 型を利用)
        └─> #26 (サンプル OCR テキスト + サンプル Markdown)
              └─> #24 (ダミー OCR が #26 のサンプルを返す)
        └─> #25 (#23 の生成結果と編集結果を .md 出力)
```

推奨実装順: **#22 → #23 → #26 → #24 → #25**

理由:
- #22 はすべての土台。型がないと #23 以降の引数・戻り値が定まらない。
- #23 は #22 の型に依存し、`docs/output-format.md` と整合させる。
- #26(サンプル OCR テキスト)は #24 のダミー OCR が返す中身になるため、#24 より前に用意する。
  サンプル Markdown は #23 の生成ロジックの出力例・テスト期待値として使う。
- #24 は #26 のサンプルを使ってアップロード → OCR 確認 → 生成まで通す。
- #25 は #23 の生成結果(または編集後テキスト)を出力する最終段。#03-05 の配置済みダウンロードボタンを有効化する。

各 Issue は **1 Issue = 1 Branch = 1 PR**。複数 Issue を 1 PR にまとめない。

## 共有設計判断(Phase 全体で固定)

Codex が実装中に大きな設計判断をしなくて済むよう、以下を Phase 4 の共通決定として固定する。

### 1. 正準型は `BriefingNote`

- `docs/architecture.md` のデータモデル案に合わせ、集約型の正式名称を **`BriefingNote`** とする。
  Issue #04-01 タイトルの「CompanyMemo」は同義の呼称として扱い、コード上は `BriefingNote` に統一する。
- 既存の `CompanyEventInfo`(企業名・イベント名・日時)は **ユーザー入力の部分集合** として維持し、
  `BriefingNote` がそれを内包する形にする。`CompanyEventInfo` の定義場所は移動してよいが、
  既存の import パス互換のため `src/lib/markdown.ts` からの re-export を残す。
- MVP では永続化しないため、`id` / `createdAt` / `updatedAt` は **任意(optional)** とし、
  DB 前提のフィールドを必須にしない。

### 2. ファイル配置(`src/lib/` 配下)

| ファイル | 状態 | 責務 |
| --- | --- | --- |
| `src/lib/types.ts` | 新規 | `BriefingNote`、`ProcessingState`、`OcrResult` などの共有型 |
| `src/lib/markdown.ts` | 既存・改修 | `buildMarkdownTemplate` を型付き入力に整理。プレビュー用パーサーは現状維持 |
| `src/lib/ocr.ts` | 新規 | ダミー OCR 境界 `runDummyOcr`(将来 `runOcr` に差し替え可能なシグネチャ) |
| `src/lib/sampleData.ts` | 新規 | 架空企業のサンプル OCR テキスト・サンプル Markdown |
| `src/lib/download.ts` | 新規 | `buildMarkdownFileName` と `downloadMarkdown`(Blob + anchor) |

`src/lib/sample.ts`(現状 `normalizeWhitespace` のみ)は触らない。サンプルデータは `sampleData.ts` に分離する。

### 3. 純粋ロジックと UI の分離

- 生成・ファイル名生成・ダミー OCR の中核は **UI 非依存の純粋関数 / Promise** として `src/lib/` に置き、
  `BriefingNoteFlow.tsx` からはそれを呼ぶだけにする。
- DOM 操作が必要なダウンロード実行(`downloadMarkdown`)のみ、ブラウザ API に依存してよい。
  ただしファイル名生成 `buildMarkdownFileName` は純粋関数に保ち、単体テスト可能にする。

### 4. deterministic / ネットワーク不使用

- Phase 4 では OpenAI / Vision API / Web 取得を一切呼ばない。実 API キーを必要としない。
- ダミー OCR は `setTimeout` 程度の擬似遅延のみで、ネットワークアクセスを行わない。
- 生成 Markdown は入力に対して決定的(同じ入力 → 同じ出力)にする。

### 5. プライバシー / ログ方針(AGENTS.md・architecture.md 準拠)

- 画像内容、OCR 全文、生成 Markdown、個人情報を不要に `console.log` 等へ出さない。
- サンプルデータは実在企業名・実在の選考情報・個人情報を含めない(架空企業のみ)。

### 6. 不確実情報の表記

- `docs/output-format.md` の規約に従い、`要確認` / `不明` / `未使用` を使い分ける。
- OCR にない情報を断定しない。生成ロジックは空入力を `要確認` 等にフォールバックする。

## 既存実装との関係(Phase 3 からの引き継ぎ)

- `BriefingNoteFlow.tsx` には既にダミー的な `handleRunOcr` / `handleGenerateMarkdown`(擬似遅延 + テンプレ生成)がある。
  Phase 4 ではこれを **正式な lib 関数呼び出しに置き換える**(ロジックの二重定義を残さない)。
- `handleRunOcr` は現状 `ocrText` を空のままステップ遷移している。#24 で `runDummyOcr` の結果を `ocrText` に設定する。
- `MarkdownEditStep.tsx` のダウンロードボタンは現在 `disabled`。#25 で有効化し、空のときのみ無効にする。
- `buildMarkdownTemplate` は既に UI 非依存だが、#23 で型入力に整理し `output-format.md` 整合を再確認する。

## Phase 全体の検証方針

各 Issue の PR で最低限以下を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

加えて手動で MVP フローを通す:

1. 画像をアップロード → OCR 確認に進む
2. ダミー OCR テキストが表示される
3. Markdown を生成 → 編集 → プレビューが追従する
4. `.md` をダウンロードし、ファイル名と中身を確認する
5. 企業名なし / OCR 失敗ケースのフォールバック挙動を確認する

ロジック系 Issue(#23, #25 のファイル名生成)は Vitest による単体テストを追加する。
本格的なテスト網羅は Phase 5 で行うため、ここでは中核関数の基本ケースに留める。

## スコープ外(Phase 4 では実装しない)

- OpenAI API / Vision API の実接続(Phase 6)
- Structured Outputs / JSON Schema 定義(Phase 6)
- Web 補足情報の取得・統合(Phase 8)
- Google Drive 保存・サーバー側保存・DB 永続化(Phase 7 / Post-MVP)
- ユーザーアカウント、複数端末同期、企業比較、面接準備モード

## リスク / 留意点

- **型の重複**: `CompanyEventInfo` の移動で import パスが壊れないよう re-export を維持する。
- **生成ロジックの責務肥大**: #23 では LLM 相当の「内容生成」までやらず、テンプレ + 既知情報の差し込みに留める。
- **ダウンロードのテスト性**: DOM 依存部分はテストせず、`buildMarkdownFileName` の純粋関数のみテストする。
- **ファイル名 sanitize**: OS で問題になる文字(`\ / : * ? " < > |` と制御文字)を除去し、空になったら日時フォールバックする。
