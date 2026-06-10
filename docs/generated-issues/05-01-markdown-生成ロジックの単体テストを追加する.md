# [Phase 5] Markdown 生成ロジックの単体テストを追加する

## Phase

Phase 5: MVP品質改善・テスト

## Priority

High

## Labels

- phase:5
- mvp
- test

## Goal

Markdown 出力が安定し、不明情報を断定しないことをテストで保証する。

## Scope

- 通常ケースのテストを追加する
- 企業名未入力ケースをテストする
- 要確認 / 不明の扱いをテストする

## Out of Scope

- LLM 出力テスト
- E2E テスト

## Acceptance Criteria

- [ ] Markdown 生成関数の主要ケースがテストされている
- [ ] npm test で通る
- [ ] docs/output-format.md とのズレが検出しやすい

## Dependencies

Depends on #01-05 and #04-02。

## Notes

将来 LLM 実装に置き換える際の仕様テストになる。
