# [Phase 1] Vitest のテスト基盤を整備する

## Phase

Phase 1: 開発環境・Docker

## Priority

Medium

## Labels

- phase:1
- mvp
- test
- setup

## Goal

Markdown 生成ロジックや UI コンポーネントをテストできる状態にする。

## Scope

- Vitest を導入する
- test script を package.json に追加する
- 最小のサンプルテストを追加する

## Out of Scope

- 本格的な単体テスト作成
- E2E テスト導入

## Acceptance Criteria

- [ ] npm test が実行できる
- [ ] テストファイルの配置方針が決まっている
- [ ] CI に載せられる実行コマンドが明確になっている

## Dependencies

Depends on #01-01。

## Notes

Phase 5 のテスト実装で利用する。
