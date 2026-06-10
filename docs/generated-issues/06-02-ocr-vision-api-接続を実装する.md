# [Phase 6] OCR / Vision API 接続を実装する

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

## Goal

アップロード画像から実 OCR または画像理解結果を取得できるようにする。

## Scope

- サーバー側で OpenAI Vision API を呼び出す
- 画像入力の検証を行う
- OCR 結果を既存 UI に返す

## Out of Scope

- Web 補足
- Google Drive 保存

## Acceptance Criteria

- [ ] API キーがフロントエンドに露出しない
- [ ] 失敗時に安全なエラーを返す
- [ ] MVP のダミー OCR と切り替え可能である

## Dependencies

Depends on #06-01 and MVP upload flow。

## Notes

個人情報を含む画像の扱いに注意する。
