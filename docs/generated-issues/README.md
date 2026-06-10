# Generated Issues

## 目的

このディレクトリは、briefing-note-ai の開発を GitHub Issue に分解して管理するための作業ログです。
Phase 0 から Phase 10 までの Issue 本文案と、GitHub Issue 作成結果を保存します。

開発では `1 Issue = 1 Branch = 1 PR` を守り、各 Issue の Scope と Acceptance Criteria に沿って実装します。

## ファイル構成

- `created-issues.md`: GitHub 上に作成済みの Issue URL とローカル本文ファイルの対応表
- `00-*.md`: Phase 0 の設計・開発準備 Issue
- `01-*.md`: Phase 1 のプロジェクト基盤 Issue
- `02-*.md`: Phase 2 の MVP UI デザイン Issue
- `03-*.md`: Phase 3 の MVP フロントエンド UI Issue
- `04-*.md`: Phase 4 の MVP データフロー Issue
- `05-*.md`: Phase 5 の MVP 品質確認 Issue
- `06-*.md`: Phase 6 の OpenAI API 連携 Issue
- `07-*.md`: Phase 7 の Google Drive 連携 Issue
- `08-*.md`: Phase 8 の Web 補足情報 Issue
- `09-*.md`: Phase 9 の企業比較・面接準備 Issue
- `10-*.md`: Phase 10 のポートフォリオ・開発ログ Issue

## Phase 区分

### MVP までに扱う Phase

- Phase 0: 設計・開発準備
- Phase 1: プロジェクト基盤
- Phase 2: MVP UI デザイン
- Phase 3: MVP フロントエンド UI
- Phase 4: MVP データフロー
- Phase 5: MVP 品質確認

### Post-MVP として扱う Phase

- Phase 6: OpenAI API 連携
- Phase 7: Google Drive 連携
- Phase 8: Web 補足情報
- Phase 9: 企業比較・面接準備
- Phase 10: ポートフォリオ・開発ログ

Post-MVP の Issue は、MVP Issue の中で先行実装しません。
必要な場合は、Follow-up Tasks として記録します。

## Issue 本文の読み方

各 Issue ファイルは次の項目を持ちます。

- `Phase`: 開発フェーズ
- `Priority`: 優先度
- `Labels`: GitHub Issue に付ける想定ラベル
- `Goal`: Issue の目的
- `Scope`: この Issue で実施すること
- `Out of Scope`: この Issue で実施しないこと
- `Acceptance Criteria`: 完了条件
- `Dependencies`: 依存する Issue や前提
- `Notes`: 補足

## 運用ルール

- Issue に着手する前に、対応する Markdown ファイルと関連 docs を読む。
- ブランチ名は `issue-{number}-{short-description}` を基本にする。
- 1つのPRで複数Issueを解決しない。
- MVP 外機能は、MVP Issue に混ぜずに後続 Issue として扱う。
- PR 本文は日本語で書き、Summary / Changes / Test Plan / Out of Scope / Follow-up Tasks / Related Issue を含める。
- Human Merge までは、PR を作成して止める。

## 現在の追跡方法

GitHub Issue 作成後の対応関係は `created-issues.md` で確認します。
Issue 本文を更新した場合は、必要に応じて GitHub Issue 本体とのズレを確認してください。
