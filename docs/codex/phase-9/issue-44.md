# Issue #44 設計: 企業比較用データ構造を設計する

対象 GitHub Issue: #44（`docs/generated-issues/09-01-企業比較用データ構造を設計する.md`）
Phase: 9 / 優先度: Low / 実装順: **1 番目（基盤・設計のみ）**

## Issue 概要

複数の企業メモ（`CompanyMemoStructured`）を比較できるように、比較観点とデータ構造を定義する。
GitHub Issue の Out of Scope に「比較 UI 実装」「企業データベース構築」が含まれるため、この Issue では**コードを実装せず**、設計ドキュメントの作成のみを行う。

## スコープ

- 比較観点を定義する。
- `CompanyMemo`（`CompanyMemoStructured`）拡張の型設計を行う。
- 志望度メモ・懸念点の扱いを整理する。

## スコープ外

- 比較 UI 実装（#45）。
- 企業データベース構築。
- 面接前復習モード・ES 接続ポイント生成ロジック（#46）。
- 型の実装（TypeScript ファイルへのコード追加）。この Issue では設計ドキュメント内の型案として示すのみ。

## 共有設計判断（Phase 計画より）

- 比較専用の型は既存 `CompanyMemoStructured` / `BriefingNote` を変更せず分離する（想定配置: `src/lib/comparison/`）。
- 志望度・比較用懸念点は Phase 9 で新規追加するフィールドとし、MVP の型には追加しない。
- Web 由来情報は `status === "adopted"` のみ比較対象とし、紙メモ由来情報と分離する。
- サーバー側 DB 永続化は行わない。

## 成果物

1. `docs/company-comparison-design.md`（新規）
   - 比較観点の定義（基本情報・事業内容・強み・求める人物像・志望度・懸念点・ES/面接対策・Web 由来補足）
   - `CompanyComparisonEntry` 等の型設計案（`CompanyAspirationNote` / `CompanyComparisonSource` / `ComparisonConcern` / `ComparisonWebHighlight`）
   - 志望度メモの入力・保存・更新方針
   - 懸念点の扱い（元メモ由来 `origin: "memo"` とユーザー追記 `origin: "user"` の分離）
   - Web 由来情報の扱い（`adopted` のみ採用、出典表記の維持）
   - 比較 Markdown 出力イメージ（#45 実装時の参考）
   - #45 / #46 への引き継ぎ事項
2. `docs/codex/phase-9/implementation-plan.md`（新規、Phase 9 全体の実装計画）
3. `docs/codex/phase-9/issue-44.md`（本ファイル）

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 比較に使う項目が定義されている | `docs/company-comparison-design.md` の「比較観点の定義」表 |
| ES / 面接対策に使う観点が含まれる | 同ドキュメントの「ES/面接対策」観点（`esPoints` / `questions` / `idealCandidate` / `strengths`） |
| MVP の単一メモ機能と分離されている | 「MVP との境界」節、および `CompanyComparisonEntry` が `CompanyMemoStructured` を変更せず読み取り専用ビューとして分離される型設計 |

## 検証コマンド

ドキュメントのみの変更であり、`docs/` は `.prettierignore` の対象（コード変更なし）のため、`lint` / `typecheck` / `test` / `build` の実行は不要。

## リスク / 不明点

- 志望度・懸念点の永続化方法（state のみ or `localStorage`）は未確定 → #45 着手前に確定する必要がある（`implementation-plan.md` のリスク節に記載）。
- 比較専用の `id` 発行方法（UUID 等）は本 Issue では確定せず、#45 の実装時に決定する。
