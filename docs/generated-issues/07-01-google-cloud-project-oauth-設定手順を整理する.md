# [Phase 7] Google Cloud Project / OAuth 設定手順を整理する

## Phase

Phase 7: Google Drive連携

## Priority

Low

## Labels

- phase:7
- post-mvp
- google-drive
- docs
- security

## Goal

Google Drive 連携に必要な OAuth と権限設定を安全に準備する。

## Scope

- Google Cloud Project の設定手順を docs に整理する
- OAuth consent と redirect URI の方針を決める
- 必要最小権限のスコープを整理する

## Out of Scope

- Google ログイン実装
- Drive ファイル保存

## Acceptance Criteria

- [ ] 設定手順に秘密情報が含まれない
- [ ] 必要な OAuth scope が明確である
- [ ] MVP とは別の Post-MVP 機能として整理されている

## Dependencies

Depends on MVP completion。

## Notes

認証情報は .env.example のみ記載する。
