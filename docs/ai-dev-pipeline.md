# AI 駆動開発パイプライン設計

## 目的

このドキュメントは、Issue 設計・実装・レビューを AI で自動化する開発パイプラインの設計を定義します。
これまで PR レビューに使っていた Qodo を Claude Code に置き換え、各ステップを GitHub 上のトリガーで連携させます。

実際の workflow 実装は `.github/workflows/` に置き、この文書では役割分担・トリガー・課金方針・セットアップ手順を定義します。

## 役割分担

| ステップ | 担当 | 実行基盤 | 認証 / 課金 |
|---|---|---|---|
| Phase / Issue 設計 | Claude Code | GitHub Actions (`claude-code-action`) | `CLAUDE_CODE_OAUTH_TOKEN`（Claude サブスク枠） |
| 実装 + PR 作成 | Codex | Codex Cloud（OpenAI の GitHub App） | ChatGPT サブスク枠 |
| PR レビュー | Claude Code | GitHub Actions (`claude-code-action`) | `CLAUDE_CODE_OAUTH_TOKEN`（Claude サブスク枠） |
| CI（lint/type/test/build） | GitHub Actions | `ci.yml`（既存） | GitHub Actions 実行時間のみ |
| Phase 承認・最終 Merge | Human | GitHub UI | - |

**課金方針: API 従量課金は使わない。** Claude 側は `setup-token` で発行した OAuth トークンを使い、月額サブスクの利用枠（週次リミット）だけを消費する。Codex 側は Codex Cloud がサブスクに含まれる。追加で発生するのは GitHub Actions の実行時間のみ（public は無料、private は月 2000 分の無料枠内）。

## 全体フロー

```txt
Issue 作成 (Human)
  → @claude 設計依頼
  → Claude が docs/codex/phase-N/issue-X.md を生成しコミット      [claude.yml]
  → Phase 設計レビュー・承認 (Human gate)
  → @codex 実装依頼
  → Codex が branch 作成・実装・PR 作成                          [Codex Cloud]
  → PR open で Claude が自動レビューコメント                      [claude-review.yml]
  → CI 実行 (lint/typecheck/test/build)                          [ci.yml]
  → 指摘修正 (Codex / Claude)
  → CI green + Human が最終 Merge (Human gate)
```

既存の `AGENTS.md` のワークフロー（1 Issue = 1 Branch = 1 PR、Phase 承認ゲート、Human Merge）はそのまま維持する。AI のレビュー担当だけが Copilot/Qodo から Claude Code に変わる。

## トリガー設計

制御は **メンション駆動** を基本とし、人間の承認ポイントを残す。レビューのみ PR open で自動起動する。

| トリガー | 起動する workflow | 動作 |
|---|---|---|
| Issue / PR コメントに `@claude ...` | `claude.yml` | 指示内容を実行（設計ファイル生成、質問応答、対話レビュー） |
| Issue を `@claude` 付きで作成 | `claude.yml` | 同上 |
| PR が `opened` / `ready_for_review` | `claude-review.yml` | 自動でレビューコメントを投稿 |
| `@codex ...`（Issue/PR コメント・アサイン） | Codex Cloud（App 側） | 実装・PR 作成 |

### レート節約方針

サブスクの週次リミットを食いつぶさないため、自動起動は最小限にする。

- レビューは `pull_request` の `opened` と `ready_for_review` のみ。push ごとには走らせない（再レビューが要るときは `@claude review` を手動で打つ）。
- `concurrency` で同一 PR / Issue の多重起動を防ぐ。
- Draft PR ではレビューを起動しない。

## 追加する workflow

### 1. `.github/workflows/claude.yml`（対話・設計用）

`@claude` メンションに反応する汎用ワークフロー。設計ファイル生成や対話レビューを担う。

```yaml
name: Claude

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

concurrency:
  group: claude-${{ github.event.issue.number || github.event.pull_request.number }}
  cancel-in-progress: false

jobs:
  claude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@claude')) ||
      (github.event_name == 'issues' && contains(github.event.issue.body, '@claude'))
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
```

### 2. `.github/workflows/claude-review.yml`（自動レビュー用）

PR が開かれたら自動でレビューする。Qodo の置き換え本体。

```yaml
name: Claude Review

on:
  pull_request:
    types: [opened, ready_for_review]

concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  review:
    if: github.event.pull_request.draft == false
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-action@v1
        with:
          claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
          prompt: |
            この PR を AGENTS.md と docs/ のルールに従ってレビューしてください。
            観点:
            - 対象 Issue の Scope / Acceptance Criteria に収まっているか
            - 1 PR で複数 Issue を解決していないか
            - MVP スコープ外の機能を先行実装していないか
            - 秘密情報・APIキー・.env を含めていないか
            - 事実・所感・Web 情報を混在させていないか（Product Principle）
            - lint / typecheck / test / build が通る見込みか
            指摘は日本語で、重要度を付けて PR コメントとして投稿してください。
            スコープ外の問題は「フォローアップ Issue 候補」として分けて記載してください。
```

> Codex は OpenAI の Codex Cloud（GitHub App）が処理するため、こちらで workflow は書かない。GitHub に Codex App を連携し、Issue / PR で `@codex` または Codex 側の UI からタスクを割り当てる。

## 必要な Secrets / 連携

| 名前 | 取得方法 | 用途 |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | ローカルで `claude setup-token` を実行（Claude Pro/Max 必須）→ 出力を GitHub の Repository Secrets に登録 | Claude Action をサブスク枠で実行 |
| Codex Cloud 連携 | OpenAI の Codex GitHub App をリポジトリにインストールし、ChatGPT サブスクと連携 | Codex の実装・PR 作成（Secrets 不要、App 認証） |

`ANTHROPIC_API_KEY` は **登録しない**（登録すると従量課金経路になるため）。

## AGENTS.md の更新点

レビュー担当が変わるため、以下を書き換える。

- `Core Workflow` の `→ Copilot Review` を `→ Claude Code Review` に変更（[AGENTS.md:54](../AGENTS.md)）。
- `PR Review Rules` の "Use Copilot mainly for review..." を Claude Code 前提に書き換える。
- `PR` 節の "Request `@copilot` as a reviewer." を「PR open 時に Claude Review が自動起動する。再レビューが必要なときは `@claude review` を打つ」に変更。
- トリガー語（`@claude` / `@codex`）と各 workflow の役割を 1 節追加。

## ロールアウト順序

1. ローカルで `claude setup-token` を実行し、`CLAUDE_CODE_OAUTH_TOKEN` を Secrets に登録。
2. `claude-review.yml` を追加（まずレビュー自動化から。Qodo を停止）。
3. テスト PR を 1 本作り、レビューが起動し枠内で動くことを確認。
4. `claude.yml` を追加（設計・対話を自動化）。
5. Codex Cloud をリポジトリに連携し、`@codex` 実装フローを確認。
6. `AGENTS.md` を上記のとおり更新。

各ステップは独立して有効化できる。問題があれば該当 workflow を無効化すれば旧運用に戻せる。

## 注意点

- **追加料金は出ないが、サブスクの利用上限（週次リミット）は消費する。** Qodo のレート制限を Claude/Codex サブスクの枠に置き換える形になる。重い使い方では枠に当たるため、自動起動はレビューの `opened` のみに絞る。
- `CLAUDE_CODE_OAUTH_TOKEN` は長期トークン。Secrets 以外に出さない、ログに出さない。失効・更新時は `setup-token` を再実行して差し替える。
- フォークからの PR では Secrets が渡らないため、外部コントリビューターの PR は自動レビューが動かない。本リポジトリは個人開発のため当面問題にならない。
