# [Phase 1] Dockerfile と docker-compose.yml を整備する

## Phase

Phase 1: 開発環境・Docker

## Priority

High

## Labels

- phase:1
- mvp
- docker
- setup

## Goal

Docker で開発サーバーを起動できる状態にする。

## Scope

- Dockerfile を作成・確認する
- docker-compose.yml を作成・確認する
- ホットリロードとポート設定を確認する

## Out of Scope

- 本番用最適化イメージ
- 外部 API コンテナ連携

## Acceptance Criteria

- [ ] docker compose up で Next.js dev server が起動する
- [ ] ホストからアプリにアクセスできる
- [ ] node_modules や .env が不要にコミットされない

## Dependencies

Depends on #01-01。

## Notes

現在のフェーズの中心 Issue。
