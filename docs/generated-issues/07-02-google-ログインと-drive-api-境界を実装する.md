# [Phase 7] Google ログインと Drive API 境界を実装する

## Phase

Phase 7: Google Drive連携

## Priority

Low

## Labels

- phase:7
- post-mvp
- google-drive
- backend

## Goal

ユーザー認証後に Drive 保存 API を呼び出せる基盤を作る。

## Scope

- Google OAuth ログインを実装する
- Drive API クライアントのサーバー側境界を作る
- 認証エラーを安全に扱う

## Out of Scope

- 企業名フォルダ作成
- ファイル保存 UI の完成

## Acceptance Criteria

- [ ] Google 認証が完了できる
- [ ] Drive API token がクライアントに不要に露出しない
- [ ] 認証失敗時の導線がある

## Dependencies

Depends on #07-01。

## Notes

ユーザーアカウント本格管理とは分ける。
