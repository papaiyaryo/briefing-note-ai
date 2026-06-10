# [Phase 1] ESLint / Prettier を設定する

## Phase

Phase 1: 開発環境・Docker

## Priority

Medium

## Labels

- phase:1
- mvp
- setup

## Goal

実装開始後のコード品質と整形ルールを統一する。

## Scope

- ESLint 設定を追加する
- Prettier 設定を追加する
- lint / format scripts を package.json に追加する

## Out of Scope

- 大規模な既存コード整形
- CI workflow の作成

## Acceptance Criteria

- [ ] npm run lint が実行できる
- [ ] npm run format または format:check が実行できる
- [ ] 設定内容が README または docs から分かる

## Dependencies

Depends on #01-01。

## Notes

既存の Next.js 推奨設定を優先する。
