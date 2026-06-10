# [Phase 6] OpenAI API 連携設計とサーバー側境界を整理する

## Phase

Phase 6: OpenAI API連携

## Priority

Medium

## Labels

- phase:6
- post-mvp
- openai
- llm
- backend
- docs

## Goal

OpenAI API キーをクライアントに露出せず OCR / 構造化を扱う設計を作る。

## Scope

- API Route の責務を整理する
- 入力画像と OCR テキストの扱いを定義する
- 環境変数とログ方針を決める

## Out of Scope

- OpenAI API 実装
- Google Drive 連携

## Acceptance Criteria

- [ ] OpenAI API キーがサーバー側だけで扱われる設計である
- [ ] 送信データと保存しないデータが明確である
- [ ] コスト・ログ方針の TODO が整理されている

## Dependencies

Depends on MVP completion。

## Notes

公式 OpenAI docs は実装時に最新確認する。
