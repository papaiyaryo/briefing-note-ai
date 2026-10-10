# Issue #44 設計サマリー: 企業比較用データ構造を設計する

## Issue 概要

複数の企業メモを比較できるように、Markdown / 構造化メモから扱う比較用データ構造を定義する。

## Scope

- 比較観点を定義する。
- `CompanyMemo` / `CompanyMemoStructured` を直接変更しない比較専用構造を設計する。
- 志望度メモ、懸念点、Web 補足情報の扱いを整理する。

## Out of Scope

- 比較 UI 実装
- 企業データベース構築
- サーバー永続化
- LLM / OCR の実装変更

## 実装ステップ

1. 既存の `CompanyMemoStructured` と Web 補足設計を確認する。
2. 比較に使う項目を、基本情報、事業内容、強み、求める人物像、志望度、懸念点、ES / 面接対策、Web 補足に整理する。
3. MVP の単一メモ機能と分離した `CompanyComparisonEntry` を設計する。
4. 志望度メモ、懸念点、Web 補足の origin / source 分離方針を明記する。
5. `docs/company-comparison-design.md` と Phase 9 の Codex 設計ドキュメントを追加する。

## 変更予定ファイル

- `docs/company-comparison-design.md`
- `docs/codex/phase-9/implementation-plan.md`
- `docs/codex/phase-9/issue-44.md`

## Acceptance Criteria 対応

| Acceptance Criteria | 対応方針 |
| --- | --- |
| 比較に使う項目が定義されている | 比較観点表でカテゴリ、項目、入力元、用途を定義する |
| ES / 面接対策に使う観点が含まれる | `esPoints`、`questions`、`idealCandidate`、`strengths` を比較・準備項目に含める |
| MVP の単一メモ機能と分離されている | 既存型を変更せず、比較専用の派生構造として設計する |

## 検証コマンド

ドキュメントのみの変更のため、lint / typecheck / test / build は必須対象外。

必要に応じて以下を確認する。

```bash
git diff --check
```

## リスク / 不明点

- Issue #45 以降で UI 実装に入る際、実際の保存形式やローカル状態管理の詳細を追加で決める必要がある。
- Web 補足情報の採用状態をどの層で保持するかは、Phase 8 実装との接続時に再確認する。
