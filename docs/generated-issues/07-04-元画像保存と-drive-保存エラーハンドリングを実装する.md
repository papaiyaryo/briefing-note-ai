# [Phase 7] 元画像保存と Drive 保存エラーハンドリングを実装する

## Phase

Phase 7: Google Drive連携

## Priority

Low

## Labels

- phase:7
- post-mvp
- google-drive
- security

## Goal

必要に応じて元画像も保存し、Drive 保存失敗時の復旧導線を用意する。

## Scope

- 元画像保存の可否をユーザーが選べるようにする
- 容量・権限・通信エラーを扱う
- 保存失敗時でも .md ダウンロードに戻れる導線を作る

## Out of Scope

- 自動バックアップ
- 複数端末同期

## Acceptance Criteria

- [ ] 元画像保存は明示的な操作または設定で行われる
- [ ] Drive 保存失敗時にローカルダウンロードが案内される
- [ ] 画像内容を不要にログ出力しない

## Dependencies

Depends on #07-03。

## Notes

画像には個人情報が含まれる可能性がある。
