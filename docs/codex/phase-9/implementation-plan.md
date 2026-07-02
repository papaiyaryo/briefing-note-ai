# Phase 9 実装計画: 企業比較・面接前復習

## Phase 目的

構造化された企業メモ（`CompanyMemoStructured`）を、複数企業の比較や面接直前の復習に再利用できるようにする。
MVP の単一メモ機能（Phase 4〜6）や Web 補足（Phase 8）で作った型は変更せず、比較・復習専用の読み取りレイヤーとして追加する。

## 対象 Issue 一覧

| Issue | 生成元 | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- | --- |
| #44 | 09-01 | 企業比較用データ構造を設計する | Low | 基盤（設計のみ） |
| #45 | 09-02 | 企業比較テーブルと志望度メモ機能を実装する | Low | 比較 UI 実装 |
| #46 | 09-03 | 面接前復習モードと ES 接続ポイント生成を実装する | Low | 面接前復習 UI 実装 |

## 実装順序と依存関係

```text
#44 (データ構造設計: 基盤)
  ├─> #45 (比較テーブル / 志望度メモ)
  └─> #46 (面接前復習 / ES 接続ポイント)
```

推奨実装順: **#44 → #45 → #46**（#45 と #46 は #44 完了後、並行実装も可能）

理由:

- **#44** は `CompanyComparisonEntry` 等の型と、志望度・懸念点・Web 補足の扱い方針を固定する基盤 Issue。GitHub Issue の Out of Scope に「比較 UI 実装」「企業データベース構築」が含まれるため、この Issue ではコードを実装せず、設計ドキュメント（`docs/company-comparison-design.md`）のみを成果物とする。
- **#45** は #44 の型定義を前提に、複数メモ選択・比較テーブル・志望度メモ編集 UI を実装する。
- **#46** は #44 の `source.esPoints` / `source.questions` / `source.idealCandidate` を前提に、面接前復習ビューと ES 接続ポイント生成を実装する。#45 の比較テーブルとは独立して着手できるため、#45 と並行実装してもよい。

各 Issue は **1 Issue = 1 Branch = 1 PR**。複数 Issue を 1 PR にまとめない。

## 共有設計判断（Phase 全体で固定）

- 比較専用の型は `CompanyMemoStructured` / `BriefingNote` を変更せず、新しいモジュール（想定: `src/lib/comparison/`）に分離する。単一メモ機能（MVP）と比較機能のデータを混在させない。
- 志望度（`aspiration`）・比較用懸念点（`comparisonConcerns`）は Phase 9 で新規に追加するフィールドであり、MVP の型には追加しない。
- Web 由来情報は `status === "adopted"` のもののみ比較に使う。紙メモ由来情報とは常にセクション・フィールドを分離する（`docs/web-supplement-design.md` の方針を踏襲）。
- サーバー側 DB 永続化は Phase 9 でも行わない。志望度メモ等の保存が必要な場合はブラウザ内 state / `localStorage` の範囲に留める。
- 不確実な情報の表記は `docs/output-format.md` の `要確認` / `不明` / `未使用` を踏襲する。

詳細な型定義・比較観点・志望度/懸念点の扱いは `docs/company-comparison-design.md` を正準とする。

## Phase 全体の検証方針

- **#44**: ドキュメントのみの変更。`docs/` は `.prettierignore` の対象のため、format/lint/typecheck/test/build の実行は不要。
- **#45 / #46**: 実装を伴うため、各 PR で以下を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

- 比較・復習ロジック（データ整形、Markdown 変換等）は Vitest で単体テストを追加する。
- LLM を使う場合（#46 の ES 接続ポイント生成等）は、Phase 6 と同様にダミープロバイダー固定またはモックで決定的に検証し、実 API キーなしで CI を通す。

## スコープ外（Phase 9 では実装しない）

- 企業データベースの構築
- 志望度・懸念点のサーバー側永続化
- 自動応募管理、本格 CRM 化
- 面接日程管理、カレンダー連携

## リスク / 留意点

- 比較専用フィールドを既存 `CompanyMemoStructured` に混ぜてしまうと、MVP の単一メモ機能と分離できなくなる → `docs/company-comparison-design.md` の型設計（`CompanyComparisonSource` で必要フィールドのみ抽出）を正準とする。
- 志望度・懸念点の永続化方針が未確定のまま UI 実装が先行すると手戻りが起きる → #45 着手前に保存方針（state のみ or `localStorage`）を確定する。
