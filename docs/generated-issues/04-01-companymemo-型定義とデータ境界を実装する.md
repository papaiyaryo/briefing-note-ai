# [Phase 4] CompanyMemo 型定義とデータ境界を実装する

## Phase

Phase 4: Markdown生成・ダミーOCR

## Priority

High

## Labels

- phase:4
- mvp
- frontend
- backend

## Goal

OCR 結果、企業情報、生成 Markdown を扱う型を明確にする。

## Scope

- CompanyMemo または BriefingNote 型を定義する
- 処理状態の型を定義する
- UI と生成ロジックの境界を整理する

## Out of Scope

- DB 永続化
- Google Drive 保存用モデル

## Acceptance Criteria

- [ ] 型定義が UI とロジックから参照できる
- [ ] 事実・所感・要確認情報を分ける余地がある
- [ ] MVP 外の保存前提を持ち込んでいない

## Dependencies

Depends on Phase 3 UI state needs。

## Notes

docs/architecture.md の BriefingNote 案を踏まえる。
