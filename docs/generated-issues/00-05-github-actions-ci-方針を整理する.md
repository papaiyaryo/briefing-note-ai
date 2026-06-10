# [Phase 0] GitHub Actions / CI 方針を整理する

## Phase

Phase 0: 設計・開発準備

## Priority

Medium

## Labels

- phase:0
- mvp
- docs
- setup

## Goal

MVP 開発で最低限必要な CI 方針を決め、後続の設定 Issue に渡せる状態にする。

## Scope

- CI で実行する npm scripts の候補を整理する
- lint / test / build の実行順を決める
- 秘密情報を使わない CI 方針を docs に記録する

## Out of Scope

- 実際の workflow yaml 作成
- 外部 API を使う E2E の実行

## Acceptance Criteria

- [ ] CI 方針が docs または README に記録されている
- [ ] MVP で必要なチェックが列挙されている
- [ ] OpenAI / Google Drive の秘密情報を使わない方針が明記されている

## Dependencies

Depends on Phase 1 の package scripts 方針。

## Notes

workflow 実装は開発環境が固まってから行う。
