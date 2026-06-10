# [Phase 6] Structured Outputs / JSON Schema を定義する

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

OCR 結果を直接 Markdown 化せず、企業研究用の構造化 JSON に変換する。

## Scope

- CompanyMemo 用 JSON Schema を定義する
- 事実・所感・要確認を分離する
- Structured Outputs のバリデーションを実装する

## Out of Scope

- Web 由来情報の統合
- 企業比較データ構造

## Acceptance Criteria

- [ ] LLM 出力の JSON Schema が定義されている
- [ ] 不確実情報が要確認として表現される
- [ ] Markdown 生成前に構造化データを検証できる

## Dependencies

Depends on #06-01 and #04-01。

## Notes

AI / LLM Output Rules を必ず反映する。
