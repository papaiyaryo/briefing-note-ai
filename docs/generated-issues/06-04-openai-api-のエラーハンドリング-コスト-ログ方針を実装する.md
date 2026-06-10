# [Phase 6] OpenAI API のエラーハンドリング・コスト・ログ方針を実装する

## Phase

Phase 6: OpenAI API連携

## Priority

Medium

## Labels

- phase:6
- post-mvp
- openai
- llm
- security

## Goal

API 失敗時や高コスト化を安全に扱える状態にする。

## Scope

- レート制限・タイムアウト・入力不正のエラーを整理する
- 利用コストの見積もりと注意を docs に記録する
- OCR 全文や画像内容を不要にログ出力しない

## Out of Scope

- 課金ダッシュボード連携
- ユーザー別利用量管理

## Acceptance Criteria

- [ ] 主要エラーが UI に安全に表示される
- [ ] ログに秘密情報や OCR 全文が残らない
- [ ] コスト方針が docs に残っている

## Dependencies

Depends on #06-02。

## Notes

本番化前の必須確認。
